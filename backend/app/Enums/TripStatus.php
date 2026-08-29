<?php

namespace App\Enums;

enum TripStatus: string
{
    case Assigned = 'ASSIGNED';
    case DriverEnRoute = 'DRIVER_EN_ROUTE';
    case AtPickup = 'AT_PICKUP';
    case PickedUp = 'PICKED_UP';
    case InTransit = 'IN_TRANSIT';
    case AtDestination = 'AT_DESTINATION';
    case Delivered = 'DELIVERED';
    case Cancelled = 'CANCELLED';

    public function nextStatus(): ?self
    {
        return match ($this) {
            self::Assigned => self::DriverEnRoute,
            self::DriverEnRoute => self::AtPickup,
            self::AtPickup => self::PickedUp,
            self::PickedUp => self::InTransit,
            self::InTransit => self::AtDestination,
            self::AtDestination => self::Delivered,
            default => null,
        };
    }

    public function canCancel(): bool
    {
        return in_array($this, [self::Assigned, self::DriverEnRoute]);
    }
}
