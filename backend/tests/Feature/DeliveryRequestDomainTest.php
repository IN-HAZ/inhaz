<?php

namespace Tests\Feature;

use App\Models\DeliveryRequest;
use App\Models\RequestStop;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class DeliveryRequestDomainTest extends TestCase
{
    use RefreshDatabase;

    private User $client;

    protected function setUp(): void
    {
        parent::setUp();
        $this->client = User::factory()->create(['role' => 'client']);
    }

    public function test_delivery_request_can_be_created(): void
    {
        $request = DeliveryRequest::create([
            'user_id' => $this->client->id,
            'status' => 'DRAFT',
            'title' => 'Colis urgent',
            'description' => 'Documents importants',
            'proposed_price' => 150.00,
        ]);

        $this->assertDatabaseHas('delivery_requests', [
            'id' => $request->id,
            'user_id' => $this->client->id,
            'status' => 'DRAFT',
            'title' => 'Colis urgent',
        ]);
    }

    public function test_delivery_request_belongs_to_user(): void
    {
        $request = DeliveryRequest::factory()->create([
            'user_id' => $this->client->id,
        ]);

        $this->assertEquals($this->client->id, $request->user->id);
    }

    public function test_user_has_delivery_requests(): void
    {
        DeliveryRequest::factory()->count(3)->create([
            'user_id' => $this->client->id,
        ]);

        $this->assertCount(3, $this->client->deliveryRequests);
    }

    public function test_request_stop_can_be_created(): void
    {
        $request = DeliveryRequest::create([
            'user_id' => $this->client->id,
            'status' => 'DRAFT',
        ]);

        $stop = $request->stops()->create([
            'type' => 'PICKUP',
            'order' => 0,
            'address' => '123 Rue Principale, Casablanca',
            'latitude' => 33.5731,
            'longitude' => -7.5898,
        ]);

        $this->assertDatabaseHas('request_stops', [
            'id' => $stop->id,
            'delivery_request_id' => $request->id,
            'type' => 'PICKUP',
        ]);
    }

    public function test_request_stop_belongs_to_delivery_request(): void
    {
        $request = DeliveryRequest::create([
            'user_id' => $this->client->id,
            'status' => 'DRAFT',
        ]);

        $stop = RequestStop::create([
            'delivery_request_id' => $request->id,
            'type' => 'PICKUP',
            'order' => 0,
            'address' => '123 Rue Principale',
        ]);

        $this->assertEquals($request->id, $stop->deliveryRequest->id);
    }

    public function test_request_has_pickup_and_destination_stops(): void
    {
        $request = DeliveryRequest::create([
            'user_id' => $this->client->id,
            'status' => 'DRAFT',
        ]);

        $request->stops()->create([
            'type' => 'PICKUP',
            'order' => 0,
            'address' => 'Pickup Address',
        ]);

        $request->stops()->create([
            'type' => 'DESTINATION',
            'order' => 1,
            'address' => 'Destination Address',
        ]);

        $this->assertCount(1, $request->pickup);
        $this->assertCount(1, $request->destinations);
    }

    public function test_valid_statuses(): void
    {
        $validStatuses = ['DRAFT', 'OPEN', 'CANCELLED', 'EXPIRED', 'MATCHED'];

        foreach ($validStatuses as $status) {
            $request = DeliveryRequest::create([
                'user_id' => $this->client->id,
                'status' => $status,
            ]);

            $this->assertDatabaseHas('delivery_requests', [
                'id' => $request->id,
                'status' => $status,
            ]);
        }
    }

    public function test_default_status_is_draft(): void
    {
        $request = DeliveryRequest::create([
            'user_id' => $this->client->id,
        ]);

        $this->assertDatabaseHas('delivery_requests', [
            'id' => $request->id,
            'status' => 'DRAFT',
        ]);
    }

    public function test_status_helpers(): void
    {
        $request = DeliveryRequest::create([
            'user_id' => $this->client->id,
            'status' => 'DRAFT',
        ]);

        $this->assertTrue($request->isDraft());
        $this->assertFalse($request->isOpen());
        $this->assertFalse($request->isCancelled());

        $request->update(['status' => 'OPEN']);
        $this->assertTrue($request->isOpen());
        $this->assertFalse($request->isDraft());
    }

    public function test_can_be_modified_when_draft(): void
    {
        $request = DeliveryRequest::create([
            'user_id' => $this->client->id,
            'status' => 'DRAFT',
        ]);

        $this->assertTrue($request->canBeModified());
    }

    public function test_can_be_modified_when_open(): void
    {
        $request = DeliveryRequest::create([
            'user_id' => $this->client->id,
            'status' => 'OPEN',
        ]);

        $this->assertTrue($request->canBeModified());
    }

    public function test_cannot_be_modified_when_cancelled(): void
    {
        $request = DeliveryRequest::create([
            'user_id' => $this->client->id,
            'status' => 'CANCELLED',
        ]);

        $this->assertFalse($request->canBeModified());
    }

    public function test_cannot_be_modified_when_matched(): void
    {
        $request = DeliveryRequest::create([
            'user_id' => $this->client->id,
            'status' => 'MATCHED',
        ]);

        $this->assertFalse($request->canBeModified());
    }

    public function test_can_be_cancelled_when_draft(): void
    {
        $request = DeliveryRequest::create([
            'user_id' => $this->client->id,
            'status' => 'DRAFT',
        ]);

        $this->assertTrue($request->canBeCancelled());
    }

    public function test_can_be_cancelled_when_open(): void
    {
        $request = DeliveryRequest::create([
            'user_id' => $this->client->id,
            'status' => 'OPEN',
        ]);

        $this->assertTrue($request->canBeCancelled());
    }

    public function test_cannot_be_cancelled_when_matched(): void
    {
        $request = DeliveryRequest::create([
            'user_id' => $this->client->id,
            'status' => 'MATCHED',
        ]);

        $this->assertFalse($request->canBeCancelled());
    }

    public function test_request_cascade_deletes_stops(): void
    {
        $request = DeliveryRequest::create([
            'user_id' => $this->client->id,
            'status' => 'DRAFT',
        ]);

        $request->stops()->create([
            'type' => 'PICKUP',
            'order' => 0,
            'address' => 'Test',
        ]);

        $this->assertDatabaseCount('request_stops', 1);

        $request->delete();

        $this->assertDatabaseCount('request_stops', 0);
    }

    public function test_user_cascade_deletes_requests(): void
    {
        DeliveryRequest::factory()->count(2)->create([
            'user_id' => $this->client->id,
        ]);

        $this->assertCount(2, $this->client->deliveryRequests);

        $this->client->delete();

        $this->assertDatabaseCount('delivery_requests', 0);
    }

    public function test_stops_ordered_by_order_column(): void
    {
        $request = DeliveryRequest::create([
            'user_id' => $this->client->id,
            'status' => 'DRAFT',
        ]);

        $request->stops()->create([
            'type' => 'DESTINATION',
            'order' => 2,
            'address' => 'Third',
        ]);

        $request->stops()->create([
            'type' => 'PICKUP',
            'order' => 0,
            'address' => 'First',
        ]);

        $request->stops()->create([
            'type' => 'DESTINATION',
            'order' => 1,
            'address' => 'Second',
        ]);

        $stops = $request->stops()->get();

        $this->assertEquals('First', $stops[0]->address);
        $this->assertEquals('Second', $stops[1]->address);
        $this->assertEquals('Third', $stops[2]->address);
    }

    public function test_request_with_price_fields(): void
    {
        $request = DeliveryRequest::create([
            'user_id' => $this->client->id,
            'status' => 'OPEN',
            'proposed_price' => 200.00,
            'budget_min' => 150.00,
            'budget_max' => 300.00,
        ]);

        $this->assertEquals('200.00', $request->proposed_price);
        $this->assertEquals('150.00', $request->budget_min);
        $this->assertEquals('300.00', $request->budget_max);
    }

    public function test_request_optional_fields_are_nullable(): void
    {
        $request = DeliveryRequest::create([
            'user_id' => $this->client->id,
        ]);

        $this->assertNull($request->title);
        $this->assertNull($request->description);
        $this->assertNull($request->package_weight);
        $this->assertNull($request->package_dimensions);
        $this->assertNull($request->proposed_price);
        $this->assertNull($request->preferred_date);
        $this->assertNull($request->expires_at);
    }
}
