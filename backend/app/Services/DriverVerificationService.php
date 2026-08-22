<?php

namespace App\Services;

use App\Models\DriverDocument;
use App\Models\DriverProfile;
use App\Models\User;
use Illuminate\Support\Facades\DB;

class DriverVerificationService
{
    public function approveDocument(DriverDocument $document, int $verifierId): DriverDocument
    {
        $document->update([
            'status' => 'APPROVED',
            'verified_at' => now(),
            'verified_by' => $verifierId,
        ]);

        $this->checkAllDocumentsApproved($document->driverProfile);

        return $document->fresh();
    }

    public function rejectDocument(DriverDocument $document, int $verifierId, string $reason): DriverDocument
    {
        $document->update([
            'status' => 'REJECTED',
            'verified_at' => now(),
            'verified_by' => $verifierId,
            'rejection_reason' => $reason,
        ]);

        $driverProfile = $document->driverProfile;

        if ($driverProfile->status !== 'REJECTED') {
            $driverProfile->update([
                'status' => 'REJECTED',
                'rejected_at' => now(),
                'rejection_reason' => $reason,
            ]);
        }

        return $document->fresh();
    }

    public function approveDriver(DriverProfile $driverProfile, int $verifierId): DriverProfile
    {
        $driverProfile->update([
            'status' => 'APPROVED',
            'approved_at' => now(),
            'rejected_at' => null,
            'rejection_reason' => null,
        ]);

        return $driverProfile->fresh();
    }

    public function rejectDriver(DriverProfile $driverProfile, int $verifierId, string $reason): DriverProfile
    {
        $driverProfile->update([
            'status' => 'REJECTED',
            'rejected_at' => now(),
            'rejection_reason' => $reason,
        ]);

        return $driverProfile->fresh();
    }

    protected function checkAllDocumentsApproved(DriverProfile $driverProfile): void
    {
        $requiredTypes = ['CIN', 'REGISTRATION', 'INSURANCE', 'DRIVING_LICENSE'];

        $approvedTypes = $driverProfile->documents()
            ->where('status', 'APPROVED')
            ->pluck('type')
            ->toArray();

        $allApproved = count(array_intersect($requiredTypes, $approvedTypes)) === count($requiredTypes);

        if ($allApproved && $driverProfile->status !== 'APPROVED') {
            $driverProfile->update([
                'status' => 'APPROVED',
                'approved_at' => now(),
                'rejected_at' => null,
                'rejection_reason' => null,
            ]);
        }
    }
}
