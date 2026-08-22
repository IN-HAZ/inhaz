<?php

namespace Database\Factories;

use App\Models\Rating;
use App\Models\Trip;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Rating>
 */
class RatingFactory extends Factory
{
    protected $model = Rating::class;

    public function definition(): array
    {
        return [
            'trip_id' => Trip::factory(),
            'reviewer_id' => User::factory(),
            'reviewee_id' => User::factory(),
            'score' => fake()->numberBetween(1, 5),
            'comment' => fake()->optional()->sentence(),
        ];
    }
}
