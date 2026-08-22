<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\DriverDocument;
use App\Models\DriverProfile;
use App\Services\DriverVerificationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DriverVerificationController extends Controller
{
    public function __construct(
        protected DriverVerificationService $service,
    ) {}

    public function listPending(Request $request): JsonResponse
    {
        $pendingProfiles = DriverProfile::with(['user', 'documents', 'vehicle'])
            ->where('status', 'PENDING')
            ->get();

        return response()->json([
            'drivers' => $pendingProfiles,
        ]);
    }

    public function listPendingDocuments(Request $request): JsonResponse
    {
        $pendingDocuments = DriverDocument::with(['driverProfile.user'])
            ->where('status', 'PENDING')
            ->get();

        return response()->json([
            'documents' => $pendingDocuments,
        ]);
    }

    public function approveDocument(Request $request, DriverDocument $document): JsonResponse
    {
        $userId = $request->session()->get('user_id');

        if (! $userId) {
            return response()->json(['message' => 'Non authentifié.'], 401);
        }

        $document = $this->service->approveDocument($document, $userId);

        return response()->json([
            'message' => 'Document approuvé.',
            'document' => $document,
        ]);
    }

    public function rejectDocument(Request $request, DriverDocument $document): JsonResponse
    {
        $userId = $request->session()->get('user_id');

        if (! $userId) {
            return response()->json(['message' => 'Non authentifié.'], 401);
        }

        $validated = $request->validate([
            'reason' => 'required|string|max:500',
        ]);

        $document = $this->service->rejectDocument($document, $userId, $validated['reason']);

        return response()->json([
            'message' => 'Document rejeté.',
            'document' => $document,
        ]);
    }

    public function approveDriver(Request $request, DriverProfile $driverProfile): JsonResponse
    {
        $userId = $request->session()->get('user_id');

        if (! $userId) {
            return response()->json(['message' => 'Non authentifié.'], 401);
        }

        $driverProfile = $this->service->approveDriver($driverProfile, $userId);

        return response()->json([
            'message' => 'Chauffeur approuvé.',
            'driver_profile' => $driverProfile,
        ]);
    }

    public function rejectDriver(Request $request, DriverProfile $driverProfile): JsonResponse
    {
        $userId = $request->session()->get('user_id');

        if (! $userId) {
            return response()->json(['message' => 'Non authentifié.'], 401);
        }

        $validated = $request->validate([
            'reason' => 'required|string|max:500',
        ]);

        $driverProfile = $this->service->rejectDriver($driverProfile, $userId, $validated['reason']);

        return response()->json([
            'message' => 'Chauffeur rejeté.',
            'driver_profile' => $driverProfile,
        ]);
    }
}
