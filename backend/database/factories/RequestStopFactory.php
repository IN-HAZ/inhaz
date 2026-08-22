<?php

namespace Database\Factories;

use App\Models\DeliveryRequest;
use App\Models\RequestStop;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<RequestStop>
 */
class RequestStopFactory extends Factory
{
    protected $model = RequestStop::class;

    public function definition(): array
    {
        return [
            'delivery_request_id' => DeliveryRequest::factory(),
            'type' => 'PICKUP',
            'order' => 0,
            'address' => fake()->address(),
            'latitude' => fake()->latitude(33, 35),
            'longitude' => fake()->longitude(-7, -6),
        ];
    }
}
