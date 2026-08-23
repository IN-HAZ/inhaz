<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\StoreDeliveryRequestRequest;
use App\Http\Requests\Api\V1\UpdateDeliveryRequestRequest;
use App\Http\Resources\DeliveryRequestResource;
use App\Models\DeliveryRequest;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class DeliveryRequestController extends Controller
{
    private function authorizeUser(Request $request): ?JsonResponse
    {
        if (! $request->user()) {
            return response()->json(['message' => 'Non authentifié'], 401);
        }

        return null;
    }

    public function index(Request $request): JsonResponse
    {
        if ($unauthorized = $this->authorizeUser($request)) {
            return $unauthorized;
        }

        $requests = $request->user()
            ->deliveryRequests()
            ->with('stops')
            ->latest()
            ->paginate(20);

        return response()->json([
            'requests' => DeliveryRequestResource::collection($requests),
            'pagination' => [
                'total' => $requests->total(),
                'per_page' => $requests->perPage(),
                'current_page' => $requests->currentPage(),
                'last_page' => $requests->lastPage(),
            ],
        ]);
    }

    public function store(StoreDeliveryRequestRequest $request): JsonResponse
    {
        if ($unauthorized = $this->authorizeUser($request)) {
            return $unauthorized;
        }

        $deliveryRequest = $request->user()->deliveryRequests()->create(
            $request->validated()
        );

        if ($request->has('stops')) {
            foreach ($request->stops as $stop) {
                $deliveryRequest->stops()->create($stop);
            }
        }

        $deliveryRequest->load('stops');

        return response()->json([
            'message' => 'Demande créée avec succès',
            'request' => new DeliveryRequestResource($deliveryRequest),
        ], 201);
    }

    public function show(Request $request, DeliveryRequest $deliveryRequest): JsonResponse
    {
        if ($unauthorized = $this->authorizeUser($request)) {
            return $unauthorized;
        }
        if ($deliveryRequest->user_id !== $request->user()->id) {
            return response()->json([
                'message' => 'Non autorisé',
            ], 403);
        }

        $deliveryRequest->load('stops');

        return response()->json([
            'request' => new DeliveryRequestResource($deliveryRequest),
        ]);
    }

    public function update(UpdateDeliveryRequestRequest $request, DeliveryRequest $deliveryRequest): JsonResponse
    {
        if ($unauthorized = $this->authorizeUser($request)) {
            return $unauthorized;
        }
        if ($deliveryRequest->user_id !== $request->user()->id) {
            return response()->json([
                'message' => 'Non autorisé',
            ], 403);
        }

        if (! $deliveryRequest->canBeModified()) {
            return response()->json([
                'message' => 'Cette demande ne peut plus être modifiée',
            ], 422);
        }

        $deliveryRequest->update($request->validated());
        $deliveryRequest->load('stops');

        return response()->json([
            'message' => 'Demande mise à jour',
            'request' => new DeliveryRequestResource($deliveryRequest),
        ]);
    }

    public function destroy(Request $request, DeliveryRequest $deliveryRequest): JsonResponse
    {
        if ($unauthorized = $this->authorizeUser($request)) {
            return $unauthorized;
        }
        if ($deliveryRequest->user_id !== $request->user()->id) {
            return response()->json([
                'message' => 'Non autorisé',
            ], 403);
        }

        if (! $deliveryRequest->canBeCancelled()) {
            return response()->json([
                'message' => 'Cette demande ne peut pas être annulée',
            ], 422);
        }

        $deliveryRequest->update(['status' => 'CANCELLED']);

        return response()->json([
            'message' => 'Demande annulée',
        ]);
    }

    public function cancel(Request $request, DeliveryRequest $deliveryRequest): JsonResponse
    {
        if ($unauthorized = $this->authorizeUser($request)) {
            return $unauthorized;
        }
        if ($deliveryRequest->user_id !== $request->user()->id) {
            return response()->json(['message' => 'Non autorisé'], 403);
        }

        if (! $deliveryRequest->canBeCancelled()) {
            return response()->json(['message' => 'Cette demande ne peut pas être annulée'], 422);
        }

        $request->validate([
            'cancellation_reason' => ['required', 'string', 'max:500'],
        ]);

        $deliveryRequest->cancel($request->input('cancellation_reason'));

        return response()->json([
            'message' => 'Demande annulée',
            'request' => new DeliveryRequestResource($deliveryRequest->fresh(['stops'])),
        ]);
    }

    public function browse(Request $request): JsonResponse
    {
        if ($unauthorized = $this->authorizeUser($request)) {
            return $unauthorized;
        }

        $query = DeliveryRequest::where('status', 'OPEN')
            ->with('stops')
            ->withCount('offers')
            ->latest();

        if ($request->filled('search')) {
            $search = mb_strtolower($request->input('search'));
            // LOWER() keeps search case-insensitive on PostgreSQL (LIKE is case-sensitive there).
            $query->where(function ($q) use ($search) {
                $q->whereRaw('LOWER(title) LIKE ?', ["%{$search}%"])
                    ->orWhereRaw('LOWER(description) LIKE ?', ["%{$search}%"]);
            });
        }

        if ($request->filled('budget_min')) {
            $query->where('budget_min', '>=', $request->input('budget_min'));
        }

        if ($request->filled('budget_max')) {
            $query->where('budget_max', '<=', $request->input('budget_max'));
        }

        $requests = $query->paginate(20);

        $results = $requests->getCollection()->map(fn ($req) => [
            'id' => $req->id,
            'title' => $req->title,
            'description' => $req->description,
            'proposed_price' => $req->proposed_price,
            'budget_min' => $req->budget_min,
            'budget_max' => $req->budget_max,
            'preferred_date' => $req->preferred_date?->toIso8601String(),
            'preferred_time_slot' => $req->preferred_time_slot,
            'package_weight' => $req->package_weight,
            'stops' => $req->stops->map(fn ($s) => [
                'type' => $s->type,
                'address' => $s->address,
                'latitude' => $s->latitude,
                'longitude' => $s->longitude,
            ]),
            'offers_count' => $req->offers_count,
            'created_at' => $req->created_at->toIso8601String(),
        ]);

        return response()->json([
            'requests' => $results,
            'pagination' => [
                'total' => $requests->total(),
                'per_page' => $requests->perPage(),
                'current_page' => $requests->currentPage(),
                'last_page' => $requests->lastPage(),
            ],
        ]);
    }

    public function publish(Request $request, DeliveryRequest $deliveryRequest): JsonResponse
    {
        if ($unauthorized = $this->authorizeUser($request)) {
            return $unauthorized;
        }
        if ($deliveryRequest->user_id !== $request->user()->id) {
            return response()->json(['message' => 'Non autorisé'], 403);
        }

        if (! $deliveryRequest->isDraft()) {
            return response()->json(['message' => 'Seules les demandes en brouillon peuvent être publiées'], 422);
        }

        if ($deliveryRequest->stops()->count() < 2) {
            return response()->json(['message' => 'Il faut au moins un point de retrait et une destination'], 422);
        }

        $deliveryRequest->update(['status' => 'OPEN']);

        return response()->json([
            'message' => 'Demande publiée',
            'request' => new DeliveryRequestResource($deliveryRequest->fresh(['stops'])),
        ]);
    }
}
