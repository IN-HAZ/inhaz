<?php

namespace App\Policies;

use App\Models\DriverProfile;
use App\Models\User;

class DriverProfilePolicy
{
    public function view(User $user, DriverProfile $driverProfile): bool
    {
        return $user->id === $driverProfile->user_id || $user->role === 'admin';
    }

    public function update(User $user, DriverProfile $driverProfile): bool
    {
        return $user->id === $driverProfile->user_id || $user->role === 'admin';
    }

    public function delete(User $user, DriverProfile $driverProfile): bool
    {
        return $user->id === $driverProfile->user_id || $user->role === 'admin';
    }
}
