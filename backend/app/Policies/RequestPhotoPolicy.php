<?php

namespace App\Policies;

use App\Models\DeliveryRequest;
use App\Models\RequestPhoto;
use App\Models\User;

class RequestPhotoPolicy
{
    public function manage(User $user, DeliveryRequest $deliveryRequest): bool
    {
        return $user->id === $deliveryRequest->user_id;
    }

    public function view(User $user, RequestPhoto $photo): bool
    {
        return $user->id === $photo->deliveryRequest->user_id;
    }

    public function delete(User $user, RequestPhoto $photo): bool
    {
        return $user->id === $photo->deliveryRequest->user_id;
    }
}
