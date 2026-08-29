<?php

namespace App\Models;

use App\Enums\OfferStatus;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable([
    'delivery_request_id',
    'user_id',
    'status',
    'price',
    'message',
    'rejection_reason',
    'expires_at',
])]
class Offer extends Model
{
    use HasFactory;

    protected function casts(): array
    {
        return [
            'price' => 'decimal:2',
            'expires_at' => 'datetime',
            'status' => OfferStatus::class,
        ];
    }

    public function deliveryRequest(): BelongsTo
    {
        return $this->belongsTo(DeliveryRequest::class);
    }

    public function driver(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function isPending(): bool
    {
        return $this->status === OfferStatus::Pending;
    }

    public function isAccepted(): bool
    {
        return $this->status === OfferStatus::Accepted;
    }

    public function isRejected(): bool
    {
        return $this->status === OfferStatus::Rejected;
    }

    public function isWithdrawn(): bool
    {
        return $this->status === OfferStatus::Withdrawn;
    }

    public function canBeAccepted(): bool
    {
        return $this->status === OfferStatus::Pending && $this->deliveryRequest->isOpen();
    }

    public function canBeRejected(): bool
    {
        return $this->status === OfferStatus::Pending && $this->deliveryRequest->isOpen();
    }

    public function canBeWithdrawn(): bool
    {
        return $this->status === OfferStatus::Pending;
    }

    public function accept(): void
    {
        $this->update(['status' => OfferStatus::Accepted]);
    }

    public function reject(?string $reason = null): void
    {
        $this->update([
            'status' => OfferStatus::Rejected,
            'rejection_reason' => $reason,
        ]);
    }

    public function withdraw(): void
    {
        $this->update(['status' => OfferStatus::Withdrawn]);
    }
}
