<?php

namespace Tests\Feature\Driver;

use App\Enums\DriverProfileStatus;
use App\Models\DriverProfile;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class DriverOnboardingTest extends TestCase
{
    use RefreshDatabase;

    public function test_user_can_apply_to_become_a_driver(): void
    {
        $user = User::factory()->create();
        $token = $user->createToken('mobile-app')->plainTextToken;

        $response = $this->withToken($token)
            ->postJson('/api/v1/driver/apply');

        $response->assertStatus(201)
            ->assertJsonPath('message', 'Candidature chauffeur créée.')
            ->assertJsonStructure(['driver_profile' => ['id', 'status']]);

        $this->assertDatabaseHas('driver_profiles', [
            'user_id' => $user->id,
            'status' => DriverProfileStatus::Pending->value,
        ]);
    }

    public function test_user_cannot_apply_as_driver_twice(): void
    {
        $user = User::factory()->create();
        DriverProfile::create([
            'user_id' => $user->id,
            'status' => DriverProfileStatus::Pending,
        ]);

        $token = $user->createToken('mobile-app')->plainTextToken;

        $response = $this->withToken($token)
            ->postJson('/api/v1/driver/apply');

        $response->assertStatus(422)
            ->assertJsonPath('message', 'Vous avez déjà un profil chauffeur.');
    }

    public function test_driver_can_get_profile(): void
    {
        $user = User::factory()->driver()->create();
        $profile = DriverProfile::create([
            'user_id' => $user->id,
            'status' => DriverProfileStatus::Pending,
        ]);

        $token = $user->createToken('mobile-app')->plainTextToken;

        $response = $this->withToken($token)
            ->getJson('/api/v1/driver/profile');

        $response->assertOk()
            ->assertJsonPath('driver_profile.id', $profile->id);
    }

    public function test_driver_can_upload_document(): void
    {
        Storage::fake('local');

        $user = User::factory()->driver()->create();
        $profile = DriverProfile::create([
            'user_id' => $user->id,
            'status' => DriverProfileStatus::Pending,
        ]);

        $token = $user->createToken('mobile-app')->plainTextToken;
        $file = UploadedFile::fake()->create('cin.pdf', 500, 'application/pdf');

        $response = $this->withToken($token)
            ->postJson('/api/v1/driver/documents', [
                'type' => 'CIN',
                'file' => $file,
                'expires_at' => now()->addYear()->format('Y-m-d'),
            ]);

        $response->assertStatus(201)
            ->assertJsonPath('message', 'Document téléchargé.')
            ->assertJsonPath('document.type', 'CIN');

        $this->assertDatabaseHas('driver_documents', [
            'driver_profile_id' => $profile->id,
            'type' => 'CIN',
            'status' => DriverProfileStatus::Pending->value,
        ]);
    }

    public function test_driver_can_list_documents(): void
    {
        Storage::fake('local');

        $user = User::factory()->driver()->create();
        $profile = DriverProfile::create([
            'user_id' => $user->id,
            'status' => DriverProfileStatus::Pending,
        ]);

        $profile->documents()->create([
            'type' => 'CIN',
            'file' => 'documents/'.$profile->id.'/cin.pdf',
            'status' => DriverProfileStatus::Pending,
        ]);

        $token = $user->createToken('mobile-app')->plainTextToken;

        $response = $this->withToken($token)
            ->getJson('/api/v1/driver/documents');

        $response->assertOk()
            ->assertJsonCount(1, 'documents')
            ->assertJsonPath('documents.0.type', 'CIN');
    }

    public function test_applicant_with_pending_profile_can_get_profile_vehicle_and_documents(): void
    {
        Storage::fake('local');

        $user = User::factory()->create(['role' => 'client']);
        $profile = DriverProfile::create([
            'user_id' => $user->id,
            'status' => DriverProfileStatus::Pending,
        ]);

        $token = $user->createToken('mobile-app')->plainTextToken;
        $file = UploadedFile::fake()->create('cin.pdf', 500, 'application/pdf');

        $this->withToken($token)->getJson('/api/v1/driver/profile')
            ->assertOk()
            ->assertJsonPath('driver_profile.id', $profile->id);

        $this->withToken($token)->postJson('/api/v1/driver/vehicle', [
            'brand' => 'Dacia',
            'model' => 'Dokker',
            'registration_number' => '12345-A-6',
        ])->assertOk()->assertJsonPath('vehicle.brand', 'Dacia');

        $this->withToken($token)->postJson('/api/v1/driver/documents', [
            'type' => 'CIN',
            'file' => $file,
            'expires_at' => now()->addYear()->format('Y-m-d'),
        ])->assertStatus(201)->assertJsonPath('document.type', 'CIN');
    }

    public function test_client_without_driver_profile_is_rejected(): void
    {
        $user = User::factory()->create(['role' => 'client']);
        $token = $user->createToken('mobile-app')->plainTextToken;

        $this->withToken($token)->getJson('/api/v1/driver/profile')
            ->assertStatus(403)
            ->assertJsonPath('message', 'Accès réservé aux chauffeurs.');
    }

    public function test_driver_can_register_vehicle(): void
    {
        $user = User::factory()->driver()->create();
        $profile = DriverProfile::create([
            'user_id' => $user->id,
            'status' => DriverProfileStatus::Pending,
        ]);

        $token = $user->createToken('mobile-app')->plainTextToken;

        $response = $this->withToken($token)
            ->postJson('/api/v1/driver/vehicle', [
                'brand' => 'Dacia',
                'model' => 'Dokker',
                'registration_number' => '12345-A-6',
            ]);

        $response->assertOk()
            ->assertJsonPath('message', 'Véhicule enregistré.')
            ->assertJsonPath('vehicle.brand', 'Dacia')
            ->assertJsonPath('vehicle.model', 'Dokker');

        $this->assertDatabaseHas('vehicles', [
            'driver_profile_id' => $profile->id,
            'brand' => 'Dacia',
            'model' => 'Dokker',
            'registration_number' => '12345-A-6',
        ]);
    }
}
