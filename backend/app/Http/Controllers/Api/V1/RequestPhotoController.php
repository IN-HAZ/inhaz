<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\DeliveryRequest;
use App\Models\RequestPhoto;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class RequestPhotoController extends Controller
{
    private function authorizeUser(Request $request): ?JsonResponse
    {
        if (! $request->user()) {
            return response()->json(['message' => 'Non authentifié'], 401);
        }

        return null;
    }

    public function store(Request $request, DeliveryRequest $deliveryRequest): JsonResponse
    {
        if ($unauthorized = $this->authorizeUser($request)) {
            return $unauthorized;
        }

        if ($deliveryRequest->user_id !== $request->user()->id) {
            return response()->json(['message' => 'Non autorisé'], 403);
        }

        if (! $deliveryRequest->canBeModified()) {
            return response()->json(['message' => 'Cette demande ne peut plus être modifiée'], 422);
        }

        $request->validate([
            'file' => ['required', 'file', 'mimes:jpg,jpeg,png,pdf', 'max:10240'],
        ]);

        $file = $request->file('file');
        $path = $file->store('request-photos/' . $deliveryRequest->id, 'private');

        $photo = $deliveryRequest->photos()->create([
            'file_path' => $path,
            'file_name' => $file->getClientOriginalName(),
            'file_type' => $file->getMimeType(),
            'file_size' => $file->getSize(),
        ]);

        return response()->json([
            'message' => 'Photo uploadée',
            'photo' => [
                'id' => $photo->id,
                'file_name' => $photo->file_name,
                'file_type' => $photo->file_type,
                'file_size' => $photo->file_size,
                'url' => route('request-photos.view', $photo),
            ],
        ], 201);
    }

    public function index(Request $request, DeliveryRequest $deliveryRequest): JsonResponse
    {
        if ($unauthorized = $this->authorizeUser($request)) {
            return $unauthorized;
        }

        if ($deliveryRequest->user_id !== $request->user()->id) {
            return response()->json(['message' => 'Non autorisé'], 403);
        }

        $photos = $deliveryRequest->photos()->get()->map(fn ($photo) => [
            'id' => $photo->id,
            'file_name' => $photo->file_name,
            'file_type' => $photo->file_type,
            'file_size' => $photo->file_size,
            'url' => route('request-photos.view', $photo),
        ]);

        return response()->json(['photos' => $photos]);
    }

    public function show(Request $request, RequestPhoto $photo): JsonResponse
    {
        if ($unauthorized = $this->authorizeUser($request)) {
            return $unauthorized;
        }

        $deliveryRequest = $photo->deliveryRequest;

        if ($deliveryRequest->user_id !== $request->user()->id) {
            return response()->json(['message' => 'Non autorisé'], 403);
        }

        if (! Storage::disk('private')->exists($photo->file_path)) {
            return response()->json(['message' => 'Fichier introuvable'], 404);
        }

        return Storage::disk('private')->download($photo->file_path, $photo->file_name);
    }

    public function destroy(Request $request, RequestPhoto $photo): JsonResponse
    {
        if ($unauthorized = $this->authorizeUser($request)) {
            return $unauthorized;
        }

        $deliveryRequest = $photo->deliveryRequest;

        if ($deliveryRequest->user_id !== $request->user()->id) {
            return response()->json(['message' => 'Non autorisé'], 403);
        }

        if (! $deliveryRequest->canBeModified()) {
            return response()->json(['message' => 'Cette demande ne peut plus être modifiée'], 422);
        }

        $photo->deleteFile();
        $photo->delete();

        return response()->json(['message' => 'Photo supprimée']);
    }
}
