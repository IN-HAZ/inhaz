<?php

namespace Tests\Feature;

use App\Models\DeliveryRequest;
use App\Models\RequestStop;
use App\Models\Trip;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class TripE2ETest extends TestCase
{
    use RefreshDatabase;

    public function test_full_trip_lifecycle(): void
    {
        $driver = User::factory()->create(['role' => 'DRIVER']);
        $client = User::factory()->create(['role' => 'CLIENT']);

        // Create delivery request with stops
        $request = DeliveryRequest::factory()->create([
            'user_id' => $client->id,
            'status' => 'MATCHED',
        ]);

        RequestStop::factory()->create([
            'delivery_request_id' => $request->id,
            'type' => 'PICKUP',
            'order' => 0,
            'address' => '123 Rue Principal, Rabat',
            'latitude' => 33.5731,
            'longitude' => -7.5898,
            'contact_name' => 'Ali',
            'contact_phone' => '+212600000001',
        ]);

        RequestStop::factory()->create([
            'delivery_request_id' => $request->id,
            'type' => 'DESTINATION',
            'order' => 1,
            'address' => '456 Avenue Hassan II, Casablanca',
            'latitude' => 34.0209,
            'longitude' => -6.8416,
            'contact_name' => 'Fatima',
            'contact_phone' => '+212600000002',
        ]);

        // Create trip
        $trip = Trip::factory()->create([
            'delivery_request_id' => $request->id,
            'driver_user_id' => $driver->id,
            'client_user_id' => $client->id,
            'status' => 'ASSIGNED',
            'agreed_price' => 350.00,
        ]);

        // 1. Get trip details
        $response = $this->actingAs($driver)->getJson("/api/v1/trips/{$trip->id}");
        $response->assertOk()
            ->assertJsonPath('trip.status', 'ASSIGNED')
            ->assertJsonPath('trip.agreed_price', '350.00');

        // 2. Get waypoints
        $response = $this->actingAs($driver)->getJson("/api/v1/trips/{$trip->id}/waypoints");
        $response->assertOk()
            ->assertJsonCount(2, 'waypoints')
            ->assertJsonPath('current_stop_index', 0);

        // 3. Driver en route
        $response = $this->actingAs($driver)->postJson("/api/v1/trips/{$trip->id}/transition", [
            'status' => 'DRIVER_EN_ROUTE',
        ]);
        $response->assertOk()
            ->assertJsonPath('trip.status', 'DRIVER_EN_ROUTE');

        // 4. At pickup
        $response = $this->actingAs($driver)->postJson("/api/v1/trips/{$trip->id}/transition", [
            'status' => 'AT_PICKUP',
        ]);
        $response->assertOk();

        // 5. Picked up
        $response = $this->actingAs($driver)->postJson("/api/v1/trips/{$trip->id}/transition", [
            'status' => 'PICKED_UP',
        ]);
        $response->assertOk();

        // 6. In transit
        $response = $this->actingAs($driver)->postJson("/api/v1/trips/{$trip->id}/transition", [
            'status' => 'IN_TRANSIT',
        ]);
        $response->assertOk()
            ->assertJsonPath('trip.status', 'IN_TRANSIT');

        // Waypoints should show current_stop_index = 1
        $response = $this->actingAs($driver)->getJson("/api/v1/trips/{$trip->id}/waypoints");
        $response->assertOk()
            ->assertJsonPath('current_stop_index', 1);

        // 7. At destination
        $response = $this->actingAs($driver)->postJson("/api/v1/trips/{$trip->id}/transition", [
            'status' => 'AT_DESTINATION',
        ]);
        $response->assertOk();

        // 8. Delivered
        $response = $this->actingAs($driver)->postJson("/api/v1/trips/{$trip->id}/transition", [
            'status' => 'DELIVERED',
        ]);
        $response->assertOk()
            ->assertJsonPath('trip.status', 'DELIVERED');

        // Delivery request should be COMPLETED
        $this->assertDatabaseHas('delivery_requests', [
            'id' => $request->id,
            'status' => 'COMPLETED',
        ]);

        // 9. Client rates the driver
        $response = $this->actingAs($client)->postJson("/api/v1/trips/{$trip->id}/rate", [
            'score' => 5,
            'comment' => 'Livraison parfaite, rapide et sympathique',
        ]);
        $response->assertStatus(201);

        // 10. Driver rates the client
        $response = $this->actingAs($driver)->postJson("/api/v1/trips/{$trip->id}/rate", [
            'score' => 4,
        ]);
        $response->assertStatus(201);

        // 11. Verify both ratings exist
        $this->assertDatabaseHas('ratings', [
            'trip_id' => $trip->id,
            'reviewer_id' => $client->id,
            'score' => 5,
        ]);

        $this->assertDatabaseHas('ratings', [
            'trip_id' => $trip->id,
            'reviewer_id' => $driver->id,
            'score' => 4,
        ]);

        // 12. Cannot rate twice
        $response = $this->actingAs($client)->postJson("/api/v1/trips/{$trip->id}/rate", [
            'score' => 3,
        ]);
        $response->assertStatus(422);

        // 13. Invalid transition should fail (DELIVERED -> anything)
        $response = $this->actingAs($driver)->postJson("/api/v1/trips/{$trip->id}/transition", [
            'status' => 'IN_TRANSIT',
        ]);
        $response->assertStatus(422);
    }

    public function test_trip_cancellation_by_driver(): void
    {
        $driver = User::factory()->create(['role' => 'DRIVER']);
        $client = User::factory()->create(['role' => 'CLIENT']);
        $request = DeliveryRequest::factory()->create(['status' => 'MATCHED']);
        $trip = Trip::factory()->create([
            'delivery_request_id' => $request->id,
            'driver_user_id' => $driver->id,
            'client_user_id' => $client->id,
            'status' => 'ASSIGNED',
        ]);

        // Driver cancels
        $response = $this->actingAs($driver)->postJson("/api/v1/trips/{$trip->id}/cancel", [
            'cancellation_reason' => 'Urgence personnelle',
        ]);
        $response->assertOk()
            ->assertJsonPath('trip.status', 'CANCELLED');

        // Delivery request should be CANCELLED
        $this->assertDatabaseHas('delivery_requests', [
            'id' => $request->id,
            'status' => 'CANCELLED',
        ]);

        // Cannot transition a cancelled trip
        $response = $this->actingAs($driver)->postJson("/api/v1/trips/{$trip->id}/transition", [
            'status' => 'DRIVER_EN_ROUTE',
        ]);
        $response->assertStatus(422);
    }

    public function test_trip_cancellation_by_client(): void
    {
        $driver = User::factory()->create(['role' => 'DRIVER']);
        $client = User::factory()->create(['role' => 'CLIENT']);
        $request = DeliveryRequest::factory()->create(['status' => 'MATCHED']);
        $trip = Trip::factory()->create([
            'delivery_request_id' => $request->id,
            'driver_user_id' => $driver->id,
            'client_user_id' => $client->id,
            'status' => 'DRIVER_EN_ROUTE',
        ]);

        $response = $this->actingAs($client)->postJson("/api/v1/trips/{$trip->id}/cancel", [
            'cancellation_reason' => 'Plus besoin',
        ]);
        $response->assertOk();
    }

    public function test_cannot_cancel_in_transit_trip(): void
    {
        $driver = User::factory()->create(['role' => 'DRIVER']);
        $client = User::factory()->create(['role' => 'CLIENT']);
        $request = DeliveryRequest::factory()->create(['status' => 'MATCHED']);
        $trip = Trip::factory()->create([
            'delivery_request_id' => $request->id,
            'driver_user_id' => $driver->id,
            'client_user_id' => $client->id,
            'status' => 'IN_TRANSIT',
        ]);

        $response = $this->actingAs($driver)->postJson("/api/v1/trips/{$trip->id}/cancel", [
            'cancellation_reason' => 'Changement d avis',
        ]);
        $response->assertStatus(422);
    }

    public function test_unauthorized_third_party_cannot_access_trip(): void
    {
        $driver = User::factory()->create(['role' => 'DRIVER']);
        $client = User::factory()->create(['role' => 'CLIENT']);
        $other = User::factory()->create(['role' => 'CLIENT']);
        $request = DeliveryRequest::factory()->create(['status' => 'MATCHED']);
        $trip = Trip::factory()->create([
            'delivery_request_id' => $request->id,
            'driver_user_id' => $driver->id,
            'client_user_id' => $client->id,
            'status' => 'ASSIGNED',
        ]);

        $response = $this->actingAs($other)->getJson("/api/v1/trips/{$trip->id}");
        $response->assertStatus(403);

        $response = $this->actingAs($other)->postJson("/api/v1/trips/{$trip->id}/transition", ['status' => 'DRIVER_EN_ROUTE']);
        $response->assertStatus(403);

        $response = $this->actingAs($other)->getJson("/api/v1/trips/{$trip->id}/waypoints");
        $response->assertStatus(403);
    }
}
