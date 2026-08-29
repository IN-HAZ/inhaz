<?php

namespace App\Services;

use App\Enums\DocumentType;
use App\Enums\DriverProfileStatus;
use App\Models\DriverDocument;
use App\Models\DriverProfile;

class DriverVerificationService
{
    public function approveDocument(DriverDocument $document, int $verifierId): DriverDocument
    {
        $document->update([
            'status' => DriverProfileStatus::Approved,
            'verified_at' => now(),
            'verified_by' => $verifierId,
        ]);

        $this->checkAllDocumentsApproved($document->driverProfile);

        return $document->fresh();
    }

    public function rejectDocument(DriverDocument $document, int $verifierId, string $reason): DriverDocument
    {
        $document->update([
            'status' => DriverProfileStatus::Rejected,
            'verified_at' => now(),
            'verified_by' => $verifierId,
            'rejection_reason' => $reason,
        ]);

        $driverProfile = $document->driverProfile;

        if ($driverProfile->status !== DriverProfileStatus::Rejected) {
            $driverProfile->update([
                'status' => DriverProfileStatus::Rejected,
                'rejected_at' => now(),
                'rejection_reason' => $reason,
            ]);
        }

        return $document->fresh();
    }

    public function approveDriver(DriverProfile $driverProfile, int $verifierId): DriverProfile
    {
        $driverProfile->update([
            'status' => DriverProfileStatus::Approved,
            'approved_at' => now(),
            'rejected_at' => null,
            'rejection_reason' => null,
        ]);

        return $driverProfile->fresh();
    }

    public function rejectDriver(DriverProfile $driverProfile, int $verifierId, string $reason): DriverProfile
    {
        $driverProfile->update([
            'status' => DriverProfileStatus::Rejected,
            'rejected_at' => now(),
            'rejection_reason' => $reason,
        ]);

        return $driverProfile->fresh();
    }

    protected function checkAllDocumentsApproved(DriverProfile $driverProfile): void
    {
        $requiredTypes = array_column(DocumentType::cases(), 'value');

        $approvedTypes = $driverProfile->documents()
            ->where('status', DriverProfileStatus::Approved)
            ->pluck('type')
            ->map(fn ($type) => $type instanceof DocumentType ? $type->value : $type)
            ->toArray();

        $allApproved = count(array_intersect($requiredTypes, $approvedTypes)) === count($requiredTypes);

        if ($allApproved && $driverProfile->status !== DriverProfileStatus::Approved) {
            $driverProfile->update([
                'status' => DriverProfileStatus::Approved,
                'approved_at' => now(),
                'rejected_at' => null,
                'rejection_reason' => null,
            ]);
        }
    }
}
