<?php

namespace Database\Factories;

use App\Models\DeliveryRequest;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<DeliveryRequest>
 */
class DeliveryRequestFactory extends Factory
{
    protected $model = DeliveryRequest::class;

    public function definition(): array
    {
        return [
            'user_id' => User::factory(),
            'status' => 'DRAFT',
            'title' => fake()->sentence(),
            'description' => fake()->paragraph(),
            'package_weight' => fake()->randomFloat(2, 1, 50),
            'package_dimensions' => fake()->randomElement(['30x20x15', '40x30x20', '50x40x30']),
            'proposed_price' => fake()->randomFloat(2, 50, 500),
            'budget_min' => fake()->randomFloat(2, 30, 200),
            'budget_max' => fake()->randomFloat(2, 200, 1000),
            'preferred_date' => fake()->dateTimeBetween('+1 day', '+30 days'),
            'preferred_time_slot' => fake()->randomElement(['morning', 'afternoon', 'evening']),
            'instructions' => fake()->sentence(),
            'expires_at' => fake()->dateTimeBetween('+1 day', '+7 days'),
        ];
    }
}
