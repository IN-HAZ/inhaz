<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable([
    'delivery_request_id',
    'type',
    'order',
    'label',
    'address',
    'latitude',
    'longitude',
    'contact_name',
    'contact_phone',
    'instructions',
])]
class RequestStop extends Model
{
    use HasFactory;

    protected function casts(): array
    {
        return [
            'latitude' => 'decimal:7',
            'longitude' => 'decimal:7',
            'order' => 'integer',
        ];
    }

    public function deliveryRequest(): BelongsTo
    {
        return $this->belongsTo(DeliveryRequest::class);
    }

    public function isPickup(): bool
    {
        return $this->type === 'PICKUP';
    }

    public function isDestination(): bool
    {
        return $this->type === 'DESTINATION';
    }
}
