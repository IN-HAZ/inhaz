<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class DeliveryRequest extends Model
{
    use HasFactory;

    protected $fillable = [
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
    ];

    protected function casts(): array
    {
        return [
            'package_weight' => 'decimal:2',
            'proposed_price' => 'decimal:2',
            'budget_min' => 'decimal:2',
            'budget_max' => 'decimal:2',
            'preferred_date' => 'datetime',
            'expires_at' => 'datetime',
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
        return $this->hasOne(Offer::class)->where('status', 'ACCEPTED');
    }

    public function trip()
    {
        return $this->hasOne(Trip::class);
    }

    public function isDraft(): bool
    {
        return $this->status === 'DRAFT';
    }

    public function isOpen(): bool
    {
        return $this->status === 'OPEN';
    }

    public function isCancelled(): bool
    {
        return $this->status === 'CANCELLED';
    }

    public function isExpired(): bool
    {
        return $this->status === 'EXPIRED';
    }

    public function isMatched(): bool
    {
        return $this->status === 'MATCHED';
    }

    public function canBeModified(): bool
    {
        return in_array($this->status, ['DRAFT', 'OPEN']);
    }

    public function canBeCancelled(): bool
    {
        return in_array($this->status, ['DRAFT', 'OPEN']);
    }

    public function cancel(string $reason): void
    {
        $this->update([
            'status' => 'CANCELLED',
            'cancellation_reason' => $reason,
        ]);
    }
}
