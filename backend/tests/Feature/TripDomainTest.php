<?php

namespace Tests\Feature;

use App\Models\DeliveryRequest;
use App\Models\Offer;
use App\Models\Rating;
use App\Models\Trip;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class TripDomainTest extends TestCase
{
    use RefreshDatabase;

    public function test_trip_belongs_to_delivery_request(): void
    {
        $trip = Trip::factory()->create();
        $this->assertInstanceOf(DeliveryRequest::class, $trip->deliveryRequest);
    }

    public function test_trip_belongs_to_driver_and_client(): void
    {
        $driver = User::factory()->create(['role' => 'driver']);
        $client = User::factory()->create(['role' => 'client']);
        $trip = Trip::factory()->create([
            'driver_user_id' => $driver->id,
            'client_user_id' => $client->id,
        ]);

        $this->assertEquals($driver->id, $trip->driver->id);
        $this->assertEquals($client->id, $trip->client->id);
    }

    public function test_trip_default_status_is_assigned(): void
    {
        $trip = Trip::factory()->create();
        $this->assertTrue($trip->isAssigned());
    }

    public function test_trip_can_transition_to_status(): void
    {
        $trip = Trip::factory()->create(['status' => 'ASSIGNED']);
        $trip->transitionTo('DRIVER_EN_ROUTE');
        $this->assertEquals('DRIVER_EN_ROUTE', $trip->fresh()->status);

        $trip->transitionTo('AT_PICKUP');
        $this->assertEquals('AT_PICKUP', $trip->fresh()->status);

        $trip->transitionTo('PICKED_UP');
        $this->assertNotNull($trip->fresh()->picked_up_at);

        $trip->transitionTo('IN_TRANSIT');
        $trip->transitionTo('AT_DESTINATION');
        $trip->transitionTo('DELIVERED');
        $this->assertTrue($trip->fresh()->isCompleted());
        $this->assertNotNull($trip->fresh()->delivered_at);
    }

    public function test_trip_can_be_cancelled(): void
    {
        $trip = Trip::factory()->create(['status' => 'ASSIGNED']);
        $this->assertTrue($trip->canBeCancelled());

        $trip->cancel('Changement de plan');
        $this->assertTrue($trip->fresh()->isCancelled());
        $this->assertEquals('Changement de plan', $trip->fresh()->cancellation_reason);
        $this->assertNotNull($trip->fresh()->cancelled_at);
    }

    public function test_cannot_cancel_in_transit_trip(): void
    {
        $trip = Trip::factory()->create(['status' => 'IN_TRANSIT']);
        $this->assertFalse($trip->canBeCancelled());
    }

    public function test_trip_is_active_during旅程(): void
    {
        $trip = Trip::factory()->create(['status' => 'ASSIGNED']);
        $this->assertTrue($trip->isActive());

        $trip->transitionTo('DELIVERED');
        $this->assertFalse($trip->fresh()->isActive());
    }

    public function test_rating_belongs_to_trip(): void
    {
        $rating = Rating::factory()->create();
        $this->assertInstanceOf(Trip::class, $rating->trip);
    }

    public function test_rating_score_must_be_valid(): void
    {
        $rating = Rating::factory()->create(['score' => 3]);
        $this->assertTrue($rating->isValid());

        $rating2 = Rating::factory()->create(['score' => 0]);
        $this->assertFalse($rating2->isValid());
    }

    public function test_unique_rating_per_reviewer_per_trip(): void
    {
        $trip = Trip::factory()->create();
        $reviewer = User::factory()->create();

        Rating::factory()->create([
            'trip_id' => $trip->id,
            'reviewer_id' => $reviewer->id,
        ]);

        $this->expectException(\Illuminate\Database\QueryException::class);

        Rating::factory()->create([
            'trip_id' => $trip->id,
            'reviewer_id' => $reviewer->id,
        ]);
    }
}
