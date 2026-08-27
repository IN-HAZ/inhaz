<?php

namespace Tests\Feature\Driver;

use App\Enums\DriverProfileStatus;
use App\Models\DriverProfile;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class DriverVerificationAdminTest extends TestCase
{
    use RefreshDatabase;

    private User $admin;

    private string $adminToken;

    protected function setUp(): void
    {
        parent::setUp();

        $this->admin = User::factory()->admin()->create();
        $this->adminToken = $this->admin->createToken('admin-panel')->plainTextToken;
    }

    public function test_admin_can_list_pending_drivers(): void
    {
        $driverUser = User::factory()->driver()->create();
        $profile = DriverProfile::create([
            'user_id' => $driverUser->id,
            'status' => DriverProfileStatus::Pending,
        ]);

        $response = $this->withToken($this->adminToken)
            ->getJson('/api/v1/admin/driver/pending');

        $response->assertOk()
            ->assertJsonCount(1, 'drivers')
            ->assertJsonPath('drivers.0.id', $profile->id);
    }

    public function test_admin_can_list_pending_documents(): void
    {
        $driverUser = User::factory()->driver()->create();
        $profile = DriverProfile::create([
            'user_id' => $driverUser->id,
            'status' => DriverProfileStatus::Pending,
        ]);

        $document = $profile->documents()->create([
            'type' => 'CIN',
            'file' => 'documents/'.$profile->id.'/cin.pdf',
            'status' => DriverProfileStatus::Pending,
        ]);

        $response = $this->withToken($this->adminToken)
            ->getJson('/api/v1/admin/driver/documents/pending');

        $response->assertOk()
            ->assertJsonCount(1, 'documents')
            ->assertJsonPath('documents.0.id', $document->id);
    }

    public function test_admin_can_approve_document(): void
    {
        $driverUser = User::factory()->driver()->create();
        $profile = DriverProfile::create([
            'user_id' => $driverUser->id,
            'status' => DriverProfileStatus::Pending,
        ]);

        $document = $profile->documents()->create([
            'type' => 'CIN',
            'file' => 'documents/'.$profile->id.'/cin.pdf',
            'status' => DriverProfileStatus::Pending,
        ]);

        $response = $this->withToken($this->adminToken)
            ->postJson("/api/v1/admin/driver/documents/{$document->id}/approve");

        $response->assertOk()
            ->assertJsonPath('message', 'Document approuvé.')
            ->assertJsonPath('document.status', DriverProfileStatus::Approved->value);

        $this->assertDatabaseHas('driver_documents', [
            'id' => $document->id,
            'status' => DriverProfileStatus::Approved->value,
            'verified_by' => $this->admin->id,
        ]);
    }

    public function test_admin_can_reject_document(): void
    {
        $driverUser = User::factory()->driver()->create();
        $profile = DriverProfile::create([
            'user_id' => $driverUser->id,
            'status' => DriverProfileStatus::Pending,
        ]);

        $document = $profile->documents()->create([
            'type' => 'CIN',
            'file' => 'documents/'.$profile->id.'/cin.pdf',
            'status' => DriverProfileStatus::Pending,
        ]);

        $response = $this->withToken($this->adminToken)
            ->postJson("/api/v1/admin/driver/documents/{$document->id}/reject", [
                'reason' => 'Document illisible.',
            ]);

        $response->assertOk()
            ->assertJsonPath('message', 'Document rejeté.')
            ->assertJsonPath('document.status', DriverProfileStatus::Rejected->value);

        $this->assertDatabaseHas('driver_documents', [
            'id' => $document->id,
            'status' => DriverProfileStatus::Rejected->value,
            'rejection_reason' => 'Document illisible.',
        ]);

        $this->assertDatabaseHas('driver_profiles', [
            'id' => $profile->id,
            'status' => DriverProfileStatus::Rejected->value,
        ]);
    }

    public function test_admin_can_approve_driver(): void
    {
        $driverUser = User::factory()->driver()->create();
        $profile = DriverProfile::create([
            'user_id' => $driverUser->id,
            'status' => DriverProfileStatus::Pending,
        ]);

        $response = $this->withToken($this->adminToken)
            ->postJson("/api/v1/admin/driver/{$profile->id}/approve");

        $response->assertOk()
            ->assertJsonPath('message', 'Chauffeur approuvé.')
            ->assertJsonPath('driver_profile.status', DriverProfileStatus::Approved->value);

        $this->assertDatabaseHas('driver_profiles', [
            'id' => $profile->id,
            'status' => DriverProfileStatus::Approved->value,
        ]);
    }

    public function test_admin_can_reject_driver(): void
    {
        $driverUser = User::factory()->driver()->create();
        $profile = DriverProfile::create([
            'user_id' => $driverUser->id,
            'status' => DriverProfileStatus::Pending,
        ]);

        $response = $this->withToken($this->adminToken)
            ->postJson("/api/v1/admin/driver/{$profile->id}/reject", [
                'reason' => 'Dossier incomplet.',
            ]);

        $response->assertOk()
            ->assertJsonPath('message', 'Chauffeur rejeté.')
            ->assertJsonPath('driver_profile.status', DriverProfileStatus::Rejected->value);

        $this->assertDatabaseHas('driver_profiles', [
            'id' => $profile->id,
            'status' => DriverProfileStatus::Rejected->value,
            'rejection_reason' => 'Dossier incomplet.',
        ]);
    }
}
