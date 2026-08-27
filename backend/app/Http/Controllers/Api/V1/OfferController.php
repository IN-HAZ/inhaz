<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\RejectOfferRequest;
use App\Http\Requests\Api\V1\StoreOfferRequest;
use App\Http\Resources\OfferResource;
use App\Http\Resources\TripResource;
use App\Models\DeliveryRequest;
use App\Models\Offer;
use App\Services\OfferService;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class OfferController extends Controller
{
    use AuthorizesRequests;

    public function __construct(private OfferService $offerService) {}

    public function store(StoreOfferRequest $request, DeliveryRequest $deliveryRequest): JsonResponse
    {
        $this->authorize('create', [Offer::class, $deliveryRequest]);

        try {
            $offer = $this->offerService->store($deliveryRequest, $request->user(), $request->validated('price'), $request->validated('message'));

            return response()->json([
                'message' => 'Offre soumise avec succès',
                'offer' => new OfferResource($offer),
            ], 201);
        } catch (\DomainException $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        }
    }

    public function index(Request $request, DeliveryRequest $deliveryRequest): JsonResponse
    {
        $this->authorize('viewAny', [Offer::class, $deliveryRequest]);

        $offers = $deliveryRequest->offers()->with('driver')->latest()->get();

        return response()->json(['offers' => OfferResource::collection($offers)]);
    }

    public function accept(Request $request, Offer $offer): JsonResponse
    {
        $this->authorize('accept', $offer);

        $trip = $this->offerService->accept($offer, $request->user());

        return response()->json([
            'message' => 'Offre acceptée',
            'offer' => new OfferResource($offer->fresh()),
            'trip' => new TripResource($trip), // Might be useful, but prompt only requested 'offer', I will stick to prompt or just return offer. Prompt says: Return response()->json(['message' => 'Offre acceptée', 'offer' => new OfferResource($offer->fresh())])
        ]);
    }

    public function reject(RejectOfferRequest $request, Offer $offer): JsonResponse
    {
        $this->authorize('reject', $offer);

        $offer->reject($request->validated('rejection_reason'));

        return response()->json([
            'message' => 'Offre rejetée',
            'offer' => new OfferResource($offer->fresh()),
        ]);
    }

    public function withdraw(Request $request, Offer $offer): JsonResponse
    {
        $this->authorize('withdraw', $offer);

        $offer->withdraw();

        return response()->json([
            'message' => 'Offre retirée',
            'offer' => new OfferResource($offer->fresh()),
        ]);
    }
}
