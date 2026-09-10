<?php

namespace App\Services;

use App\Enums\DeliveryRequestStatus;
use App\Models\DeliveryRequest;
use App\Models\User;

class DeliveryRequestService
{
    public function create(User $user, array $data = [], array $stops = []): DeliveryRequest
    {
        if (! isset($data['status'])) {
            $data['status'] = empty($data) ? DeliveryRequestStatus::Draft : DeliveryRequestStatus::Open;
        }

        $deliveryRequest = $user->deliveryRequests()->create($data);

        foreach ($stops as $index => $stop) {
            $stop['order'] = $stop['order'] ?? $index;
            $deliveryRequest->stops()->create($stop);
        }

        return $deliveryRequest->load(['stops', 'photos']);
    }

    public function patchStep(DeliveryRequest $deliveryRequest, string $step, array $data): DeliveryRequest
    {
        if (! $deliveryRequest->isDraft()) {
            throw new \DomainException('Seules les demandes en brouillon peuvent être modifiées par étapes');
        }

        switch ($step) {
            case 'locations':
                if (isset($data['stops']) && is_array($data['stops'])) {
                    $deliveryRequest->stops()->delete();
                    foreach ($data['stops'] as $index => $stop) {
                        $deliveryRequest->stops()->create([
                            'type' => $stop['type'] ?? 'DESTINATION',
                            'address' => $stop['address'] ?? '',
                            'latitude' => $stop['latitude'] ?? null,
                            'longitude' => $stop['longitude'] ?? null,
                            'contact_name' => $stop['contact_name'] ?? null,
                            'contact_phone' => $stop['contact_phone'] ?? null,
                            'order' => $stop['order'] ?? $index,
                        ]);
                    }
                }
                break;

            case 'package':
                $updateData = [];
                if (array_key_exists('package_description', $data)) {
                    $updateData['description'] = $data['package_description'];
                } elseif (array_key_exists('description', $data)) {
                    $updateData['description'] = $data['description'];
                }

                if (array_key_exists('package_weight_kg', $data)) {
                    $updateData['package_weight'] = $data['package_weight_kg'];
                } elseif (array_key_exists('package_weight', $data)) {
                    $updateData['package_weight'] = $data['package_weight'];
                }

                if (! empty($updateData)) {
                    $deliveryRequest->update($updateData);
                }
                break;

            case 'vehicle':
                if (isset($data['vehicle_type'])) {
                    $deliveryRequest->update(['vehicle_type' => mb_strtolower($data['vehicle_type'])]);
                }
                break;

            case 'pricing':
                if (isset($data['proposed_price'])) {
                    $price = (float) $data['proposed_price'];
                    if ($price < 20.0) {
                        throw new \DomainException('Le prix proposé ne peut pas être inférieur à 20 MAD');
                    }
                    $deliveryRequest->update(['proposed_price' => $price]);
                }
                break;

            default:
                throw new \DomainException("Étape invalide: {$step}");
        }

        return $deliveryRequest->fresh(['stops', 'photos']);
    }

    public function update(DeliveryRequest $deliveryRequest, array $data): DeliveryRequest
    {
        if (! $deliveryRequest->canBeModified()) {
            throw new \DomainException('Cette demande ne peut plus être modifiée');
        }

        $deliveryRequest->update($data);

        return $deliveryRequest->fresh(['stops', 'photos']);
    }

    public function publish(DeliveryRequest $deliveryRequest): DeliveryRequest
    {
        if (! $deliveryRequest->isDraft()) {
            throw new \DomainException('Seules les demandes en brouillon peuvent être publiées');
        }

        $pickupCount = $deliveryRequest->stops()->where('type', 'PICKUP')->count();
        $destCount = $deliveryRequest->stops()->where('type', 'DESTINATION')->count();

        if ($pickupCount < 1 || $destCount < 1) {
            throw new \DomainException('Il faut au moins un point de retrait (PICKUP) et une destination');
        }

        if (empty($deliveryRequest->description)) {
            throw new \DomainException('La description du colis est obligatoire pour publier');
        }

        if (empty($deliveryRequest->vehicle_type)) {
            throw new \DomainException('Le type de véhicule est obligatoire pour publier');
        }

        if (is_null($deliveryRequest->proposed_price) || (float) $deliveryRequest->proposed_price < 20.0) {
            throw new \DomainException('Le prix proposé ne peut pas être inférieur à 20 MAD');
        }

        $deliveryRequest->update(['status' => DeliveryRequestStatus::Open]);

        return $deliveryRequest->fresh(['stops', 'photos']);
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

        return $deliveryRequest->fresh(['stops', 'photos']);
    }
}
