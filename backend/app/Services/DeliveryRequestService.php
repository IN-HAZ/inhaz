<?php

namespace App\Services;

use App\Enums\DeliveryRequestStatus;
use App\Models\DeliveryRequest;
use App\Models\User;

class DeliveryRequestService
{
    public function create(User $user, array $data, array $stops = []): DeliveryRequest
    {
        $data['status'] = $data['status'] ?? DeliveryRequestStatus::Open;

        $deliveryRequest = $user->deliveryRequests()->create($data);

        foreach ($stops as $stop) {
            $deliveryRequest->stops()->create($stop);
        }

        return $deliveryRequest->load('stops');
    }

    public function update(DeliveryRequest $deliveryRequest, array $data): DeliveryRequest
    {
        if (! $deliveryRequest->canBeModified()) {
            throw new \DomainException('Cette demande ne peut plus être modifiée');
        }

        $deliveryRequest->update($data);

        return $deliveryRequest->fresh(['stops']);
    }

    public function publish(DeliveryRequest $deliveryRequest): DeliveryRequest
    {
        if (! $deliveryRequest->isDraft()) {
            throw new \DomainException('Seules les demandes en brouillon peuvent être publiées');
        }

        if ($deliveryRequest->stops()->count() < 2) {
            throw new \DomainException('Il faut au moins un point de retrait et une destination');
        }

        $deliveryRequest->update(['status' => DeliveryRequestStatus::Open]);

        return $deliveryRequest->fresh(['stops']);
    }

    public function cancel(DeliveryRequest $deliveryRequest, ?string $reason = null): DeliveryRequest
    {
        if (! $deliveryRequest->canBeCancelled()) {
            throw new \DomainException('Cette demande ne peut pas être annulée');
        }

        if ($reason) {
            $deliveryRequest->cancel($reason);
        } else {
            $deliveryRequest->update(['status' => DeliveryRequestStatus::Cancelled]);
        }

        return $deliveryRequest->fresh(['stops']);
    }
}
