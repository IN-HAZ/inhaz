<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\StoreDeliveryRequestRequest;
use App\Http\Requests\Api\V1\UpdateDeliveryRequestRequest;
use App\Http\Resources\DeliveryRequestResource;
use App\Models\DeliveryRequest;
use App\Services\DeliveryRequestService;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DeliveryRequestController extends Controller
{
    use AuthorizesRequests;

    public function __construct(private DeliveryRequestService $deliveryRequestService) {}

    public function index(Request $request): JsonResponse
    {
        $requests = $request->user()
            ->deliveryRequests()
            ->with('stops')
            ->latest()
            ->paginate(20);

        return response()->json([
            'requests' => DeliveryRequestResource::collection($requests->getCollection()),
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
        $deliveryRequest = $this->deliveryRequestService->create($request->user(), $request->validated(), $request->stops ?? []);

        return response()->json([
            'message' => 'Demande créée avec succès',
            'request' => new DeliveryRequestResource($deliveryRequest),
        ], 201);
    }

    public function show(Request $request, DeliveryRequest $deliveryRequest): JsonResponse
    {
        $this->authorize('view', $deliveryRequest);

        $deliveryRequest->load('stops');

        return response()->json([
            'request' => new DeliveryRequestResource($deliveryRequest),
        ]);
    }

    public function update(UpdateDeliveryRequestRequest $request, DeliveryRequest $deliveryRequest): JsonResponse
    {
        $this->authorize('update', $deliveryRequest);

        try {
            $deliveryRequest = $this->deliveryRequestService->update($deliveryRequest, $request->validated());

            return response()->json([
                'message' => 'Demande mise à jour',
                'request' => new DeliveryRequestResource($deliveryRequest),
            ]);
        } catch (\DomainException $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        }
    }

    public function destroy(Request $request, DeliveryRequest $deliveryRequest): JsonResponse
    {
        $this->authorize('delete', $deliveryRequest);

        try {
            $this->deliveryRequestService->cancel($deliveryRequest);

            return response()->json(['message' => 'Demande annulée']);
        } catch (\DomainException $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        }
    }

    public function cancel(Request $request, DeliveryRequest $deliveryRequest): JsonResponse
    {
        $this->authorize('delete', $deliveryRequest);
        $request->validate(['cancellation_reason' => ['required', 'string', 'max:500']]);

        try {
            $deliveryRequest = $this->deliveryRequestService->cancel($deliveryRequest, $request->input('cancellation_reason'));

            return response()->json([
                'message' => 'Demande annulée',
                'request' => new DeliveryRequestResource($deliveryRequest),
            ]);
        } catch (\DomainException $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        }
    }

    public function browse(Request $request): JsonResponse
    {
        $query = DeliveryRequest::open()
            ->with('stops')
            ->withCount('offers')
            ->latest();

        if ($request->filled('search')) {
            $search = mb_strtolower($request->input('search'));
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

        return response()->json([
            'requests' => DeliveryRequestResource::collection($requests->getCollection()),
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
        $this->authorize('update', $deliveryRequest);

        try {
            $deliveryRequest = $this->deliveryRequestService->publish($deliveryRequest);

            return response()->json([
                'message' => 'Demande publiée',
                'request' => new DeliveryRequestResource($deliveryRequest),
            ]);
        } catch (\DomainException $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        }
    }
}
