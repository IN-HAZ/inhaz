<?php

namespace Database\Factories;

use App\Enums\TripStatus;
use App\Models\DeliveryRequest;
use App\Models\Offer;
use App\Models\Trip;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Trip>
 */
class TripFactory extends Factory
{
    protected $model = Trip::class;

    public function definition(): array
    {
        return [
            'delivery_request_id' => DeliveryRequest::factory(),
            'offer_id' => Offer::factory(),
            'driver_user_id' => User::factory(),
            'client_user_id' => User::factory(),
            'status' => TripStatus::Assigned,
            'agreed_price' => fake()->randomFloat(2, 100, 1000),
            'assigned_at' => now(),
        ];
    }
}
