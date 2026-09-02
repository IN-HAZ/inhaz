<?php

namespace App\Http\Controllers\Api\V1;

use App\Enums\TripStatus;
use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\StoreDriverDocumentRequest;
use App\Http\Resources\DriverDocumentResource;
use App\Http\Resources\DriverProfileResource;
use App\Http\Resources\VehicleResource;
use App\Models\Trip;
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

    public function dashboardSummary(Request $request): JsonResponse
    {
        $user = $request->user();
        $driverProfile = $user->driverProfile;

        if (! $driverProfile) {
            return response()->json(['message' => 'Profil chauffeur introuvable.'], 404);
        }

        $todayStart = now()->startOfDay();

        $completedTripsTodayQuery = Trip::forDriver($user)
            ->where('status', TripStatus::Delivered)
            ->where('delivered_at', '>=', $todayStart);

        $completedTripsToday = $completedTripsTodayQuery->count();
        $todayEarnings = (float) $completedTripsTodayQuery->sum('agreed_price');

        $commissionRate = (float) config('inhaz.default_commission_rate', 0.10);
        $commissionOwedToday = $todayEarnings * $commissionRate;
        $walletBalance = (float) ($driverProfile->wallet_balance ?? 0.0);

        // Commission balance is total debt accrued (commission from completed trips - positive wallet credits)
        $commissionBalance = max(0.0, $commissionOwedToday - $walletBalance);

        $activeTrip = Trip::forDriver($user)->active()->first();

        return response()->json([
            'is_online' => (bool) $driverProfile->is_online,
            'today_earnings_mad' => round($todayEarnings, 2),
            'commission_balance_mad' => round($commissionBalance, 2),
            'completed_trips_today' => $completedTripsToday,
            'active_trip_id' => $activeTrip?->id,
            'driver_status' => $driverProfile->status->value,
        ]);
    }

    public function toggleOnline(Request $request): JsonResponse
    {
        $driverProfile = $request->user()->driverProfile;

        if (! $driverProfile) {
            return response()->json(['message' => 'Profil chauffeur introuvable.'], 404);
        }

        $goingOnline = ! $driverProfile->is_online;

        if ($goingOnline) {
            if (! $driverProfile->isApproved()) {
                return response()->json([
                    'message' => 'Votre compte doit être approuvé par un administrateur pour passer en ligne.',
                ], 422);
            }

            if (! $driverProfile->canGoOnline()) {
                return response()->json([
                    'message' => 'Impossibilité de passer en ligne : solde de commission débiteur supérieur à la limite autorisée.',
                ], 422);
            }
        }

        $driverProfile->update([
            'is_online' => $goingOnline,
            'last_online_at' => now(),
        ]);

        return response()->json([
            'message' => $goingOnline ? 'Vous êtes maintenant en ligne.' : 'Vous êtes maintenant hors ligne.',
            'is_online' => (bool) $driverProfile->is_online,
        ]);
    }

    public function updateLocation(Request $request): JsonResponse
    {
        $driverProfile = $request->user()->driverProfile;

        if (! $driverProfile) {
            return response()->json(['message' => 'Profil chauffeur introuvable.'], 404);
        }

        $validated = $request->validate([
            'latitude' => 'required|numeric|between:-90,90',
            'longitude' => 'required|numeric|between:-180,180',
        ]);

        $driverProfile->update([
            'current_latitude' => $validated['latitude'],
            'current_longitude' => $validated['longitude'],
            'last_online_at' => now(),
        ]);

        return response()->json([
            'message' => 'Position GPS mise à jour.',
            'is_online' => (bool) $driverProfile->is_online,
        ]);
    }
}
