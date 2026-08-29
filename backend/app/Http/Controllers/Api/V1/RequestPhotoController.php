<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Resources\RequestPhotoResource;
use App\Models\DeliveryRequest;
use App\Models\RequestPhoto;
use App\Services\RequestPhotoService;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class RequestPhotoController extends Controller
{
    use AuthorizesRequests;

    public function __construct(private RequestPhotoService $requestPhotoService) {}

    public function store(Request $request, DeliveryRequest $deliveryRequest): JsonResponse
    {
        $this->authorize('update', $deliveryRequest); // Assuming Policy allows photo upload under update

        $request->validate([
            'file' => ['required', 'file', 'mimes:jpg,jpeg,png,pdf', 'max:10240'],
        ]);

        try {
            $photo = $this->requestPhotoService->store($deliveryRequest, $request->file('file'));

            return response()->json([
                'message' => 'Photo uploadée',
                'photo' => new RequestPhotoResource($photo),
            ], 201);
        } catch (\DomainException $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        }
    }

    public function index(Request $request, DeliveryRequest $deliveryRequest): JsonResponse
    {
        $this->authorize('view', $deliveryRequest);

        $photos = $deliveryRequest->photos()->get();

        return response()->json(['photos' => RequestPhotoResource::collection($photos)]);
    }

    public function show(Request $request, RequestPhoto $photo) // return type removed as it can be StreamedResponse or JsonResponse
    {
        $this->authorize('view', $photo);

        if (! Storage::disk('private')->exists($photo->file_path)) {
            return response()->json(['message' => 'Fichier introuvable'], 404);
        }

        return Storage::disk('private')->download($photo->file_path, $photo->file_name);
    }

    public function destroy(Request $request, RequestPhoto $photo): JsonResponse
    {
        $this->authorize('delete', $photo);

        try {
            $this->requestPhotoService->delete($photo);

            return response()->json(['message' => 'Photo supprimée']);
        } catch (\DomainException $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        }
    }
}
