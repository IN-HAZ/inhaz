<?php

namespace Database\Factories;

use App\Models\DeliveryRequest;
use App\Models\Offer;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Offer>
 */
class OfferFactory extends Factory
{
    protected $model = Offer::class;

    public function definition(): array
    {
        return [
            'delivery_request_id' => DeliveryRequest::factory(),
            'user_id' => User::factory(),
            'status' => 'PENDING',
            'price' => fake()->randomFloat(2, 100, 1000),
            'message' => fake()->optional()->sentence(),
        ];
    }
}
