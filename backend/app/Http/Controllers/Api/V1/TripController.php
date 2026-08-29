<?php

namespace App\Http\Controllers\Api\V1;

use App\Enums\TripStatus;
use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\CancelTripRequest;
use App\Http\Requests\Api\V1\RateTripRequest;
use App\Http\Requests\Api\V1\TransitionTripRequest;
use App\Http\Resources\RatingResource;
use App\Http\Resources\TripResource;
use App\Models\Trip;
use App\Services\TripService;
use DomainException;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class TripController extends Controller
{
    use AuthorizesRequests;

    public function __construct(private TripService $tripService) {}

    public function show(Request $request, Trip $trip): JsonResponse
    {
        $this->authorize('view', $trip);

        return response()->json([
            'trip' => new TripResource($trip->load(['deliveryRequest.stops', 'offer', 'driver', 'client'])),
        ]);
    }

    public function driverTrips(Request $request): JsonResponse
    {
        $trips = Trip::forDriver($request->user())->with(['deliveryRequest.stops', 'client'])->latest()->paginate(20);

        return response()->json([
            'trips' => TripResource::collection($trips->getCollection()),
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
        $trips = Trip::forClient($request->user())->with(['deliveryRequest.stops', 'driver'])->latest()->paginate(20);

        return response()->json([
            'trips' => TripResource::collection($trips->getCollection()),
            'pagination' => [
                'total' => $trips->total(),
                'per_page' => $trips->perPage(),
                'current_page' => $trips->currentPage(),
                'last_page' => $trips->lastPage(),
            ],
        ]);
    }

    public function transition(TransitionTripRequest $request, Trip $trip): JsonResponse
    {
        $this->authorize('transition', $trip);

        try {
            $this->tripService->transition($trip, TripStatus::from($request->validated('status')));
        } catch (DomainException $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        }

        return response()->json([
            'message' => 'Statut mis à jour',
            'trip' => new TripResource($trip->fresh()->load(['deliveryRequest.stops', 'client'])),
        ]);
    }

    public function cancel(CancelTripRequest $request, Trip $trip): JsonResponse
    {
        $this->authorize('cancel', $trip);

        try {
            $this->tripService->cancel($trip, $request->validated('cancellation_reason'));
        } catch (DomainException $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        }

        return response()->json([
            'message' => 'Trajet annulé',
            'trip' => new TripResource($trip->fresh()),
        ]);
    }

    public function waypoints(Request $request, Trip $trip): JsonResponse
    {
        $this->authorize('view', $trip);

        $stops = $trip->deliveryRequest->stops()->orderBy('order')->get();

        $waypoints = $stops->map(fn ($stop) => [
            'type' => $stop->type,
            'address' => $stop->address,
            'latitude' => $stop->latitude,
            'longitude' => $stop->longitude,
            'contact_name' => $stop->contact_name,
            'contact_phone' => $stop->contact_phone,
        ]);

        return response()->json([
            'trip_id' => $trip->id,
            'status' => $trip->status,
            'current_stop_index' => $this->getCurrentStopIndex($trip, $stops),
            'waypoints' => $waypoints,
        ]);
    }

    private function getCurrentStopIndex(Trip $trip, $stops): int
    {
        return match ($trip->status) {
            TripStatus::Assigned, TripStatus::DriverEnRoute => 0,
            TripStatus::AtPickup, TripStatus::PickedUp => 0,
            TripStatus::InTransit => 1,
            TripStatus::AtDestination, TripStatus::Delivered => 1,
            default => 0,
        };
    }

    public function rate(RateTripRequest $request, Trip $trip): JsonResponse
    {
        $this->authorize('rate', $trip);

        try {
            $rating = $this->tripService->rate($trip, $request->user(), $request->validated('score'), $request->validated('comment'));

            return response()->json([
                'message' => 'Note enregistrée',
                'rating' => new RatingResource($rating),
            ], 201);
        } catch (DomainException $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        }
    }
}
