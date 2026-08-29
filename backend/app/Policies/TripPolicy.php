<?php

namespace App\Policies;

use App\Models\Trip;
use App\Models\User;

class TripPolicy
{
    public function view(User $user, Trip $trip): bool
    {
        return $user->id === $trip->client_user_id || $user->id === $trip->driver_user_id;
    }

    public function transition(User $user, Trip $trip): bool
    {
        return $user->id === $trip->driver_user_id;
    }

    public function cancel(User $user, Trip $trip): bool
    {
        return $user->id === $trip->client_user_id || $user->id === $trip->driver_user_id;
    }

    public function rate(User $user, Trip $trip): bool
    {
        return $user->id === $trip->client_user_id || $user->id === $trip->driver_user_id;
    }
}
