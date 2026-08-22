<?php

namespace Database\Factories;

use App\Models\DeliveryRequest;
use App\Models\RequestPhoto;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<RequestPhoto>
 */
class RequestPhotoFactory extends Factory
{
    protected $model = RequestPhoto::class;

    public function definition(): array
    {
        return [
            'delivery_request_id' => DeliveryRequest::factory(),
            'file_path' => 'request-photos/1/' . fake()->uuid() . '.jpg',
            'file_name' => fake()->uuid() . '.jpg',
            'file_type' => 'image/jpeg',
            'file_size' => fake()->numberBetween(10000, 5000000),
        ];
    }
}
