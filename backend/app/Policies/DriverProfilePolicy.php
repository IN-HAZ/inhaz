<?php

namespace App\Policies;

use App\Enums\UserRole;
use App\Models\DriverProfile;
use App\Models\User;

class DriverProfilePolicy
{
    public function view(User $user, DriverProfile $driverProfile): bool
    {
        return $user->id === $driverProfile->user_id || $user->role === UserRole::Admin;
    }

    public function update(User $user, DriverProfile $driverProfile): bool
    {
        return $user->id === $driverProfile->user_id || $user->role === UserRole::Admin;
    }

    public function toggleOnline(User $user, DriverProfile $driverProfile): bool
    {
        return $user->id === $driverProfile->user_id;
    }

    public function updateLocation(User $user, DriverProfile $driverProfile): bool
    {
        return $user->id === $driverProfile->user_id;
    }

    public function storeDocument(User $user, DriverProfile $driverProfile): bool
    {
        return $user->id === $driverProfile->user_id;
    }

    public function storeVehicle(User $user, DriverProfile $driverProfile): bool
    {
        return $user->id === $driverProfile->user_id;
    }

    public function delete(User $user, DriverProfile $driverProfile): bool
    {
        return $user->id === $driverProfile->user_id || $user->role === UserRole::Admin;
    }
}
