<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Trip;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class TripController extends Controller
{
    private function authorizeUser(Request $request): ?JsonResponse
    {
        if (! $request->user()) {
            return response()->json(['message' => 'Non authentifi\u00e9'], 401);
        }

        return null;
    }

    public function show(Request $request, Trip $trip): JsonResponse
    {
        if ($unauthorized = $this->authorizeUser($request)) {
            return $unauthorized;
        }

        $userId = $request->user()->id;
        if ($trip->driver_user_id !== $userId && $trip->client_user_id !== $userId) {
            return response()->json(['message' => 'Non autoris\u00e9'], 403);
        }

        $trip->load(['deliveryRequest.stops', 'offer', 'driver', 'client']);

        return response()->json(['trip' => $this->formatTrip($trip)]);
    }

    public function driverTrips(Request $request): JsonResponse
    {
        if ($unauthorized = $this->authorizeUser($request)) {
            return $unauthorized;
        }

        $trips = Trip::where('driver_user_id', $request->user()->id)
            ->with(['deliveryRequest.stops', 'client'])
            ->latest()
            ->paginate(20);

        return response()->json([
            'trips' => $trips->getCollection()->map(fn ($t) => $this->formatTrip($t)),
            'pagination' => [
                'total' => $trips->total(),
                'per_page' => $trips->perPage(),
                'current_page' => $trips->currentPage(),
                'last_page' => $trips->lastPage(),
            ],
        ]);
    }

    public function clientTrips(Request $request): JsonResponse
    {
        if ($unauthorized = $this->authorizeUser($request)) {
            return $unauthorized;
        }

        $trips = Trip::where('client_user_id', $request->user()->id)
            ->with(['deliveryRequest.stops', 'driver'])
            ->latest()
            ->paginate(20);

        return response()->json([
            'trips' => $trips->getCollection()->map(fn ($t) => $this->formatTrip($t)),
            'pagination' => [
                'total' => $trips->total(),
                'per_page' => $trips->perPage(),
                'current_page' => $trips->currentPage(),
                'last_page' => $trips->lastPage(),
            ],
        ]);
    }

    public function transition(Request $request, Trip $trip): JsonResponse
    {
        if ($unauthorized = $this->authorizeUser($request)) {
            return $unauthorized;
        }

        $userId = $request->user()->id;
        if ($trip->driver_user_id !== $userId) {
            return response()->json(['message' => 'Seul le chauffeur peut changer le statut'], 403);
        }

        $validated = $request->validate([
            'status' => ['required', 'string', 'in:DRIVER_EN_ROUTE,AT_PICKUP,PICKED_UP,IN_TRANSIT,AT_DESTINATION,DELIVERED'],
        ]);

        $newStatus = $validated['status'];

        $allowed = $this->getAllowedTransitions($trip->status);
        if (! in_array($newStatus, $allowed)) {
            return response()->json([
                'message' => "Transition de {$trip->status} vers {$newStatus} non autoris\u00e9e",
            ], 422);
        }

        $trip->transitionTo($newStatus);

        if ($newStatus === 'DELIVERED') {
            $trip->deliveryRequest->update(['status' => 'COMPLETED']);
        }

        $trip->load(['deliveryRequest.stops', 'client']);

        return response()->json([
            'message' => 'Statut mis \u00e0 jour',
            'trip' => $this->formatTrip($trip->fresh()),
        ]);
    }

    public function cancel(Request $request, Trip $trip): JsonResponse
    {
        if ($unauthorized = $this->authorizeUser($request)) {
            return $unauthorized;
        }

        $userId = $request->user()->id;
        if ($trip->driver_user_id !== $userId && $trip->client_user_id !== $userId) {
            return response()->json(['message' => 'Non autoris\u00e9'], 403);
        }

        if (! $trip->canBeCancelled()) {
            return response()->json(['message' => 'Ce trajet ne peut plus \u00eatre annul\u00e9'], 422);
        }

        $request->validate([
            'cancellation_reason' => ['required', 'string', 'max:500'],
        ]);

        $trip->cancel($request->input('cancellation_reason'));
        $trip->deliveryRequest->update(['status' => 'CANCELLED']);

        return response()->json([
            'message' => 'Trajet annul\u00e9',
            'trip' => $this->formatTrip($trip->fresh()),
        ]);
    }

    public function waypoints(Request $request, Trip $trip): JsonResponse
    {
        if ($unauthorized = $this->authorizeUser($request)) {
            return $unauthorized;
        }

        $userId = $request->user()->id;
        if ($trip->driver_user_id !== $userId && $trip->client_user_id !== $userId) {
            return response()->json(['message' => 'Non autoris\u00e9'], 403);
        }

        $stops = $trip->deliveryRequest->stops()->orderBy('order')->get();

        $waypoints = $stops->map(fn ($stop) => [
            'type' => $stop->type,
            'address' => $stop->address,
            'latitude' => $stop->latitude,
            'longitude' => $stop->longitude,
            'contact_name' => $stop->contact_name,
            'contact_phone' => $stop->contact_phone,
        ]);

        $currentStopIndex = $this->getCurrentStopIndex($trip, $stops);

        return response()->json([
            'trip_id' => $trip->id,
            'status' => $trip->status,
            'current_stop_index' => $currentStopIndex,
            'waypoints' => $waypoints,
        ]);
    }

    public function rate(Request $request, Trip $trip): JsonResponse
    {
        if ($unauthorized = $this->authorizeUser($request)) {
            return $unauthorized;
        }

        if (! $trip->isCompleted()) {
            return response()->json(['message' => 'Seuls les trajets termin\u00e9s peuvent \u00eatre not\u00e9s'], 422);
        }

        $userId = $request->user()->id;
        if ($trip->driver_user_id !== $userId && $trip->client_user_id !== $userId) {
            return response()->json(['message' => 'Non autoris\u00e9'], 403);
        }

        $revieweeId = $userId === $trip->driver_user_id ? $trip->client_user_id : $trip->driver_user_id;

        $existing = \App\Models\Rating::where('trip_id', $trip->id)
            ->where('reviewer_id', $userId)
            ->exists();

        if ($existing) {
            return response()->json(['message' => 'Vous avez d\u00e9j\u00e0 not\u00e9 ce trajet'], 422);
        }

        $validated = $request->validate([
            'score' => ['required', 'integer', 'min:1', 'max:5'],
            'comment' => ['nullable', 'string', 'max:500'],
        ]);

        $rating = \App\Models\Rating::create([
            'trip_id' => $trip->id,
            'reviewer_id' => $userId,
            'reviewee_id' => $revieweeId,
            'score' => $validated['score'],
            'comment' => $validated['comment'] ?? null,
        ]);

        return response()->json([
            'message' => 'Note enregistr\u00e9e',
            'rating' => [
                'id' => $rating->id,
                'score' => $rating->score,
                'comment' => $rating->comment,
            ],
        ], 201);
    }

    private function getCurrentStopIndex(Trip $trip, $stops): int
    {
        return match ($trip->status) {
            'ASSIGNED', 'DRIVER_EN_ROUTE' => 0,
            'AT_PICKUP', 'PICKED_UP' => 0,
            'IN_TRANSIT' => 1,
            'AT_DESTINATION', 'DELIVERED' => 1,
            default => 0,
        };
    }

    private function getAllowedTransitions(string $current): array
    {
        return match ($current) {
            'ASSIGNED' => ['DRIVER_EN_ROUTE', 'CANCELLED'],
            'DRIVER_EN_ROUTE' => ['AT_PICKUP', 'CANCELLED'],
            'AT_PICKUP' => ['PICKED_UP'],
            'PICKED_UP' => ['IN_TRANSIT'],
            'IN_TRANSIT' => ['AT_DESTINATION'],
            'AT_DESTINATION' => ['DELIVERED'],
            default => [],
        };
    }

    private function formatTrip(Trip $trip): array
    {
        return [
            'id' => $trip->id,
            'status' => $trip->status,
            'agreed_price' => $trip->agreed_price,
            'final_price' => $trip->final_price,
            'assigned_at' => $trip->assigned_at?->toIso8601String(),
            'picked_up_at' => $trip->picked_up_at?->toIso8601String(),
            'delivered_at' => $trip->delivered_at?->toIso8601String(),
            'cancelled_at' => $trip->cancelled_at?->toIso8601String(),
            'cancellation_reason' => $trip->cancellation_reason,
            'delivery_request' => $trip->deliveryRequest ? [
                'id' => $trip->deliveryRequest->id,
                'title' => $trip->deliveryRequest->title,
                'stops' => $trip->deliveryRequest->stops->map(fn ($s) => [
                    'type' => $s->type,
                    'address' => $s->address,
                    'latitude' => $s->latitude,
                    'longitude' => $s->longitude,
                ]),
            ] : null,
            'driver' => $trip->driver ? [
                'id' => $trip->driver->id,
                'name' => $trip->driver->name,
                'phone' => $trip->driver->phone,
            ] : null,
            'client' => $trip->client ? [
                'id' => $trip->client->id,
                'name' => $trip->client->name,
                'phone' => $trip->client->phone,
            ] : null,
            'created_at' => $trip->created_at?->toIso8601String(),
        ];
    }
}
