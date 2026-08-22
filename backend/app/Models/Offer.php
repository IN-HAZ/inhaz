<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Offer extends Model
{
    use HasFactory;

    protected $fillable = [
        'delivery_request_id',
        'user_id',
        'status',
        'price',
        'message',
        'rejection_reason',
        'expires_at',
    ];

    protected function casts(): array
    {
        return [
            'price' => 'decimal:2',
            'expires_at' => 'datetime',
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
        return $this->status === 'PENDING';
    }

    public function isAccepted(): bool
    {
        return $this->status === 'ACCEPTED';
    }

    public function isRejected(): bool
    {
        return $this->status === 'REJECTED';
    }

    public function isWithdrawn(): bool
    {
        return $this->status === 'WITHDRAWN';
    }

    public function canBeAccepted(): bool
    {
        return $this->status === 'PENDING' && $this->deliveryRequest->isOpen();
    }

    public function canBeRejected(): bool
    {
        return $this->status === 'PENDING' && $this->deliveryRequest->isOpen();
    }

    public function canBeWithdrawn(): bool
    {
        return $this->status === 'PENDING';
    }

    public function accept(): void
    {
        $this->update(['status' => 'ACCEPTED']);
    }

    public function reject(string $reason = null): void
    {
        $this->update([
            'status' => 'REJECTED',
            'rejection_reason' => $reason,
        ]);
    }

    public function withdraw(): void
    {
        $this->update(['status' => 'WITHDRAWN']);
    }
}
