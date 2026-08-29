<?php

namespace Tests\Feature\Auth;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class RoleSwitchingTest extends TestCase
{
    use RefreshDatabase;

    public function test_client_without_driver_profile_is_routed_to_onboarding(): void
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user)->postJson('/api/v1/auth/switch-role', [
            'mode' => 'driver',
        ]);

        $response->assertOk()
            ->assertJsonPath('allowed', false)
            ->assertJsonPath('reason', 'onboarding_required');

        $this->assertSame('client', $user->fresh()->role->value);
    }

    public function test_pending_driver_cannot_access_driver_mode(): void
    {
        $user = User::factory()->create();
        $user->driverProfile()->create(['status' => 'PENDING']);

        $response = $this->actingAs($user)->postJson('/api/v1/auth/switch-role', [
            'mode' => 'driver',
        ]);

        $response->assertOk()
            ->assertJsonPath('allowed', false)
            ->assertJsonPath('reason', 'verification_pending')
            ->assertJsonPath('verification_status', 'pending');

        $this->assertSame('client', $user->fresh()->role->value);
    }

    public function test_approved_driver_switches_to_driver_mode(): void
    {
        $user = User::factory()->create();
        $user->driverProfile()->create([
            'status' => 'APPROVED',
            'approved_at' => now(),
        ]);

        $this->actingAs($user)->postJson('/api/v1/auth/switch-role', [
            'mode' => 'driver',
        ])->assertOk()
            ->assertJsonPath('allowed', true);

        $this->assertSame('driver', $user->fresh()->role->value);
    }

    public function test_approved_driver_can_switch_back_to_client_mode(): void
    {
        $user = User::factory()->driver()->create();

        $this->actingAs($user)->postJson('/api/v1/auth/switch-role', [
            'mode' => 'client',
        ])->assertOk()
            ->assertJsonPath('allowed', true)
            ->assertJsonPath('mode', 'client');

        $this->assertSame('client', $user->fresh()->role->value);
    }

    public function test_admin_cannot_downgrade_role_via_switching(): void
    {
        $admin = User::factory()->admin()->create();

        $this->actingAs($admin)->postJson('/api/v1/auth/switch-role', [
            'mode' => 'client',
        ])->assertOk()
            ->assertJsonPath('allowed', false)
            ->assertJsonPath('reason', 'admin_role');

        $this->assertSame('admin', $admin->fresh()->role->value);
    }
}
