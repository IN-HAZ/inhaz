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
])]
class DriverProfile extends Model
{
    use HasFactory;

    public function scopePending(Builder $query): void
    {
        $query->where('status', DriverProfileStatus::Pending);
    }

    protected function casts(): array
    {
        return [
            'approved_at' => 'datetime',
            'rejected_at' => 'datetime',
            'status' => DriverProfileStatus::class,
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
}
