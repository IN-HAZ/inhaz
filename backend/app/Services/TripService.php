<?php

namespace App\Services;

use App\Enums\DeliveryRequestStatus;
use App\Enums\TripStatus;
use App\Models\Rating;
use App\Models\Trip;
use App\Models\User;
use Illuminate\Support\Facades\DB;

class TripService
{
    public function transition(Trip $trip, TripStatus $newStatus): Trip
    {
        $allowed = $trip->status->nextStatus();

        if ($allowed !== $newStatus) {
            throw new \DomainException("Transition de {$trip->status->value} vers {$newStatus->value} non autorisée.");
        }

        $trip->transitionTo($newStatus->value);

        if ($newStatus === TripStatus::Delivered) {
            $trip->deliveryRequest->update(['status' => DeliveryRequestStatus::Completed]);
        }

        return $trip->fresh();
    }

    public function cancel(Trip $trip, string $reason): Trip
    {
        if (! $trip->canBeCancelled()) {
            throw new \DomainException('Ce trajet ne peut plus être annulé.');
        }

        return DB::transaction(function () use ($trip, $reason) {
            $trip->cancel($reason);
            $trip->deliveryRequest->update(['status' => DeliveryRequestStatus::Cancelled]);

            return $trip->fresh();
        });
    }

    public function rate(Trip $trip, User $reviewer, int $score, ?string $comment): Rating
    {
        if (! $trip->isCompleted()) {
            throw new \DomainException('Seuls les trajets terminés peuvent être notés');
        }

        $existing = Rating::where('trip_id', $trip->id)
            ->where('reviewer_id', $reviewer->id)
            ->exists();

        if ($existing) {
            throw new \DomainException('Vous avez déjà noté ce trajet');
        }

        $revieweeId = $reviewer->id === $trip->driver_user_id ? $trip->client_user_id : $trip->driver_user_id;

        return Rating::create([
            'trip_id' => $trip->id,
            'reviewer_id' => $reviewer->id,
            'reviewee_id' => $revieweeId,
            'score' => $score,
            'comment' => $comment,
        ]);
    }
}
