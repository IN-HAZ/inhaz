<?php

namespace App\Models;

use App\Enums\DeliveryRequestStatus;
use App\Enums\OfferStatus;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable([
    'user_id',
    'status',
    'title',
    'description',
    'package_weight',
    'package_dimensions',
    'proposed_price',
    'budget_min',
    'budget_max',
    'preferred_date',
    'preferred_time_slot',
    'instructions',
    'expires_at',
    'cancellation_reason',
])]
class DeliveryRequest extends Model
{
    use HasFactory;

    public function scopeOpen(Builder $query): void
    {
        $query->where('status', DeliveryRequestStatus::Open);
    }

    public function scopeOwnedBy(Builder $query, User $user): void
    {
        $query->where('user_id', $user->id);
    }

    protected function casts(): array
    {
        return [
            'package_weight' => 'decimal:2',
            'proposed_price' => 'decimal:2',
            'budget_min' => 'decimal:2',
            'budget_max' => 'decimal:2',
            'preferred_date' => 'datetime',
            'expires_at' => 'datetime',
            'status' => DeliveryRequestStatus::class,
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function stops(): HasMany
    {
        return $this->hasMany(RequestStop::class)->orderBy('order');
    }

    public function pickup(): HasMany
    {
        return $this->stops()->where('type', 'PICKUP');
    }

    public function destinations(): HasMany
    {
        return $this->stops()->where('type', 'DESTINATION');
    }

    public function photos(): HasMany
    {
        return $this->hasMany(RequestPhoto::class);
    }

    public function offers(): HasMany
    {
        return $this->hasMany(Offer::class);
    }

    public function acceptedOffer()
    {
        return $this->hasOne(Offer::class)->where('status', OfferStatus::Accepted);
    }

    public function trip()
    {
        return $this->hasOne(Trip::class);
    }

    public function isDraft(): bool
    {
        return $this->status === DeliveryRequestStatus::Draft;
    }

    public function isOpen(): bool
    {
        return $this->status === DeliveryRequestStatus::Open;
    }

    public function isCancelled(): bool
    {
        return $this->status === DeliveryRequestStatus::Cancelled;
    }

    public function isExpired(): bool
    {
        return $this->status === DeliveryRequestStatus::Expired;
    }

    public function isMatched(): bool
    {
        return $this->status === DeliveryRequestStatus::Matched;
    }

    public function canBeModified(): bool
    {
        return in_array($this->status, [DeliveryRequestStatus::Draft, DeliveryRequestStatus::Open]);
    }

    public function canBeCancelled(): bool
    {
        return in_array($this->status, [DeliveryRequestStatus::Draft, DeliveryRequestStatus::Open]);
    }

    public function cancel(string $reason): void
    {
        $this->update([
            'status' => DeliveryRequestStatus::Cancelled,
            'cancellation_reason' => $reason,
        ]);
    }
}
