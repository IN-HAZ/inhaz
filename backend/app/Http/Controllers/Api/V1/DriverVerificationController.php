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

    public function listPending(): JsonResponse
    {
        $pendingProfiles = DriverProfile::with(['user', 'documents', 'vehicle'])
            ->where('status', 'PENDING')
            ->get();

        return response()->json([
            'drivers' => $pendingProfiles,
        ]);
    }

    public function listPendingDocuments(): JsonResponse
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
        $document = $this->service->approveDocument($document, $request->user()->id);

        return response()->json([
            'message' => 'Document approuvé.',
            'document' => $document,
        ]);
    }

    public function rejectDocument(Request $request, DriverDocument $document): JsonResponse
    {
        $validated = $request->validate([
            'reason' => 'required|string|max:500',
        ]);

        $document = $this->service->rejectDocument($document, $request->user()->id, $validated['reason']);

        return response()->json([
            'message' => 'Document rejeté.',
            'document' => $document,
        ]);
    }

    public function approveDriver(Request $request, DriverProfile $driverProfile): JsonResponse
    {
        $driverProfile = $this->service->approveDriver($driverProfile, $request->user()->id);

        return response()->json([
            'message' => 'Chauffeur approuvé.',
            'driver_profile' => $driverProfile,
        ]);
    }

    public function rejectDriver(Request $request, DriverProfile $driverProfile): JsonResponse
    {
        $validated = $request->validate([
            'reason' => 'required|string|max:500',
        ]);

        $driverProfile = $this->service->rejectDriver($driverProfile, $request->user()->id, $validated['reason']);

        return response()->json([
            'message' => 'Chauffeur rejeté.',
            'driver_profile' => $driverProfile,
        ]);
    }
}
