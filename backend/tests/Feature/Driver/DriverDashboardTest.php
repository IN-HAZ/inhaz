<?php

namespace Tests\Feature\Driver;

use App\Enums\DriverProfileStatus;
use App\Enums\TripStatus;
use App\Models\DeliveryRequest;
use App\Models\DriverProfile;
use App\Models\Trip;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class DriverDashboardTest extends TestCase
{
    use RefreshDatabase;

    public function test_unauthenticated_user_cannot_access_dashboard_summary(): void
    {
        $response = $this->getJson('/api/v1/driver/dashboard-summary');

        $response->assertStatus(401);
    }

    public function test_user_without_driver_profile_cannot_access_dashboard_summary(): void
    {
        $user = User::factory()->create(['role' => 'client']);

        $response = $this->actingAs($user)->getJson('/api/v1/driver/dashboard-summary');

        $response->assertStatus(403);
    }

    public function test_approved_driver_receives_correct_dashboard_summary(): void
    {
        $driverUser = User::factory()->create(['role' => 'driver']);
        DriverProfile::create([
            'user_id' => $driverUser->id,
            'status' => DriverProfileStatus::Approved,
            'is_online' => true,
        ]);

        $client = User::factory()->create(['role' => 'client']);
        $request = DeliveryRequest::factory()->create(['user_id' => $client->id]);

        // Completed trip today
        Trip::factory()->create([
            'delivery_request_id' => $request->id,
            'driver_user_id' => $driverUser->id,
            'client_user_id' => $client->id,
            'status' => TripStatus::Delivered,
            'agreed_price' => 300.00,
            'delivered_at' => now(),
        ]);

        // Active trip
        $activeTrip = Trip::factory()->create([
            'delivery_request_id' => $request->id,
            'driver_user_id' => $driverUser->id,
            'client_user_id' => $client->id,
            'status' => TripStatus::InTransit,
            'agreed_price' => 150.00,
        ]);

        $response = $this->actingAs($driverUser)->getJson('/api/v1/driver/dashboard-summary');

        $response->assertStatus(200)
            ->assertJson([
                'is_online' => true,
                'today_earnings_mad' => 300.00,
                'completed_trips_today' => 1,
                'active_trip_id' => $activeTrip->id,
                'driver_status' => 'APPROVED',
            ]);
    }

    public function test_approved_driver_can_toggle_online_status(): void
    {
        $driverUser = User::factory()->create(['role' => 'driver']);
        DriverProfile::create([
            'user_id' => $driverUser->id,
            'status' => DriverProfileStatus::Approved,
            'is_online' => false,
        ]);

        $response = $this->actingAs($driverUser)->postJson('/api/v1/driver/toggle-online');

        $response->assertStatus(200)
            ->assertJson([
                'is_online' => true,
            ]);

        $this->assertDatabaseHas('driver_profiles', [
            'user_id' => $driverUser->id,
            'is_online' => true,
        ]);
    }

    public function test_pending_driver_cannot_go_online(): void
    {
        $driverUser = User::factory()->create(['role' => 'driver']);
        DriverProfile::create([
            'user_id' => $driverUser->id,
            'status' => DriverProfileStatus::Pending,
            'is_online' => false,
        ]);

        $response = $this->actingAs($driverUser)->postJson('/api/v1/driver/toggle-online');

        $response->assertStatus(422)
            ->assertJsonPath('message', 'Votre compte doit être approuvé par un administrateur pour passer en ligne.');
    }

    public function test_driver_exceeding_commission_debt_limit_cannot_go_online(): void
    {
        config(['inhaz.max_commission_debt_mad' => 200.00]);

        $driverUser = User::factory()->create(['role' => 'driver']);
        DriverProfile::create([
            'user_id' => $driverUser->id,
            'status' => DriverProfileStatus::Approved,
            'is_online' => false,
            'wallet_balance' => -250.00, // Negative balance exceeding 200 MAD limit
        ]);

        $response = $this->actingAs($driverUser)->postJson('/api/v1/driver/toggle-online');

        $response->assertStatus(422);
    }

    public function test_driver_can_update_gps_location(): void
    {
        $driverUser = User::factory()->create(['role' => 'driver']);
        DriverProfile::create([
            'user_id' => $driverUser->id,
            'status' => DriverProfileStatus::Approved,
            'is_online' => true,
        ]);

        $response = $this->actingAs($driverUser)->postJson('/api/v1/driver/location', [
            'latitude' => 30.4278,
            'longitude' => -9.5981,
        ]);

        $response->assertStatus(200)
            ->assertJson([
                'message' => 'Position GPS mise à jour.',
            ]);

        $this->assertDatabaseHas('driver_profiles', [
            'user_id' => $driverUser->id,
            'current_latitude' => 30.4278,
            'current_longitude' => -9.5981,
        ]);
    }
}
