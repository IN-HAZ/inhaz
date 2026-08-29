<?php

namespace App\Http\Requests\Api\V1;

use Illuminate\Foundation\Http\FormRequest;

class TransitionTripRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'status' => ['required', 'string', 'in:DRIVER_EN_ROUTE,AT_PICKUP,PICKED_UP,IN_TRANSIT,AT_DESTINATION,DELIVERED'],
        ];
    }
}
