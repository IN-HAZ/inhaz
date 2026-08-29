<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class OfferResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'delivery_request_id' => $this->delivery_request_id,
            'status' => $this->status,
            'price' => $this->price,
            'message' => $this->message,
            'rejection_reason' => $this->rejection_reason,
            'driver' => new UserResource($this->whenLoaded('driver')),
            'created_at' => $this->created_at?->toIso8601String(),
        ];
    }
}
