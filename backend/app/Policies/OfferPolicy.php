<?php

namespace App\Policies;

use App\Models\DeliveryRequest;
use App\Models\Offer;
use App\Models\User;

class OfferPolicy
{
    public function viewAny(User $user, DeliveryRequest $deliveryRequest): bool
    {
        return $user->id === $deliveryRequest->user_id;
    }

    public function create(User $user, DeliveryRequest $deliveryRequest): bool
    {
        return true;
    }

    public function accept(User $user, Offer $offer): bool
    {
        return $user->id === $offer->deliveryRequest->user_id;
    }

    public function reject(User $user, Offer $offer): bool
    {
        return $user->id === $offer->deliveryRequest->user_id;
    }

    public function withdraw(User $user, Offer $offer): bool
    {
        return $user->id === $offer->user_id;
    }
}
