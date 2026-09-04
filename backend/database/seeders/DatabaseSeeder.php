<?php

namespace Database\Seeders;

use App\Enums\DeliveryRequestStatus;
use App\Enums\DocumentType;
use App\Enums\DriverProfileStatus;
use App\Enums\UserRole;
use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // Admin
        $admin = User::firstOrCreate(
            ['email' => 'admin@inhaz.com'],
            ['name' => 'Admin User', 'phone' => '+212600000000', 'role' => UserRole::Admin, 'password' => bcrypt('password')]
        );
        $admin->update(['password' => bcrypt('password')]);

        // Driver
        $driver = User::firstOrCreate(
            ['email' => 'driver@inhaz.com'],
            ['name' => 'Driver User', 'phone' => '+212600000001', 'role' => UserRole::Driver]
        );

        if (! $driver->driverProfile) {
            $profile = $driver->driverProfile()->create([
                'status' => DriverProfileStatus::Approved,
                'approved_at' => now(),
            ]);

            $profile->vehicle()->create([
                'brand' => 'Renault',
                'model' => 'Kangoo',
                'registration_number' => '12345-A-1',
            ]);

            $profile->documents()->create([
                'type' => DocumentType::Cin,
                'file' => 'dummy/path',
                'status' => DriverProfileStatus::Approved,
                'verified_at' => now(),
                'verified_by' => $admin->id,
            ]);
        }

        // Client
        $client = User::firstOrCreate(
            ['email' => 'client@inhaz.com'],
            ['name' => 'Client User', 'phone' => '+212600000002', 'role' => UserRole::Client]
        );

        if ($client->deliveryRequests()->count() === 0) {
            $request = $client->deliveryRequests()->create([
                'title' => 'Livraison de meubles',
                'description' => 'Un canapé et deux chaises',
                'package_weight' => 50,
                'status' => DeliveryRequestStatus::Open,
            ]);

            $request->stops()->createMany([
                ['type' => 'PICKUP', 'address' => 'Casa', 'latitude' => 33.5, 'longitude' => -7.5, 'order' => 1],
                ['type' => 'DESTINATION', 'address' => 'Rabat', 'latitude' => 34.0, 'longitude' => -6.8, 'order' => 2],
            ]);
        }
    }
}
