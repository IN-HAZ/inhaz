<?php

namespace Tests\Feature;

use App\Models\DeliveryRequest;
use App\Models\Offer;
use App\Models\Trip;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class TripApiTest extends TestCase
{
    use RefreshDatabase;

    private User $client;
    private User $driver;

    protected function setUp(): void
    {
        parent::setUp();
        $this->client = User::factory()->create(['role' => 'CLIENT']);
        $this->driver = User::factory()->create(['role' => 'DRIVER']);
    }

    public function test_unauthenticated_user_cannot_view_trip(): void
    {
        $trip = Trip::factory()->create();
        $response = $this->getJson("/api/v1/trips/{$trip->id}");
        $response->assertStatus(401);
    }

    public function test_driver_can_view_trip(): void
    {
        $trip = Trip::factory()->create([
            'driver_user_id' => $this->driver->id,
            'client_user_id' => $this->client->id,
        ]);

        $response = $this->actingAs($this->driver)->getJson("/api/v1/trips/{$trip->id}");
        $response->assertOk()
            ->assertJsonPath('trip.id', $trip->id);
    }

    public function test_client_can_view_trip(): void
    {
        $trip = Trip::factory()->create([
            'driver_user_id' => $this->driver->id,
            'client_user_id' => $this->client->id,
        ]);

        $response = $this->actingAs($this->client)->getJson("/api/v1/trips/{$trip->id}");
        $response->assertOk();
    }

    public function test第三者_cannot_view_trip(): void
    {
        $other = User::factory()->create();
        $trip = Trip::factory()->create([
            'driver_user_id' => $this->driver->id,
            'client_user_id' => $this->client->id,
        ]);

        $response = $this->actingAs($other)->getJson("/api/v1/trips/{$trip->id}");
        $response->assertStatus(403);
    }

    public function test_driver_can_transition_status(): void
    {
        $trip = Trip::factory()->create([
            'driver_user_id' => $this->driver->id,
            'status' => 'ASSIGNED',
        ]);

        $response = $this->actingAs($this->driver)->postJson("/api/v1/trips/{$trip->id}/transition", [
            'status' => 'DRIVER_EN_ROUTE',
        ]);

        $response->assertOk();
        $this->assertDatabaseHas('trips', ['id' => $trip->id, 'status' => 'DRIVER_EN_ROUTE']);
    }

    public function test_client_cannot_transition(): void
    {
        $trip = Trip::factory()->create([
            'driver_user_id' => $this->driver->id,
            'client_user_id' => $this->client->id,
            'status' => 'ASSIGNED',
        ]);

        $response = $this->actingAs($this->client)->postJson("/api/v1/trips/{$trip->id}/transition", [
            'status' => 'DRIVER_EN_ROUTE',
        ]);

        $response->assertStatus(403);
    }

    public function test_cannot_skip_statuses(): void
    {
        $trip = Trip::factory()->create([
            'driver_user_id' => $this->driver->id,
            'status' => 'ASSIGNED',
        ]);

        $response = $this->actingAs($this->driver)->postJson("/api/v1/trips/{$trip->id}/transition", [
            'status' => 'DELIVERED',
        ]);

        $response->assertStatus(422);
    }

    public function test_delivery_completed_on_delivered(): void
    {
        $request = DeliveryRequest::factory()->create(['status' => 'MATCHED']);
        $trip = Trip::factory()->create([
            'delivery_request_id' => $request->id,
            'driver_user_id' => $this->driver->id,
            'status' => 'AT_DESTINATION',
        ]);

        $this->actingAs($this->driver)->postJson("/api/v1/trips/{$trip->id}/transition", [
            'status' => 'DELIVERED',
        ]);

        $this->assertDatabaseHas('delivery_requests', ['id' => $request->id, 'status' => 'COMPLETED']);
    }

    public function test_driver_can_cancel(): void
    {
        $trip = Trip::factory()->create([
            'driver_user_id' => $this->driver->id,
            'client_user_id' => $this->client->id,
            'status' => 'ASSIGNED',
        ]);

        $response = $this->actingAs($this->driver)->postJson("/api/v1/trips/{$trip->id}/cancel", [
            'cancellation_reason' => 'Urgence personnelle',
        ]);

        $response->assertOk();
        $this->assertDatabaseHas('trips', ['id' => $trip->id, 'status' => 'CANCELLED']);
    }

    public function test_client_can_cancel(): void
    {
        $trip = Trip::factory()->create([
            'driver_user_id' => $this->driver->id,
            'client_user_id' => $this->client->id,
            'status' => 'ASSIGNED',
        ]);

        $response = $this->actingAs($this->client)->postJson("/api/v1/trips/{$trip->id}/cancel", [
            'cancellation_reason' => 'Plus besoin',
        ]);

        $response->assertOk();
    }

    public function test_cannot_cancel_in_transit(): void
    {
        $trip = Trip::factory()->create([
            'driver_user_id' => $this->driver->id,
            'client_user_id' => $this->client->id,
            'status' => 'IN_TRANSIT',
        ]);

        $response = $this->actingAs($this->driver)->postJson("/api/v1/trips/{$trip->id}/cancel", [
            'cancellation_reason' => 'Test',
        ]);

        $response->assertStatus(422);
    }

    public function test_driver_can_list_trips(): void
    {
        Trip::factory()->count(3)->create(['driver_user_id' => $this->driver->id]);
        Trip::factory()->count(2)->create(['driver_user_id' => $this->driver->id, 'status' => 'DELIVERED']);

        $response = $this->actingAs($this->driver)->getJson('/api/v1/driver/trips');
        $response->assertOk()
            ->assertJsonCount(5, 'trips');
    }

    public function test_client_can_list_trips(): void
    {
        Trip::factory()->count(2)->create(['client_user_id' => $this->client->id]);

        $response = $this->actingAs($this->client)->getJson('/api/v1/client/trips');
        $response->assertOk()
            ->assertJsonCount(2, 'trips');
    }

    public function test_driver_can_get_waypoints(): void
    {
        $request = DeliveryRequest::factory()->create();
        \App\Models\RequestStop::factory()->create([
            'delivery_request_id' => $request->id,
            'type' => 'PICKUP',
            'order' => 0,
            'latitude' => 33.5731,
            'longitude' => -7.5898,
        ]);
        \App\Models\RequestStop::factory()->create([
            'delivery_request_id' => $request->id,
            'type' => 'DESTINATION',
            'order' => 1,
            'latitude' => 34.0209,
            'longitude' => -6.8416,
        ]);

        $trip = Trip::factory()->create([
            'delivery_request_id' => $request->id,
            'driver_user_id' => $this->driver->id,
            'client_user_id' => $this->client->id,
            'status' => 'IN_TRANSIT',
        ]);

        $response = $this->actingAs($this->driver)->getJson("/api/v1/trips/{$trip->id}/waypoints");

        $response->assertOk()
            ->assertJsonPath('current_stop_index', 1)
            ->assertJsonCount(2, 'waypoints');
    }

    public function test第三者_cannot_get_waypoints(): void
    {
        $trip = Trip::factory()->create([
            'driver_user_id' => $this->driver->id,
            'client_user_id' => $this->client->id,
        ]);
        $other = User::factory()->create();

        $response = $this->actingAs($other)->getJson("/api/v1/trips/{$trip->id}/waypoints");
        $response->assertStatus(403);
    }

    public function test_can_rate_completed_trip(): void
    {
        $trip = Trip::factory()->create([
            'driver_user_id' => $this->driver->id,
            'client_user_id' => $this->client->id,
            'status' => 'DELIVERED',
        ]);

        $response = $this->actingAs($this->client)->postJson("/api/v1/trips/{$trip->id}/rate", [
            'score' => 5,
            'comment' => 'Excellent chauffeur',
        ]);

        $response->assertStatus(201);
        $this->assertDatabaseHas('ratings', [
            'trip_id' => $trip->id,
            'reviewer_id' => $this->client->id,
            'score' => 5,
        ]);
    }

    public function test_cannot_rate_twice(): void
    {
        $trip = Trip::factory()->create([
            'driver_user_id' => $this->driver->id,
            'client_user_id' => $this->client->id,
            'status' => 'DELIVERED',
        ]);

        $this->actingAs($this->client)->postJson("/api/v1/trips/{$trip->id}/rate", [
            'score' => 4,
        ]);

        $response = $this->actingAs($this->client)->postJson("/api/v1/trips/{$trip->id}/rate", [
            'score' => 5,
        ]);

        $response->assertStatus(422);
    }

    public function test_cannot_rate_active_trip(): void
    {
        $trip = Trip::factory()->create([
            'driver_user_id' => $this->driver->id,
            'client_user_id' => $this->client->id,
            'status' => 'IN_TRANSIT',
        ]);

        $response = $this->actingAs($this->client)->postJson("/api/v1/trips/{$trip->id}/rate", [
            'score' => 5,
        ]);

        $response->assertStatus(422);
    }
}
