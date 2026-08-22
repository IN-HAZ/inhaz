<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\DriverProfile;
use App\Models\User;
use App\Models\Vehicle;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class DriverController extends Controller
{
    public function apply(Request $request): JsonResponse
    {
        $userId = $request->session()->get('user_id');

        if (! $userId) {
            return response()->json(['message' => 'Non authentifié.'], 401);
        }

        $user = User::find($userId);

        if (! $user) {
            return response()->json(['message' => 'Utilisateur introuvable.'], 404);
        }

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

            $user->update(['role' => 'DRIVER']);
        });

        $user->load('driverProfile');

        return response()->json([
            'message' => 'Candidature chauffeur créée.',
            'driver_profile' => $user->driverProfile,
        ], 201);
    }

    public function profile(Request $request): JsonResponse
    {
        $userId = $request->session()->get('user_id');

        if (! $userId) {
            return response()->json(['message' => 'Non authentifié.'], 401);
        }

        $user = User::with(['driverProfile.vehicle', 'driverProfile.documents'])->find($userId);

        if (! $user || ! $user->driverProfile) {
            return response()->json(['message' => 'Profil chauffeur introuvable.'], 404);
        }

        return response()->json([
            'driver_profile' => $user->driverProfile,
        ]);
    }

    public function storeDocument(Request $request): JsonResponse
    {
        $userId = $request->session()->get('user_id');

        if (! $userId) {
            return response()->json(['message' => 'Non authentifié.'], 401);
        }

        $user = User::find($userId);

        if (! $user || ! $user->driverProfile) {
            return response()->json(['message' => 'Profil chauffeur introuvable.'], 404);
        }

        $validated = $request->validate([
            'type' => 'required|in:CIN,REGISTRATION,INSURANCE,DRIVING_LICENSE',
            'file' => 'required|file|max:10240',
            'expires_at' => 'nullable|date|after:today',
        ]);

        $file = $request->file('file');
        $path = $file->store('documents/'.$user->driverProfile->id, 'local');

        $document = $user->driverProfile->documents()->create([
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
        $userId = $request->session()->get('user_id');

        if (! $userId) {
            return response()->json(['message' => 'Non authentifié.'], 401);
        }

        $user = User::find($userId);

        if (! $user || ! $user->driverProfile) {
            return response()->json(['message' => 'Profil chauffeur introuvable.'], 404);
        }

        return response()->json([
            'documents' => $user->driverProfile->documents,
        ]);
    }

    public function storeVehicle(Request $request): JsonResponse
    {
        $userId = $request->session()->get('user_id');

        if (! $userId) {
            return response()->json(['message' => 'Non authentifié.'], 401);
        }

        $user = User::find($userId);

        if (! $user || ! $user->driverProfile) {
            return response()->json(['message' => 'Profil chauffeur introuvable.'], 404);
        }

        $validated = $request->validate([
            'brand' => 'required|string|max:255',
            'model' => 'required|string|max:255',
            'registration_number' => 'required|string|max:255',
        ]);

        $vehicle = $user->driverProfile->vehicle()->updateOrCreate([], $validated);

        return response()->json([
            'message' => 'Véhicule enregistré.',
            'vehicle' => $vehicle,
        ]);
    }
}
