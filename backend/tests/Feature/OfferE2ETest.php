<?php

namespace Tests\Feature;

use App\Models\DeliveryRequest;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class OfferE2ETest extends TestCase
{
    use RefreshDatabase;

    private User $client;

    private User $driver1;

    private User $driver2;

    protected function setUp(): void
    {
        parent::setUp();
        $this->client = User::factory()->create(['role' => 'client']);
        $this->driver1 = User::factory()->create(['role' => 'driver']);
        $this->driver2 = User::factory()->create(['role' => 'driver']);
    }

    public function test_full_marketplace_lifecycle(): void
    {
        // 1. Client creates a request
        $createResponse = $this->actingAs($this->client)->postJson('/api/v1/requests', [
            'title' => 'Livraison urgent',
            'description' => 'Carton de 5 kg',
            'vehicle_type' => 'voiture',
            'proposed_price' => 500,
            'stops' => [
                ['type' => 'PICKUP', 'order' => 0, 'address' => 'Casa'],
                ['type' => 'DESTINATION', 'order' => 1, 'address' => 'Rabat'],
            ],
        ]);

        $createResponse->assertStatus(201);
        $requestId = $createResponse->json('request.id');

        // Publish: change to OPEN
        $this->actingAs($this->client)->postJson("/api/v1/requests/{$requestId}/publish")->assertOk();

        // 2. Driver1 browses and sees the request
        $browseResponse = $this->actingAs($this->driver1)->getJson('/api/v1/requests/browse');
        $browseResponse->assertOk();
        $this->assertGreaterThanOrEqual(1, count($browseResponse->json('requests')));
        $this->assertEquals($requestId, $browseResponse->json('requests.0.id'));

        // 3. Driver1 makes an offer
        $offer1Response = $this->actingAs($this->driver1)->postJson("/api/v1/requests/{$requestId}/offers", [
            'price' => 400,
            'message' => 'Je suis dispo',
        ]);

        $offer1Response->assertStatus(201);
        $offer1Id = $offer1Response->json('offer.id');

        // 4. Driver2 also makes an offer
        $offer2Response = $this->actingAs($this->driver2)->postJson("/api/v1/requests/{$requestId}/offers", [
            'price' => 350,
        ]);

        $offer2Response->assertStatus(201);
        $offer2Id = $offer2Response->json('offer.id');

        // 5. Client lists offers
        $listResponse = $this->actingAs($this->client)->getJson("/api/v1/requests/{$requestId}/offers");
        $listResponse->assertOk()
            ->assertJsonCount(2, 'offers');

        // 6. Client accepts driver1's offer
        $acceptResponse = $this->actingAs($this->client)->postJson("/api/v1/offers/{$offer1Id}/accept");
        $acceptResponse->assertOk();

        // 7. Request is now MATCHED
        $this->assertDatabaseHas('delivery_requests', ['id' => $requestId, 'status' => 'MATCHED']);

        // 8. Driver2's offer was auto-rejected
        $this->assertDatabaseHas('offers', ['id' => $offer2Id, 'status' => 'REJECTED']);

        // 9. Cannot make another offer on matched request
        $newOffer = $this->actingAs($this->driver1)->postJson("/api/v1/requests/{$requestId}/offers", [
            'price' => 300,
        ]);

        $newOffer->assertStatus(422);
    }

    public function test_driver_can_withdraw_offer(): void
    {
        $request = DeliveryRequest::factory()->create(['status' => 'OPEN']);
        $offerResponse = $this->actingAs($this->driver1)->postJson("/api/v1/requests/{$request->id}/offers", [
            'price' => 300,
        ]);

        $offerId = $offerResponse->json('offer.id');

        $withdrawResponse = $this->actingAs($this->driver1)->postJson("/api/v1/offers/{$offerId}/withdraw");
        $withdrawResponse->assertOk();

        $this->assertDatabaseHas('offers', ['id' => $offerId, 'status' => 'WITHDRAWN']);
    }

    public function test_owner_can_reject_offer(): void
    {
        $request = DeliveryRequest::factory()->create(['user_id' => $this->client->id, 'status' => 'OPEN']);
        $offerResponse = $this->actingAs($this->driver1)->postJson("/api/v1/requests/{$request->id}/offers", [
            'price' => 300,
            'message' => 'Dispo',
        ]);

        $offerId = $offerResponse->json('offer.id');

        $rejectResponse = $this->actingAs($this->client)->postJson("/api/v1/offers/{$offerId}/reject", [
            'rejection_reason' => 'Pas assez exp\u00e9riment\u00e9',
        ]);

        $rejectResponse->assertOk();
        $this->assertDatabaseHas('offers', [
            'id' => $offerId,
            'status' => 'REJECTED',
            'rejection_reason' => 'Pas assez exp\u00e9riment\u00e9',
        ]);
    }

    public function test_browse_search_filters(): void
    {
        DeliveryRequest::factory()->create(['status' => 'OPEN', 'title' => 'Urgence m\u00e9dicale']);
        DeliveryRequest::factory()->create(['status' => 'OPEN', 'title' => 'Colis normal']);
        DeliveryRequest::factory()->create(['status' => 'DRAFT', 'title' => 'Draft request']);

        $response = $this->actingAs($this->driver1)->getJson('/api/v1/requests/browse?search=urgence');
        $response->assertOk()
            ->assertJsonCount(1, 'requests');
    }
}
