<?php

namespace Tests\Feature\Auth;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class UserProfileTest extends TestCase
{
    use RefreshDatabase;

    public function test_user_can_get_own_profile(): void
    {
        $user = User::factory()->create(['name' => 'John Doe']);
        $user->customerProfile()->create(['name' => 'John Doe']);

        $token = $user->createToken('mobile-app')->plainTextToken;

        $response = $this->withToken($token)
            ->getJson('/api/v1/me');

        $response->assertOk()
            ->assertJsonPath('user.name', 'John Doe')
            ->assertJsonStructure(['user' => ['id', 'name', 'phone', 'customer_profile', 'driver_profile']]);
    }

    public function test_user_can_update_profile_name_and_email(): void
    {
        $user = User::factory()->create(['name' => 'Old Name']);
        $user->customerProfile()->create(['name' => 'Old Name', 'email' => 'old@example.com']);

        $token = $user->createToken('mobile-app')->plainTextToken;

        $response = $this->withToken($token)
            ->putJson('/api/v1/me', [
                'name' => 'New Name',
                'email' => 'new@example.com',
            ]);

        $response->assertOk()
            ->assertJsonPath('message', 'Profil mis à jour.')
            ->assertJsonPath('user.name', 'New Name')
            ->assertJsonPath('user.customer_profile.email', 'new@example.com');

        $this->assertDatabaseHas('customer_profiles', [
            'user_id' => $user->id,
            'name' => 'New Name',
            'email' => 'new@example.com',
        ]);
    }

    public function test_profile_update_validates_email_format(): void
    {
        $user = User::factory()->create();
        $token = $user->createToken('mobile-app')->plainTextToken;

        $response = $this->withToken($token)
            ->putJson('/api/v1/me', [
                'email' => 'not-an-email',
            ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['email']);
    }
}
