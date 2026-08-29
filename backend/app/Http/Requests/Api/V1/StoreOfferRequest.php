<?php

namespace App\Http\Requests\Api\V1;

use Illuminate\Foundation\Http\FormRequest;

class StoreOfferRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'price' => ['required', 'numeric', 'min:1'],
            'message' => ['nullable', 'string', 'max:500'],
        ];
    }
}
