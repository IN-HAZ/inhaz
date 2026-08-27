<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\StoreDriverDocumentRequest;
use App\Http\Resources\DriverDocumentResource;
use App\Http\Resources\DriverProfileResource;
use App\Http\Resources\VehicleResource;
use App\Services\DriverService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DriverController extends Controller
{
    public function __construct(private DriverService $driverService) {}

    public function apply(Request $request): JsonResponse
    {
        try {
            $profile = $this->driverService->apply($request->user());

            return response()->json([
                'message' => 'Candidature chauffeur créée.',
                'driver_profile' => new DriverProfileResource($profile),
            ], 201);
        } catch (\DomainException $e) {
            return response()->json([
                'message' => $e->getMessage(),
                'driver_profile' => new DriverProfileResource($request->user()->driverProfile),
            ], 422);
        }
    }

    public function profile(Request $request): JsonResponse
    {
        $profile = $request->user()->driverProfile;

        if (! $profile) {
            return response()->json(['message' => 'Profil chauffeur introuvable.'], 404);
        }

        return response()->json([
            'driver_profile' => new DriverProfileResource($profile->load(['vehicle', 'documents'])),
        ]);
    }

    public function storeDocument(StoreDriverDocumentRequest $request): JsonResponse
    {
        $driverProfile = $request->user()->driverProfile;

        if (! $driverProfile) {
            return response()->json(['message' => 'Profil chauffeur introuvable.'], 404);
        }

        $document = $this->driverService->storeDocument(
            $driverProfile,
            $request->validated('type'),
            $request->file('file'),
            $request->validated('expires_at') ?? null
        );

        return response()->json([
            'message' => 'Document téléchargé.',
            'document' => new DriverDocumentResource($document),
        ], 201);
    }

    public function listDocuments(Request $request): JsonResponse
    {
        $driverProfile = $request->user()->driverProfile;

        if (! $driverProfile) {
            return response()->json(['message' => 'Profil chauffeur introuvable.'], 404);
        }

        return response()->json([
            'documents' => DriverDocumentResource::collection($driverProfile->documents),
        ]);
    }

    public function storeVehicle(Request $request): JsonResponse
    {
        $driverProfile = $request->user()->driverProfile;

        if (! $driverProfile) {
            return response()->json(['message' => 'Profil chauffeur introuvable.'], 404);
        }

        $validated = $request->validate([
            'brand' => 'required|string|max:255',
            'model' => 'required|string|max:255',
            'registration_number' => 'required|string|max:255',
        ]);

        $vehicle = $this->driverService->storeVehicle($driverProfile, $validated);

        return response()->json([
            'message' => 'Véhicule enregistré.',
            'vehicle' => new VehicleResource($vehicle),
        ]);
    }
}
