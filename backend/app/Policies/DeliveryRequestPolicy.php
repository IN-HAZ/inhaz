<?php

namespace App\Policies;

use App\Models\DeliveryRequest;
use App\Models\User;

class DeliveryRequestPolicy
{
    public function view(User $user, DeliveryRequest $deliveryRequest): bool
    {
        return $user->id === $deliveryRequest->user_id;
    }

    public function update(User $user, DeliveryRequest $deliveryRequest): bool
    {
        return $user->id === $deliveryRequest->user_id;
    }

    public function delete(User $user, DeliveryRequest $deliveryRequest): bool
    {
        return $user->id === $deliveryRequest->user_id;
    }
}
