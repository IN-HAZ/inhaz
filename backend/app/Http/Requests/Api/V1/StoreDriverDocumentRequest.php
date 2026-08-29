<?php

namespace App\Http\Requests\Api\V1;

use Illuminate\Foundation\Http\FormRequest;

class StoreDriverDocumentRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'type' => ['required', 'string', 'in:CIN,REGISTRATION,INSURANCE,DRIVING_LICENSE'],
            'file' => ['required', 'file', 'max:10240'],
            'expires_at' => ['nullable', 'date', 'after:today'],
        ];
    }
}
