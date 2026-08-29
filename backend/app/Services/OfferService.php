<?php

namespace App\Services;

use App\Enums\DeliveryRequestStatus;
use App\Enums\OfferStatus;
use App\Enums\TripStatus;
use App\Models\DeliveryRequest;
use App\Models\Offer;
use App\Models\Trip;
use App\Models\User;
use Illuminate\Support\Facades\DB;

class OfferService
{
    public function accept(Offer $offer, User $client): Trip
    {
        return DB::transaction(function () use ($offer, $client) {
            $offer = Offer::lockForUpdate()->findOrFail($offer->id);

            if (! $offer->canBeAccepted()) {
                throw new \DomainException('Cette offre ne peut plus être acceptée.');
            }

            $offer->accept();

            $offer->deliveryRequest->offers()
                ->where('id', '!=', $offer->id)
                ->where('status', OfferStatus::Pending)
                ->update([
                    'status' => OfferStatus::Rejected,
                    'rejection_reason' => 'Offre concurrente acceptée',
                ]);

            $offer->deliveryRequest->update(['status' => DeliveryRequestStatus::Matched]);

            return Trip::create([
                'delivery_request_id' => $offer->delivery_request_id,
                'offer_id' => $offer->id,
                'driver_user_id' => $offer->user_id,
                'client_user_id' => $client->id,
                'status' => TripStatus::Assigned,
                'agreed_price' => $offer->price,
                'assigned_at' => now(),
            ]);
        });
    }

    public function store(DeliveryRequest $deliveryRequest, User $user, float $price, ?string $message): Offer
    {
        if (! $deliveryRequest->isOpen()) {
            throw new \DomainException('Cette demande n\'est pas ouverte aux offres');
        }

        if ($deliveryRequest->user_id === $user->id) {
            throw new \DomainException('Vous ne pouvez pas faire une offre sur votre propre demande');
        }

        $existing = Offer::where('delivery_request_id', $deliveryRequest->id)
            ->where('user_id', $user->id)
            ->where('status', OfferStatus::Pending)
            ->exists();

        if ($existing) {
            throw new \DomainException('Vous avez déjà une offre en cours pour cette demande');
        }

        return Offer::create([
            'delivery_request_id' => $deliveryRequest->id,
            'user_id' => $user->id,
            'status' => OfferStatus::Pending,
            'price' => $price,
            'message' => $message,
        ]);
    }
}
