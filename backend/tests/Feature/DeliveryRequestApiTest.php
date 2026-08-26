<?php

namespace Tests\Feature;

use App\Models\DeliveryRequest;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class DeliveryRequestApiTest extends TestCase
{
    use RefreshDatabase;

    private User $client;

    protected function setUp(): void
    {
        parent::setUp();
        $this->client = User::factory()->create(['role' => 'client']);
    }

    public function test_unauthenticated_user_cannot_create_request(): void
    {
        $response = $this->postJson('/api/v1/requests', [
            'title' => 'Test',
        ]);

        $response->assertStatus(401);
    }

    public function test_client_can_create_delivery_request(): void
    {
        $response = $this->actingAs($this->client)->postJson('/api/v1/requests', [
            'title' => 'Colis important',
            'description' => 'Documents sensibles',
            'proposed_price' => 200.00,
        ]);

        $response->assertStatus(201)
            ->assertJsonStructure([
                'message',
                'request' => [
                    'id',
                    'status',
                    'title',
                    'description',
                    'proposed_price',
                ],
            ]);

        $this->assertDatabaseHas('delivery_requests', [
            'user_id' => $this->client->id,
            'title' => 'Colis important',
            'status' => 'DRAFT',
        ]);
    }

    public function test_client_can_create_request_with_stops(): void
    {
        $response = $this->actingAs($this->client)->postJson('/api/v1/requests', [
            'title' => 'Livraison',
            'stops' => [
                [
                    'type' => 'PICKUP',
                    'order' => 0,
                    'address' => '123 Rue Principale, Casablanca',
                    'latitude' => 33.5731,
                    'longitude' => -7.5898,
                ],
                [
                    'type' => 'DESTINATION',
                    'order' => 1,
                    'address' => '456 Avenue Mohammed V, Rabat',
                    'latitude' => 34.0209,
                    'longitude' => -6.8416,
                ],
            ],
        ]);

        $response->assertStatus(201);

        $request = $this->client->deliveryRequests()->first();
        $this->assertCount(2, $request->stops);
    }

    public function test_client_can_list_their_requests(): void
    {
        DeliveryRequest::factory()->count(3)->create([
            'user_id' => $this->client->id,
        ]);

        $response = $this->actingAs($this->client)->getJson('/api/v1/requests');

        $response->assertOk()
            ->assertJsonStructure([
                'requests' => [
                    '*' => ['id', 'status', 'title'],
                ],
                'pagination',
            ]);

        $this->assertCount(3, $response->json('requests'));
    }

    public function test_client_cannot_see_other_users_requests(): void
    {
        $otherUser = User::factory()->create(['role' => 'client']);
        DeliveryRequest::factory()->count(2)->create(['user_id' => $otherUser->id]);
        DeliveryRequest::factory()->count(1)->create(['user_id' => $this->client->id]);

        $response = $this->actingAs($this->client)->getJson('/api/v1/requests');

        $response->assertOk();
        $this->assertCount(1, $response->json('requests'));
    }

    public function test_client_can_view_their_request(): void
    {
        $request = DeliveryRequest::factory()->create([
            'user_id' => $this->client->id,
        ]);

        $response = $this->actingAs($this->client)->getJson("/api/v1/requests/{$request->id}");

        $response->assertOk()
            ->assertJsonPath('request.id', $request->id);
    }

    public function test_client_cannot_view_other_users_request(): void
    {
        $otherUser = User::factory()->create(['role' => 'client']);
        $request = DeliveryRequest::factory()->create([
            'user_id' => $otherUser->id,
        ]);

        $response = $this->actingAs($this->client)->getJson("/api/v1/requests/{$request->id}");

        $response->assertStatus(403);
    }

    public function test_non_existent_request_returns_404(): void
    {
        $response = $this->actingAs($this->client)->getJson('/api/v1/requests/99999');

        $response->assertStatus(404);
    }

    public function test_validation_requires_title_to_be_string(): void
    {
        $response = $this->actingAs($this->client)->postJson('/api/v1/requests', [
            'title' => 123,
        ]);

        $response->assertStatus(422);
    }

    public function test_validation_rejects_invalid_time_slot(): void
    {
        $response = $this->actingAs($this->client)->postJson('/api/v1/requests', [
            'preferred_time_slot' => 'invalid',
        ]);

        $response->assertStatus(422);
    }

    public function test_validation_rejects_invalid_stop_type(): void
    {
        $response = $this->actingAs($this->client)->postJson('/api/v1/requests', [
            'stops' => [
                ['type' => 'INVALID', 'order' => 0],
            ],
        ]);

        $response->assertStatus(422);
    }

    public function test_validation_budget_max_must_be_gte_budget_min(): void
    {
        $response = $this->actingAs($this->client)->postJson('/api/v1/requests', [
            'budget_min' => 500,
            'budget_max' => 100,
        ]);

        $response->assertStatus(422);
    }

    public function test_client_can_update_their_request(): void
    {
        $request = DeliveryRequest::factory()->create([
            'user_id' => $this->client->id,
            'status' => 'DRAFT',
        ]);

        $response = $this->actingAs($this->client)->putJson("/api/v1/requests/{$request->id}", [
            'title' => 'Titre modifié',
        ]);

        $response->assertOk()
            ->assertJsonPath('request.title', 'Titre modifié');
    }

    public function test_client_cannot_update_other_users_request(): void
    {
        $otherUser = User::factory()->create(['role' => 'client']);
        $request = DeliveryRequest::factory()->create([
            'user_id' => $otherUser->id,
            'status' => 'DRAFT',
        ]);

        $response = $this->actingAs($this->client)->putJson("/api/v1/requests/{$request->id}", [
            'title' => 'Hack',
        ]);

        $response->assertStatus(403);
    }

    public function test_cannot_update_matched_request(): void
    {
        $request = DeliveryRequest::factory()->create([
            'user_id' => $this->client->id,
            'status' => 'MATCHED',
        ]);

        $response = $this->actingAs($this->client)->putJson("/api/v1/requests/{$request->id}", [
            'title' => 'Modifié',
        ]);

        $response->assertStatus(422);
    }

    public function test_client_can_cancel_their_request(): void
    {
        $request = DeliveryRequest::factory()->create([
            'user_id' => $this->client->id,
            'status' => 'OPEN',
        ]);

        $response = $this->actingAs($this->client)->deleteJson("/api/v1/requests/{$request->id}");

        $response->assertOk();
        $this->assertDatabaseHas('delivery_requests', [
            'id' => $request->id,
            'status' => 'CANCELLED',
        ]);
    }

    public function test_cannot_cancel_matched_request(): void
    {
        $request = DeliveryRequest::factory()->create([
            'user_id' => $this->client->id,
            'status' => 'MATCHED',
        ]);

        $response = $this->actingAs($this->client)->deleteJson("/api/v1/requests/{$request->id}");

        $response->assertStatus(422);
    }

    public function test_client_cannot_cancel_other_users_request(): void
    {
        $otherUser = User::factory()->create(['role' => 'client']);
        $request = DeliveryRequest::factory()->create([
            'user_id' => $otherUser->id,
            'status' => 'OPEN',
        ]);

        $response = $this->actingAs($this->client)->deleteJson("/api/v1/requests/{$request->id}");

        $response->assertStatus(403);
    }

    public function test_client_can_cancel_with_reason(): void
    {
        $request = DeliveryRequest::factory()->create([
            'user_id' => $this->client->id,
            'status' => 'OPEN',
        ]);

        $response = $this->actingAs($this->client)->postJson("/api/v1/requests/{$request->id}/cancel", [
            'cancellation_reason' => 'Plus besoin du service',
        ]);

        $response->assertOk()
            ->assertJsonPath('request.status', 'CANCELLED');

        $this->assertDatabaseHas('delivery_requests', [
            'id' => $request->id,
            'status' => 'CANCELLED',
            'cancellation_reason' => 'Plus besoin du service',
        ]);
    }

    public function test_cancel_requires_reason(): void
    {
        $request = DeliveryRequest::factory()->create([
            'user_id' => $this->client->id,
            'status' => 'OPEN',
        ]);

        $response = $this->actingAs($this->client)->postJson("/api/v1/requests/{$request->id}/cancel", []);

        $response->assertStatus(422);
    }

    public function test_cannot_cancel_matched_request_with_reason(): void
    {
        $request = DeliveryRequest::factory()->create([
            'user_id' => $this->client->id,
            'status' => 'MATCHED',
        ]);

        $response = $this->actingAs($this->client)->postJson("/api/v1/requests/{$request->id}/cancel", [
            'cancellation_reason' => 'Urgence',
        ]);

        $response->assertStatus(422);
    }
}
