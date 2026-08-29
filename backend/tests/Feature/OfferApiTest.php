<?php

namespace Tests\Feature;

use App\Models\DeliveryRequest;
use App\Models\Offer;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Foundation\Testing\WithFaker;
use Tests\TestCase;

class OfferApiTest extends TestCase
{
    use RefreshDatabase, WithFaker;

    private User $client;

    private User $driver;

    protected function setUp(): void
    {
        parent::setUp();
        $this->client = User::factory()->create(['role' => 'client']);
        $this->driver = User::factory()->create(['role' => 'driver']);
    }

    public function test_unauthenticated_user_cannot_create_offer(): void
    {
        $request = DeliveryRequest::factory()->create(['status' => 'OPEN']);

        $response = $this->postJson("/api/v1/requests/{$request->id}/offers", [
            'price' => 200,
        ]);

        $response->assertStatus(401);
    }

    public function test_driver_can_create_offer(): void
    {
        $request = DeliveryRequest::factory()->create(['status' => 'OPEN']);

        $response = $this->actingAs($this->driver)->postJson("/api/v1/requests/{$request->id}/offers", [
            'price' => 250,
            'message' => 'Je peux livrer rapidement',
        ]);

        $response->assertStatus(201)
            ->assertJsonStructure([
                'message',
                'offer' => ['id', 'status', 'price', 'message'],
            ]);

        $this->assertDatabaseHas('offers', [
            'delivery_request_id' => $request->id,
            'user_id' => $this->driver->id,
            'price' => 250,
            'status' => 'PENDING',
        ]);
    }

    public function test_cannot_offer_on_own_request(): void
    {
        $request = DeliveryRequest::factory()->create([
            'status' => 'OPEN',
            'user_id' => $this->client->id,
        ]);

        $response = $this->actingAs($this->client)->postJson("/api/v1/requests/{$request->id}/offers", [
            'price' => 200,
        ]);

        $response->assertStatus(422);
    }

    public function test_cannot_offer_on_draft_request(): void
    {
        $request = DeliveryRequest::factory()->create(['status' => 'DRAFT']);

        $response = $this->actingAs($this->driver)->postJson("/api/v1/requests/{$request->id}/offers", [
            'price' => 200,
        ]);

        $response->assertStatus(422);
    }

    public function test_cannot_duplicate_pending_offer(): void
    {
        $request = DeliveryRequest::factory()->create(['status' => 'OPEN']);

        $this->actingAs($this->driver)->postJson("/api/v1/requests/{$request->id}/offers", [
            'price' => 200,
        ]);

        $response = $this->actingAs($this->driver)->postJson("/api/v1/requests/{$request->id}/offers", [
            'price' => 250,
        ]);

        $response->assertStatus(422);
    }

    public function test_validation_requires_price(): void
    {
        $request = DeliveryRequest::factory()->create(['status' => 'OPEN']);

        $response = $this->actingAs($this->driver)->postJson("/api/v1/requests/{$request->id}/offers", []);

        $response->assertStatus(422);
    }

    public function test_owner_can_list_offers(): void
    {
        $request = DeliveryRequest::factory()->create(['user_id' => $this->client->id, 'status' => 'OPEN']);
        Offer::factory()->count(3)->create(['delivery_request_id' => $request->id]);

        $response = $this->actingAs($this->client)->getJson("/api/v1/requests/{$request->id}/offers");

        $response->assertOk()
            ->assertJsonCount(3, 'offers');
    }

    public function test_non_owner_cannot_list_offers(): void
    {
        $request = DeliveryRequest::factory()->create(['user_id' => $this->client->id, 'status' => 'OPEN']);

        $response = $this->actingAs($this->driver)->getJson("/api/v1/requests/{$request->id}/offers");

        $response->assertStatus(403);
    }

    public function test_owner_can_accept_offer(): void
    {
        $request = DeliveryRequest::factory()->create(['user_id' => $this->client->id, 'status' => 'OPEN']);
        $offer = Offer::factory()->create([
            'delivery_request_id' => $request->id,
            'user_id' => $this->driver->id,
            'status' => 'PENDING',
        ]);

        $response = $this->actingAs($this->client)->postJson("/api/v1/offers/{$offer->id}/accept");

        $response->assertOk();
        $this->assertDatabaseHas('offers', ['id' => $offer->id, 'status' => 'ACCEPTED']);
        $this->assertDatabaseHas('delivery_requests', ['id' => $request->id, 'status' => 'MATCHED']);
    }

    public function test_accepting_offer_rejects_other_pending(): void
    {
        $request = DeliveryRequest::factory()->create(['user_id' => $this->client->id, 'status' => 'OPEN']);
        $accepted = Offer::factory()->create([
            'delivery_request_id' => $request->id,
            'user_id' => $this->driver->id,
            'status' => 'PENDING',
        ]);
        $otherDriver = User::factory()->create(['role' => 'driver']);
        $other = Offer::factory()->create([
            'delivery_request_id' => $request->id,
            'user_id' => $otherDriver->id,
            'status' => 'PENDING',
        ]);

        $this->actingAs($this->client)->postJson("/api/v1/offers/{$accepted->id}/accept");

        $this->assertDatabaseHas('offers', ['id' => $other->id, 'status' => 'REJECTED']);
    }

    public function test_owner_can_reject_offer(): void
    {
        $request = DeliveryRequest::factory()->create(['user_id' => $this->client->id, 'status' => 'OPEN']);
        $offer = Offer::factory()->create([
            'delivery_request_id' => $request->id,
            'user_id' => $this->driver->id,
            'status' => 'PENDING',
        ]);

        $response = $this->actingAs($this->client)->postJson("/api/v1/offers/{$offer->id}/reject", [
            'rejection_reason' => 'Trop cher',
        ]);

        $response->assertOk();
        $this->assertDatabaseHas('offers', [
            'id' => $offer->id,
            'status' => 'REJECTED',
            'rejection_reason' => 'Trop cher',
        ]);
    }

    public function test_driver_can_withdraw_offer(): void
    {
        $request = DeliveryRequest::factory()->create(['status' => 'OPEN']);
        $offer = Offer::factory()->create([
            'delivery_request_id' => $request->id,
            'user_id' => $this->driver->id,
            'status' => 'PENDING',
        ]);

        $response = $this->actingAs($this->driver)->postJson("/api/v1/offers/{$offer->id}/withdraw");

        $response->assertOk();
        $this->assertDatabaseHas('offers', ['id' => $offer->id, 'status' => 'WITHDRAWN']);
    }

    public function test_cannot_withdraw_other_drivers_offer(): void
    {
        $request = DeliveryRequest::factory()->create(['status' => 'OPEN']);
        $otherDriver = User::factory()->create(['role' => 'driver']);
        $offer = Offer::factory()->create([
            'delivery_request_id' => $request->id,
            'user_id' => $otherDriver->id,
            'status' => 'PENDING',
        ]);

        $response = $this->actingAs($this->driver)->postJson("/api/v1/offers/{$offer->id}/withdraw");

        $response->assertStatus(403);
    }

    public function test_driver_can_browse_open_requests(): void
    {
        DeliveryRequest::factory()->count(3)->create(['status' => 'OPEN']);
        DeliveryRequest::factory()->count(2)->create(['status' => 'DRAFT']);

        $response = $this->actingAs($this->driver)->getJson('/api/v1/requests/browse');

        $response->assertOk()
            ->assertJsonCount(3, 'requests')
            ->assertJsonStructure([
                'requests' => [
                    '*' => ['id', 'title', 'stops', 'offers_count'],
                ],
                'pagination',
            ]);
    }

    public function test_browse_search_by_title(): void
    {
        DeliveryRequest::factory()->create(['status' => 'OPEN', 'title' => 'Documents urgence']);
        DeliveryRequest::factory()->create(['status' => 'OPEN', 'title' => 'Colis normal']);

        $response = $this->actingAs($this->driver)->getJson('/api/v1/requests/browse?search=urgence');

        $response->assertOk()
            ->assertJsonCount(1, 'requests');
    }

    public function test_browse_filter_by_budget(): void
    {
        DeliveryRequest::factory()->create(['status' => 'OPEN', 'budget_min' => 100, 'budget_max' => 200]);
        DeliveryRequest::factory()->create(['status' => 'OPEN', 'budget_min' => 300, 'budget_max' => 500]);

        $response = $this->actingAs($this->driver)->getJson('/api/v1/requests/browse?budget_min=250');

        $response->assertOk()
            ->assertJsonCount(1, 'requests');
    }

    public function test_unauthenticated_cannot_browse(): void
    {
        $response = $this->getJson('/api/v1/requests/browse');

        $response->assertStatus(401);
    }

    public function test_browse_shows_offers_count(): void
    {
        $request = DeliveryRequest::factory()->create(['status' => 'OPEN']);
        Offer::factory()->count(2)->create(['delivery_request_id' => $request->id]);

        $response = $this->actingAs($this->driver)->getJson('/api/v1/requests/browse');

        $response->assertOk()
            ->assertJsonPath('requests.0.offers_count', 2);
    }
}
