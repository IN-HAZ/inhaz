<?php

namespace App\Models;

use App\Enums\DriverProfileStatus;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

#[Fillable([
    'user_id',
    'status',
    'approved_at',
    'rejected_at',
    'rejection_reason',
    'is_online',
    'last_online_at',
    'current_latitude',
    'current_longitude',
    'wallet_balance',
])]
class DriverProfile extends Model
{
    use HasFactory;

    public function scopePending(Builder $query): void
    {
        $query->where('status', DriverProfileStatus::Pending);
    }

    public function scopeOnline(Builder $query): void
    {
        $query->where('is_online', true);
    }

    protected function casts(): array
    {
        return [
            'approved_at' => 'datetime',
            'rejected_at' => 'datetime',
            'last_online_at' => 'datetime',
            'is_online' => 'boolean',
            'status' => DriverProfileStatus::class,
            'current_latitude' => 'float',
            'current_longitude' => 'float',
            'wallet_balance' => 'float',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function vehicle(): HasOne
    {
        return $this->hasOne(Vehicle::class);
    }

    public function documents(): HasMany
    {
        return $this->hasMany(DriverDocument::class);
    }

    public function isPending(): bool
    {
        return $this->status === DriverProfileStatus::Pending;
    }

    public function isApproved(): bool
    {
        return $this->status === DriverProfileStatus::Approved;
    }

    public function isRejected(): bool
    {
        return $this->status === DriverProfileStatus::Rejected;
    }

    public function isOnline(): bool
    {
        return (bool) $this->is_online;
    }

    public function canGoOnline(?float $maxDebtThreshold = null): bool
    {
        if (! $this->isApproved()) {
            return false;
        }

        $threshold = $maxDebtThreshold ?? (float) config('inhaz.max_commission_debt_mad', 200.00);

        // If wallet_balance is negative (representing debt owed to platform), check threshold
        if ($this->wallet_balance < 0 && abs($this->wallet_balance) > $threshold) {
            return false;
        }

        return true;
    }
}
