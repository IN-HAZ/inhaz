<?php

namespace Tests\Feature\Auth;

use App\Models\Otp;
use App\Models\User;
use App\Notifications\OtpNotification;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Notification;
use Tests\TestCase;

class OtpAuthenticationTest extends TestCase
{
    use RefreshDatabase;

    private const PHONE = '+212612345678';

    public function test_stores_otp_hashed_and_never_in_plaintext(): void
    {
        Notification::fake();

        $response = $this->sendOtp();

        $response->assertOk()
            ->assertJsonMissing(['debug_code']);

        $otp = Otp::latest('id')->first();

        $this->assertStringStartsWith('$2y$', $otp->code_hash);
        $this->assertStringNotContainsString($this->lastOtpCode(), $otp->code_hash);
    }

    public function test_throttles_otp_requests_to_one_per_minute_per_phone(): void
    {
        Notification::fake();

        $this->sendOtp()->assertOk();
        $this->sendOtp()->assertStatus(429);
    }

    public function test_authenticates_new_user_with_valid_code_and_issues_sanctum_token(): void
    {
        Notification::fake();
        $this->sendOtp()->assertOk();

        $response = $this->postJson('/api/v1/auth/verify-otp', [
            'phone' => self::PHONE,
            'code' => $this->lastOtpCode(),
        ]);

        $response->assertOk()
            ->assertJsonStructure(['token', 'user' => ['phone']]);

        $this->assertTrue(User::where('phone', self::PHONE)->exists());
        $this->assertNotNull($response->json('user.customer_profile'));

        // The token grants access to protected endpoints.
        $this->withToken($response->json('token'))
            ->getJson('/api/v1/me')
            ->assertOk()
            ->assertJsonPath('user.phone', self::PHONE);
    }

    public function test_invalidates_code_after_three_failed_attempts(): void
    {
        Notification::fake();
        $this->sendOtp()->assertOk();
        $code = $this->lastOtpCode();

        foreach (range(1, 3) as $attempt) {
            $this->postJson('/api/v1/auth/verify-otp', [
                'phone' => self::PHONE,
                'code' => '000000',
            ])->assertStatus(422);
        }

        // Even the CORRECT code is now rejected: 3 strikes invalidate the OTP.
        $this->postJson('/api/v1/auth/verify-otp', [
            'phone' => self::PHONE,
            'code' => $code,
        ])->assertStatus(422);

        // The OTP record is invalidated (used) after 3 strikes.
        $this->assertTrue(Otp::latest('id')->first()->isUsed());
        $this->assertTrue(Otp::latest('id')->first()->isLocked());
    }

    public function test_rejects_expired_code(): void
    {
        Notification::fake();
        $this->sendOtp()->assertOk();
        $code = $this->lastOtpCode();

        $this->travel(10)->minutes();

        $this->postJson('/api/v1/auth/verify-otp', [
            'phone' => self::PHONE,
            'code' => $code,
        ])->assertStatus(422);
    }

    public function test_blocks_suspended_accounts_from_authenticated_endpoints(): void
    {
        $user = User::factory()->suspended()->create();
        $token = $user->createToken('mobile-app')->plainTextToken;

        $this->withToken($token)
            ->getJson('/api/v1/me')
            ->assertStatus(401);
    }

    public function test_revokes_token_on_logout(): void
    {
        Notification::fake();
        $this->sendOtp()->assertOk();

        $token = $this->postJson('/api/v1/auth/verify-otp', [
            'phone' => self::PHONE,
            'code' => $this->lastOtpCode(),
        ])->json('token');

        $this->withToken($token)
            ->postJson('/api/v1/auth/logout')
            ->assertOk();

        $this->freshAuth();

        $this->withToken($token)
            ->getJson('/api/v1/me')
            ->assertUnauthorized();
    }

    private function sendOtp(): \Illuminate\Testing\TestResponse
    {
        return $this->postJson('/api/v1/auth/send-otp', ['phone' => self::PHONE]);
    }

    private function lastOtpCode(): string
    {
        $code = '';

        Notification::assertSentOnDemand(
            OtpNotification::class,
            function (OtpNotification $notification) use (&$code) {
                $code = $notification->code();

                return true;
            }
        );

        return $code;
    }
}
