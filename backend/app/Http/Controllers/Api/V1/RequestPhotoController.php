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
use Illuminate\Support\Str;

class RequestPhotoController extends Controller
{
    use AuthorizesRequests;

    public function __construct(private RequestPhotoService $requestPhotoService) {}

    public function presignedUrls(Request $request, DeliveryRequest $deliveryRequest): JsonResponse
    {
        $this->authorize('update', $deliveryRequest);

        if (! $deliveryRequest->isDraft()) {
            return response()->json(['message' => 'Seules les demandes en brouillon peuvent recevoir des photos'], 422);
        }

        $request->validate([
            'files' => ['required', 'array', 'min:1'],
            'files.*.filename' => ['required', 'string'],
            'files.*.content_type' => ['nullable', 'string'],
            'files.*.file_size' => ['nullable', 'integer'],
        ]);

        $results = [];

        foreach ($request->input('files') as $file) {
            $extension = pathinfo($file['filename'], PATHINFO_EXTENSION) ?: 'jpg';
            $photoKey = sprintf('requests/%d/photos/%s.%s', $deliveryRequest->id, Str::uuid(), $extension);
            $contentType = $file['content_type'] ?? 'image/jpeg';

            try {
                if (class_exists(\Aws\S3\S3Client::class)) {
                    $s3Client = new \Aws\S3\S3Client([
                        'version' => 'latest',
                        'region' => config('filesystems.disks.s3.region', env('AWS_DEFAULT_REGION', 'us-east-1')),
                        'credentials' => [
                            'key' => config('filesystems.disks.s3.key', env('AWS_ACCESS_KEY_ID', '')),
                            'secret' => config('filesystems.disks.s3.secret', env('AWS_SECRET_ACCESS_KEY', '')),
                        ],
                    ]);
                    $cmd = $s3Client->getCommand('PutObject', [
                        'Bucket' => config('filesystems.disks.s3.bucket', env('AWS_BUCKET', 'inhaz-bucket')),
                        'Key' => $photoKey,
                        'ContentType' => $contentType,
                    ]);
                    $presignedReq = $s3Client->createPresignedRequest($cmd, '+15 minutes');
                    $uploadUrl = (string) $presignedReq->getUri();
                } else {
                    $uploadUrl = Storage::disk('s3')->temporaryUploadUrl($photoKey, now()->addMinutes(15));
                }
            } catch (\Throwable $e) {
                $uploadUrl = url("/api/v1/mock-s3-upload/{$photoKey}");
            }

            $results[] = [
                'photo_key' => $photoKey,
                'upload_url' => $uploadUrl,
            ];
        }

        return response()->json($results);
    }

    public function confirm(Request $request, DeliveryRequest $deliveryRequest): JsonResponse
    {
        $this->authorize('update', $deliveryRequest);

        if (! $deliveryRequest->isDraft()) {
            return response()->json(['message' => 'Seules les demandes en brouillon peuvent être confirmées'], 422);
        }

        $request->validate([
            'photo_key' => ['required', 'string'],
        ]);

        $photoKey = $request->input('photo_key');
        $expectedPrefix = "requests/{$deliveryRequest->id}/photos/";

        if (! str_starts_with($photoKey, $expectedPrefix)) {
            return response()->json(['message' => 'Le photo_key ne correspond pas à cette demande'], 422);
        }

        $photo = $deliveryRequest->photos()->create([
            'file_path' => $photoKey,
            'file_name' => basename($photoKey),
            'file_type' => 'image/jpeg',
            'file_size' => 0,
        ]);

        return response()->json([
            'message' => 'Photo confirmée avec succès',
            'photo' => new RequestPhotoResource($photo),
        ], 201);
    }

    public function store(Request $request, DeliveryRequest $deliveryRequest): JsonResponse
    {
        $this->authorize('update', $deliveryRequest);

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

    public function show(Request $request, RequestPhoto $photo)
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
