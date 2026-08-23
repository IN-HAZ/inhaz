<?php

namespace Tests\Feature\Auth;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AdminRouteProtectionTest extends TestCase
{
    use RefreshDatabase;

    public function test_regular_user_is_forbidden_from_admin_endpoints(): void
    {
        $user = User::factory()->create();
        $token = $user->createToken('mobile-app')->plainTextToken;

        $this->withToken($token)
            ->getJson('/api/v1/admin/driver/pending')
            ->assertStatus(403);
    }

    public function test_unauthenticated_request_is_rejected_on_admin_endpoints(): void
    {
        $this->getJson('/api/v1/admin/driver/pending')
            ->assertStatus(401);
    }

    public function test_admin_can_access_admin_endpoints(): void
    {
        $admin = User::factory()->admin()->create();
        $token = $admin->createToken('admin-panel')->plainTextToken;

        $this->withToken($token)
            ->getJson('/api/v1/admin/driver/pending')
            ->assertOk()
            ->assertJsonStructure(['drivers']);
    }
}
