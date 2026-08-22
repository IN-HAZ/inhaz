<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class DeliveryRequestResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'status' => $this->status,
            'title' => $this->title,
            'description' => $this->description,
            'package_weight' => $this->package_weight,
            'package_dimensions' => $this->package_dimensions,
            'proposed_price' => $this->proposed_price,
            'budget_min' => $this->budget_min,
            'budget_max' => $this->budget_max,
            'preferred_date' => $this->preferred_date?->toIso8601String(),
            'preferred_time_slot' => $this->preferred_time_slot,
            'instructions' => $this->instructions,
            'cancellation_reason' => $this->cancellation_reason,
            'expires_at' => $this->expires_at?->toIso8601String(),
            'stops' => RequestStopResource::collection($this->whenLoaded('stops')),
            'created_at' => $this->created_at?->toIso8601String(),
            'updated_at' => $this->updated_at?->toIso8601String(),
        ];
    }
}
