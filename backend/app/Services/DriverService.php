<?php

namespace App\Services;

use App\Enums\DriverProfileStatus;
use App\Models\DriverDocument;
use App\Models\DriverProfile;
use App\Models\User;
use App\Models\Vehicle;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;

class DriverService
{
    public function apply(User $user): DriverProfile
    {
        if ($user->driverProfile) {
            throw new \DomainException('Vous avez déjà un profil chauffeur.');
        }

        return DB::transaction(function () use ($user) {
            return $user->driverProfile()->create([
                'status' => DriverProfileStatus::Pending,
            ]);
        });
    }

    public function storeDocument(DriverProfile $profile, string $type, UploadedFile $file, ?string $expiresAt): DriverDocument
    {
        $path = $file->store('documents/'.$profile->id, 'local');

        return $profile->documents()->create([
            'type' => $type,
            'file' => $path,
            'expires_at' => $expiresAt,
            'status' => DriverProfileStatus::Pending,
        ]);
    }

    public function storeVehicle(DriverProfile $profile, array $data): Vehicle
    {
        return $profile->vehicle()->updateOrCreate([], $data);
    }
}
