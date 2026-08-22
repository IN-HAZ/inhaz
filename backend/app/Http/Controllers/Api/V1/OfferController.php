<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\DeliveryRequest;
use App\Models\Offer;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class OfferController extends Controller
{
    private function authorizeUser(Request $request): ?JsonResponse
    {
        if (! $request->user()) {
            return response()->json(['message' => 'Non authentifi\u00e9'], 401);
        }

        return null;
    }

    public function store(Request $request, DeliveryRequest $deliveryRequest): JsonResponse
    {
        if ($unauthorized = $this->authorizeUser($request)) {
            return $unauthorized;
        }

        if (! $deliveryRequest->isOpen()) {
            return response()->json(['message' => 'Cette demande n\'est pas ouverte aux offres'], 422);
        }

        if ($deliveryRequest->user_id === $request->user()->id) {
            return response()->json(['message' => 'Vous ne pouvez pas faire une offre sur votre propre demande'], 422);
        }

        $existing = Offer::where('delivery_request_id', $deliveryRequest->id)
            ->where('user_id', $request->user()->id)
            ->where('status', 'PENDING')
            ->exists();

        if ($existing) {
            return response()->json(['message' => 'Vous avez d\u00e9j\u00e0 une offre en cours pour cette demande'], 422);
        }

        $validated = $request->validate([
            'price' => ['required', 'numeric', 'min:1'],
            'message' => ['nullable', 'string', 'max:500'],
        ]);

        $offer = Offer::create([
            'delivery_request_id' => $deliveryRequest->id,
            'user_id' => $request->user()->id,
            'status' => 'PENDING',
            'price' => $validated['price'],
            'message' => $validated['message'] ?? null,
        ]);

        return response()->json([
            'message' => 'Offre soumise avec succ\u00e8s',
            'offer' => [
                'id' => $offer->id,
                'status' => $offer->status,
                'price' => $offer->price,
                'message' => $offer->message,
                'created_at' => $offer->created_at->toIso8601String(),
            ],
        ], 201);
    }

    public function index(Request $request, DeliveryRequest $deliveryRequest): JsonResponse
    {
        if ($unauthorized = $this->authorizeUser($request)) {
            return $unauthorized;
        }

        if ($deliveryRequest->user_id !== $request->user()->id) {
            return response()->json(['message' => 'Non autoris\u00e9'], 403);
        }

        $offers = $deliveryRequest->offers()
            ->with('driver:id,name,phone')
            ->latest()
            ->get()
            ->map(fn ($offer) => [
                'id' => $offer->id,
                'status' => $offer->status,
                'price' => $offer->price,
                'message' => $offer->message,
                'rejection_reason' => $offer->rejection_reason,
                'driver' => $offer->driver ? [
                    'id' => $offer->driver->id,
                    'name' => $offer->driver->name,
                    'phone' => $offer->driver->phone,
                ] : null,
                'created_at' => $offer->created_at->toIso8601String(),
            ]);

        return response()->json(['offers' => $offers]);
    }

    public function accept(Request $request, Offer $offer): JsonResponse
    {
        if ($unauthorized = $this->authorizeUser($request)) {
            return $unauthorized;
        }

        $deliveryRequest = $offer->deliveryRequest;

        if ($deliveryRequest->user_id !== $request->user()->id) {
            return response()->json(['message' => 'Non autoris\u00e9'], 403);
        }

        if (! $offer->canBeAccepted()) {
            return response()->json(['message' => 'Cette offre ne peut pas \u00eatre accept\u00e9e'], 422);
        }

        $offer->accept();

        $deliveryRequest->update(['status' => 'MATCHED']);

        $deliveryRequest->offers()
            ->where('id', '!=', $offer->id)
            ->where('status', 'PENDING')
            ->update(['status' => 'REJECTED', 'rejection_reason' => 'Offre concurrente accept\u00e9e']);

        return response()->json([
            'message' => 'Offre accept\u00e9e',
            'offer' => [
                'id' => $offer->fresh()->id,
                'status' => $offer->fresh()->status,
                'price' => $offer->fresh()->price,
            ],
        ]);
    }

    public function reject(Request $request, Offer $offer): JsonResponse
    {
        if ($unauthorized = $this->authorizeUser($request)) {
            return $unauthorized;
        }

        $deliveryRequest = $offer->deliveryRequest;

        if ($deliveryRequest->user_id !== $request->user()->id) {
            return response()->json(['message' => 'Non autoris\u00e9'], 403);
        }

        if (! $offer->canBeRejected()) {
            return response()->json(['message' => 'Cette offre ne peut pas \u00eatre rejet\u00e9e'], 422);
        }

        $request->validate([
            'rejection_reason' => ['nullable', 'string', 'max:500'],
        ]);

        $offer->reject($request->input('rejection_reason'));

        return response()->json([
            'message' => 'Offre rejet\u00e9e',
            'offer' => [
                'id' => $offer->fresh()->id,
                'status' => $offer->fresh()->status,
                'rejection_reason' => $offer->fresh()->rejection_reason,
            ],
        ]);
    }

    public function withdraw(Request $request, Offer $offer): JsonResponse
    {
        if ($unauthorized = $this->authorizeUser($request)) {
            return $unauthorized;
        }

        if ($offer->user_id !== $request->user()->id) {
            return response()->json(['message' => 'Non autoris\u00e9'], 403);
        }

        if (! $offer->canBeWithdrawn()) {
            return response()->json(['message' => 'Cette offre ne peut pas \u00eatre retir\u00e9e'], 422);
        }

        $offer->withdraw();

        return response()->json([
            'message' => 'Offre retir\u00e9e',
            'offer' => [
                'id' => $offer->fresh()->id,
                'status' => $offer->fresh()->status,
            ],
        ]);
    }
}
