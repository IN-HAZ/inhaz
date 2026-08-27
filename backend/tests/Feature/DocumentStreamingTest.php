<?php

namespace Tests\Feature;

use App\Enums\DriverProfileStatus;
use App\Models\DriverProfile;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class DocumentStreamingTest extends TestCase
{
    use RefreshDatabase;

    public function test_driver_can_view_own_document(): void
    {
        Storage::fake('local');

        $driver = User::factory()->driver()->create();
        $profile = DriverProfile::create([
            'user_id' => $driver->id,
            'status' => DriverProfileStatus::Pending,
        ]);

        $file = UploadedFile::fake()->create('licence.pdf', 200, 'application/pdf');
        $path = $file->store('documents/'.$profile->id, 'local');

        $document = $profile->documents()->create([
            'type' => 'DRIVING_LICENSE',
            'file' => $path,
            'status' => DriverProfileStatus::Pending,
        ]);

        $token = $driver->createToken('mobile-app')->plainTextToken;

        $response = $this->withToken($token)
            ->get("/api/v1/driver/documents/{$document->id}/view");

        $response->assertOk()
            ->assertHeader('Content-Type', 'application/pdf');
    }

    public function test_user_cannot_view_other_driver_document(): void
    {
        Storage::fake('local');

        $driver = User::factory()->driver()->create();
        $profile = DriverProfile::create([
            'user_id' => $driver->id,
            'status' => DriverProfileStatus::Pending,
        ]);

        $file = UploadedFile::fake()->create('licence.pdf', 200, 'application/pdf');
        $path = $file->store('documents/'.$profile->id, 'local');

        $document = $profile->documents()->create([
            'type' => 'DRIVING_LICENSE',
            'file' => $path,
            'status' => DriverProfileStatus::Pending,
        ]);

        $otherUser = User::factory()->create();
        $otherToken = $otherUser->createToken('mobile-app')->plainTextToken;

        $response = $this->withToken($otherToken)
            ->get("/api/v1/driver/documents/{$document->id}/view");

        $response->assertStatus(403);
    }

    public function test_viewing_document_with_missing_storage_file_returns_404(): void
    {
        Storage::fake('local');

        $driver = User::factory()->driver()->create();
        $profile = DriverProfile::create([
            'user_id' => $driver->id,
            'status' => DriverProfileStatus::Pending,
        ]);

        $document = $profile->documents()->create([
            'type' => 'DRIVING_LICENSE',
            'file' => 'documents/'.$profile->id.'/non_existent_file.pdf',
            'status' => DriverProfileStatus::Pending,
        ]);

        $token = $driver->createToken('mobile-app')->plainTextToken;

        $response = $this->withToken($token)
            ->get("/api/v1/driver/documents/{$document->id}/view");

        $response->assertStatus(404);
    }
}
