<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class DriverController extends Controller
{
    public function apply(Request $request): JsonResponse
    {
        $user = $request->user();

        if ($user->driverProfile) {
            return response()->json([
                'message' => 'Vous avez déjà un profil chauffeur.',
                'driver_profile' => $user->driverProfile,
            ], 422);
        }

        DB::transaction(function () use ($user) {
            $user->driverProfile()->create([
                'status' => 'PENDING',
            ]);
        });

        return response()->json([
            'message' => 'Candidature chauffeur créée.',
            'driver_profile' => $user->fresh()->driverProfile,
        ], 201);
    }

    public function profile(Request $request): JsonResponse
    {
        if (! $request->user()->driverProfile) {
            return response()->json(['message' => 'Profil chauffeur introuvable.'], 404);
        }

        return response()->json([
            'driver_profile' => $request->user()
                ->driverProfile()
                ->with(['vehicle', 'documents'])
                ->first(),
        ]);
    }

    public function storeDocument(Request $request): JsonResponse
    {
        $driverProfile = $this->requireDriverProfile($request);

        if ($driverProfile instanceof JsonResponse) {
            return $driverProfile;
        }

        $validated = $request->validate([
            'type' => 'required|in:CIN,REGISTRATION,INSURANCE,DRIVING_LICENSE',
            'file' => 'required|file|max:10240',
            'expires_at' => 'nullable|date|after:today',
        ]);

        $path = $request->file('file')->store('documents/'.$driverProfile->id, 'local');

        $document = $driverProfile->documents()->create([
            'type' => $validated['type'],
            'file' => $path,
            'expires_at' => $validated['expires_at'] ?? null,
            'status' => 'PENDING',
        ]);

        return response()->json([
            'message' => 'Document téléchargé.',
            'document' => $document,
        ], 201);
    }

    public function listDocuments(Request $request): JsonResponse
    {
        $driverProfile = $this->requireDriverProfile($request);

        if ($driverProfile instanceof JsonResponse) {
            return $driverProfile;
        }

        return response()->json([
            'documents' => $driverProfile->documents,
        ]);
    }

    public function storeVehicle(Request $request): JsonResponse
    {
        $driverProfile = $this->requireDriverProfile($request);

        if ($driverProfile instanceof JsonResponse) {
            return $driverProfile;
        }

        $validated = $request->validate([
            'brand' => 'required|string|max:255',
            'model' => 'required|string|max:255',
            'registration_number' => 'required|string|max:255',
        ]);

        $vehicle = $driverProfile->vehicle()->updateOrCreate([], $validated);

        return response()->json([
            'message' => 'Véhicule enregistré.',
            'vehicle' => $vehicle,
        ]);
    }

    private function requireDriverProfile(Request $request): JsonResponse|\App\Models\DriverProfile
    {
        $profile = $request->user()->driverProfile;

        if (! $profile) {
            return response()->json(['message' => 'Profil chauffeur introuvable.'], 404);
        }

        return $profile;
    }
}
