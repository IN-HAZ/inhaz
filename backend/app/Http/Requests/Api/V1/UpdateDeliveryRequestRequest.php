<?php

namespace App\Http\Requests\Api\V1;

use Illuminate\Foundation\Http\FormRequest;

class UpdateDeliveryRequestRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'title' => ['sometimes', 'nullable', 'string', 'max:255'],
            'description' => ['sometimes', 'nullable', 'string', 'max:2000'],
            'package_weight' => ['sometimes', 'nullable', 'numeric', 'min:0.1', 'max:9999'],
            'package_dimensions' => ['sometimes', 'nullable', 'string', 'max:50'],
            'proposed_price' => ['sometimes', 'nullable', 'numeric', 'min:0'],
            'budget_min' => ['sometimes', 'nullable', 'numeric', 'min:0'],
            'budget_max' => ['sometimes', 'nullable', 'numeric', 'min:0'],
            'preferred_date' => ['sometimes', 'nullable', 'date', 'after:now'],
            'preferred_time_slot' => ['sometimes', 'nullable', 'string', 'in:morning,afternoon,evening'],
            'instructions' => ['sometimes', 'nullable', 'string', 'max:1000'],
            'expires_at' => ['sometimes', 'nullable', 'date', 'after:now'],
        ];
    }
}
