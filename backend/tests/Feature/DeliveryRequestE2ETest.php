<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class DeliveryRequestE2ETest extends TestCase
{
    use RefreshDatabase;

    private User $client;

    protected function setUp(): void
    {
        parent::setUp();
        $this->client = User::factory()->create(['role' => 'CLIENT']);
    }

    public function test_full_request_lifecycle(): void
    {
        $createResponse = $this->actingAs($this->client)->postJson('/api/v1/requests', [
            'title' => 'Colis urgent Casablanca to Rabat',
            'description' => 'Documents juridiques importants',
            'proposed_price' => 350,
            'stops' => [
                [
                    'type' => 'PICKUP',
                    'order' => 0,
                    'address' => '123 Rue Principale, Casablanca',
                    'latitude' => 33.5731,
                    'longitude' => -7.5898,
                    'contact_name' => 'Ahmed',
                    'contact_phone' => '0600000001',
                ],
                [
                    'type' => 'DESTINATION',
                    'order' => 1,
                    'address' => '456 Avenue Mohammed V, Rabat',
                    'latitude' => 34.0209,
                    'longitude' => -6.8416,
                    'contact_name' => 'Fatima',
                    'contact_phone' => '0600000002',
                ],
            ],
        ]);

        $createResponse->assertStatus(201)
            ->assertJsonStructure([
                'message',
                'request' => ['id', 'status', 'title'],
            ]);

        $requestId = $createResponse->json('request.id');

        $listResponse = $this->actingAs($this->client)->getJson('/api/v1/requests');

        $listResponse->assertOk();
        $this->assertGreaterThanOrEqual(1, count($listResponse->json('requests')));
        $this->assertEquals($requestId, $listResponse->json('requests.0.id'));

        $getResponse = $this->actingAs($this->client)->getJson("/api/v1/requests/{$requestId}");

        $getResponse->assertOk()
            ->assertJsonPath('request.id', $requestId)
            ->assertJsonPath('request.title', 'Colis urgent Casablanca to Rabat')
            ->assertJsonPath('request.status', 'DRAFT')
            ->assertJsonCount(2, 'request.stops');

        $updateResponse = $this->actingAs($this->client)->putJson("/api/v1/requests/{$requestId}", [
            'title' => 'Colis URGENT Casablanca to Rabat',
            'proposed_price' => 400,
        ]);

        $updateResponse->assertOk()
            ->assertJsonPath('request.title', 'Colis URGENT Casablanca to Rabat');

        $cancelResponse = $this->actingAs($this->client)->postJson("/api/v1/requests/{$requestId}/cancel", [
            'cancellation_reason' => 'Transporteur trouve',
        ]);

        $cancelResponse->assertOk()
            ->assertJsonPath('request.status', 'CANCELLED')
            ->assertJsonPath('request.cancellation_reason', 'Transporteur trouve');

        $this->assertDatabaseHas('delivery_requests', [
            'id' => $requestId,
            'status' => 'CANCELLED',
            'cancellation_reason' => 'Transporteur trouve',
        ]);

        $updateCancelled = $this->actingAs($this->client)->putJson("/api/v1/requests/{$requestId}", [
            'title' => 'Tentative',
        ]);

        $updateCancelled->assertStatus(422);
    }

    public function test_full_request_lifecycle_via_delete(): void
    {
        $createResponse = $this->actingAs($this->client)->postJson('/api/v1/requests', [
            'title' => 'Test DELETE',
        ]);

        $requestId = $createResponse->json('request.id');

        $deleteResponse = $this->actingAs($this->client)->deleteJson("/api/v1/requests/{$requestId}");
        $deleteResponse->assertOk();

        $this->assertDatabaseHas('delivery_requests', [
            'id' => $requestId,
            'status' => 'CANCELLED',
        ]);
    }
}
