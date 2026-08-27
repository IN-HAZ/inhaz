<?php

namespace App\Models;

use App\Enums\TripStatus;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable([
    'delivery_request_id',
    'offer_id',
    'driver_user_id',
    'client_user_id',
    'status',
    'agreed_price',
    'final_price',
    'assigned_at',
    'picked_up_at',
    'delivered_at',
    'cancelled_at',
    'cancellation_reason',
])]
class Trip extends Model
{
    use HasFactory;

    public function scopeForDriver(Builder $query, User $user): void
    {
        $query->where('driver_user_id', $user->id);
    }

    public function scopeForClient(Builder $query, User $user): void
    {
        $query->where('client_user_id', $user->id);
    }

    public function scopeActive(Builder $query): void
    {
        $query->whereNotIn('status', [TripStatus::Delivered, TripStatus::Cancelled]);
    }

    protected function casts(): array
    {
        return [
            'agreed_price' => 'decimal:2',
            'final_price' => 'decimal:2',
            'assigned_at' => 'datetime',
            'picked_up_at' => 'datetime',
            'delivered_at' => 'datetime',
            'cancelled_at' => 'datetime',
            'status' => TripStatus::class,
        ];
    }

    public function deliveryRequest(): BelongsTo
    {
        return $this->belongsTo(DeliveryRequest::class);
    }

    public function offer(): BelongsTo
    {
        return $this->belongsTo(Offer::class);
    }

    public function driver(): BelongsTo
    {
        return $this->belongsTo(User::class, 'driver_user_id');
    }

    public function client(): BelongsTo
    {
        return $this->belongsTo(User::class, 'client_user_id');
    }

    public function ratings()
    {
        return $this->hasMany(Rating::class);
    }

    public function isAssigned(): bool
    {
        return $this->status === TripStatus::Assigned;
    }

    public function isCompleted(): bool
    {
        return $this->status === TripStatus::Delivered;
    }

    public function isCancelled(): bool
    {
        return $this->status === TripStatus::Cancelled;
    }

    public function isActive(): bool
    {
        return ! in_array($this->status, [TripStatus::Delivered, TripStatus::Cancelled]);
    }

    public function canBeCancelled(): bool
    {
        return $this->status->canCancel();
    }

    public function cancel(string $reason): void
    {
        $this->update([
            'status' => TripStatus::Cancelled,
            'cancellation_reason' => $reason,
            'cancelled_at' => now(),
        ]);
    }

    public function transitionTo(string $status): void
    {
        $nowFields = match ($status) {
            'ASSIGNED' => 'assigned_at',
            'PICKED_UP' => 'picked_up_at',
            'DELIVERED' => 'delivered_at',
            default => null,
        };

        $data = ['status' => $status];
        if ($nowFields) {
            $data[$nowFields] = now();
        }

        $this->update($data);
    }
}
