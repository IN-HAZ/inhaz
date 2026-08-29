<?php

namespace Tests\Feature\Console;

use App\Models\Otp;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class PruneOtpsCommandTest extends TestCase
{
    use RefreshDatabase;

    public function test_prunes_expired_otps(): void
    {
        $expiredOtp = Otp::create([
            'phone' => '+212600000001',
            'code_hash' => bcrypt('123456'),
            'expires_at' => now()->subDays(2),
            'used' => false,
            'attempts' => 0,
        ]);

        $activeOtp = Otp::create([
            'phone' => '+212600000002',
            'code_hash' => bcrypt('654321'),
            'expires_at' => now()->addMinutes(5),
            'used' => false,
            'attempts' => 0,
        ]);

        $this->artisan('otp:purge', ['--days' => 1])
            ->expectsOutput('Purged 1 OTP record(s).')
            ->assertExitCode(0);

        $this->assertDatabaseMissing('otps', ['id' => $expiredOtp->id]);
        $this->assertDatabaseHas('otps', ['id' => $activeOtp->id]);
    }
}
