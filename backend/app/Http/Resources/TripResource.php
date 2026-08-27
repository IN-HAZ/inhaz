<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class TripResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'status' => $this->status,
            'agreed_price' => $this->agreed_price,
            'final_price' => $this->final_price,
            'assigned_at' => $this->assigned_at?->toIso8601String(),
            'picked_up_at' => $this->picked_up_at?->toIso8601String(),
            'delivered_at' => $this->delivered_at?->toIso8601String(),
            'cancelled_at' => $this->cancelled_at?->toIso8601String(),
            'cancellation_reason' => $this->cancellation_reason,
            'delivery_request' => new DeliveryRequestResource($this->whenLoaded('deliveryRequest')),
            'offer' => new OfferResource($this->whenLoaded('offer')),
            'driver' => new UserResource($this->whenLoaded('driver')),
            'client' => new UserResource($this->whenLoaded('client')),
            'created_at' => $this->created_at?->toIso8601String(),
        ];
    }
}
