<?php

namespace App\Http\Requests\Api\V1;

use Illuminate\Foundation\Http\FormRequest;

class StoreDeliveryRequestRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'status' => ['nullable', 'string', 'in:DRAFT,OPEN'],
            'title' => ['nullable', 'string', 'max:255'],
            'description' => ['nullable', 'string', 'max:2000'],
            'package_weight' => ['nullable', 'numeric', 'min:0.1', 'max:9999'],
            'package_dimensions' => ['nullable', 'string', 'max:50'],
            'proposed_price' => ['nullable', 'numeric', 'min:0'],
            'budget_min' => ['nullable', 'numeric', 'min:0'],
            'budget_max' => ['nullable', 'numeric', 'min:0', 'gte:budget_min'],
            'preferred_date' => ['nullable', 'date', 'after:now'],
            'preferred_time_slot' => ['nullable', 'string', 'in:morning,afternoon,evening'],
            'instructions' => ['nullable', 'string', 'max:1000'],
            'expires_at' => ['nullable', 'date', 'after:now'],
            'stops' => ['sometimes', 'array', 'min:1'],
            'stops.*.type' => ['required_with:stops', 'string', 'in:PICKUP,DESTINATION'],
            'stops.*.order' => ['required_with:stops', 'integer', 'min:0'],
            'stops.*.label' => ['nullable', 'string', 'max:255'],
            'stops.*.address' => ['nullable', 'string', 'max:500'],
            'stops.*.latitude' => ['nullable', 'numeric', 'between:-90,90'],
            'stops.*.longitude' => ['nullable', 'numeric', 'between:-180,180'],
            'stops.*.contact_name' => ['nullable', 'string', 'max:255'],
            'stops.*.contact_phone' => ['nullable', 'string', 'max:20'],
            'stops.*.instructions' => ['nullable', 'string', 'max:500'],
        ];
    }
}
