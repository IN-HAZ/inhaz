<?php

namespace Tests\Feature;

use App\Models\DeliveryRequest;
use App\Models\Offer;
use App\Models\User;
use Illuminate\Database\QueryException;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class OfferDomainTest extends TestCase
{
    use RefreshDatabase;

    public function test_offer_belongs_to_delivery_request(): void
    {
        $request = DeliveryRequest::factory()->create();
        $driver = User::factory()->create(['role' => 'driver']);
        $offer = Offer::factory()->create([
            'delivery_request_id' => $request->id,
            'user_id' => $driver->id,
        ]);

        $this->assertInstanceOf(DeliveryRequest::class, $offer->deliveryRequest);
        $this->assertEquals($request->id, $offer->deliveryRequest->id);
    }

    public function test_offer_belongs_to_driver(): void
    {
        $driver = User::factory()->create(['role' => 'driver']);
        $offer = Offer::factory()->create(['user_id' => $driver->id]);

        $this->assertInstanceOf(User::class, $offer->driver);
        $this->assertEquals($driver->id, $offer->driver->id);
    }

    public function test_offer_default_status_is_pending(): void
    {
        $offer = Offer::factory()->create();

        $this->assertEquals('PENDING', $offer->status->value);
        $this->assertTrue($offer->isPending());
    }

    public function test_offer_can_be_accepted(): void
    {
        $request = DeliveryRequest::factory()->create(['status' => 'OPEN']);
        $offer = Offer::factory()->create([
            'delivery_request_id' => $request->id,
            'status' => 'PENDING',
        ]);

        $this->assertTrue($offer->canBeAccepted());
    }

    public function test_cannot_accept_offer_on_draft_request(): void
    {
        $request = DeliveryRequest::factory()->create(['status' => 'DRAFT']);
        $offer = Offer::factory()->create([
            'delivery_request_id' => $request->id,
            'status' => 'PENDING',
        ]);

        $this->assertFalse($offer->canBeAccepted());
    }

    public function test_offer_accept_sets_status(): void
    {
        $offer = Offer::factory()->create(['status' => 'PENDING']);
        $offer->accept();

        $this->assertTrue($offer->fresh()->isAccepted());
    }

    public function test_offer_reject_with_reason(): void
    {
        $offer = Offer::factory()->create(['status' => 'PENDING']);
        $offer->reject('Trop cher');

        $this->assertTrue($offer->fresh()->isRejected());
        $this->assertEquals('Trop cher', $offer->fresh()->rejection_reason);
    }

    public function test_offer_withdraw_sets_status(): void
    {
        $offer = Offer::factory()->create(['status' => 'PENDING']);
        $offer->withdraw();

        $this->assertTrue($offer->fresh()->isWithdrawn());
    }

    public function test_cannot_withdraw_accepted_offer(): void
    {
        $offer = Offer::factory()->create(['status' => 'ACCEPTED']);

        $this->assertFalse($offer->canBeWithdrawn());
    }

    public function test_delivery_request_has_many_offers(): void
    {
        $request = DeliveryRequest::factory()->create();
        Offer::factory()->count(3)->create(['delivery_request_id' => $request->id]);

        $this->assertCount(3, $request->offers);
    }

    public function test_delivery_request_can_have_accepted_offer(): void
    {
        $request = DeliveryRequest::factory()->create();
        $accepted = Offer::factory()->create([
            'delivery_request_id' => $request->id,
            'status' => 'ACCEPTED',
        ]);
        Offer::factory()->create([
            'delivery_request_id' => $request->id,
            'status' => 'PENDING',
        ]);

        $this->assertEquals($accepted->id, $request->acceptedOffer->id);
    }

    public function test_unique_offer_per_driver_per_request(): void
    {
        $request = DeliveryRequest::factory()->create();
        $driver = User::factory()->create(['role' => 'driver']);

        Offer::factory()->create([
            'delivery_request_id' => $request->id,
            'user_id' => $driver->id,
        ]);

        $this->expectException(QueryException::class);

        Offer::factory()->create([
            'delivery_request_id' => $request->id,
            'user_id' => $driver->id,
        ]);
    }
}
