<?php

namespace App\Models;

use App\Enums\DocumentType;
use App\Enums\DriverProfileStatus;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable([
    'driver_profile_id',
    'type',
    'file',
    'status',
    'expires_at',
    'verified_at',
    'verified_by',
    'rejection_reason',
])]
class DriverDocument extends Model
{
    public function scopePending(Builder $query): void
    {
        $query->where('status', DriverProfileStatus::Pending);
    }

    protected function casts(): array
    {
        return [
            'expires_at' => 'datetime',
            'verified_at' => 'datetime',
            'status' => DriverProfileStatus::class,
            'type' => DocumentType::class,
        ];
    }

    public function driverProfile(): BelongsTo
    {
        return $this->belongsTo(DriverProfile::class);
    }

    public function verifiedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'verified_by');
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
}
