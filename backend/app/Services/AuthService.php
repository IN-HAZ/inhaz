<?php

namespace App\Services;

use App\Enums\DriverProfileStatus;
use App\Enums\UserRole;
use App\Models\Otp;
use App\Models\User;
use App\Notifications\OtpNotification;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Facades\RateLimiter;

class AuthService
{
    private const OTP_TTL_MINUTES = 5;

    public function sendOtp(string $phone, string $ip): ?int
    {
        $phoneKey = 'send-otp:phone:'.$phone;
        if (RateLimiter::tooManyAttempts($phoneKey, 1)) {
            return RateLimiter::availableIn($phoneKey);
        }

        $ipKey = 'send-otp:ip:'.$ip;
        if (RateLimiter::tooManyAttempts($ipKey, 10)) {
            throw new \DomainException('Trop de demandes depuis cet appareil. Réessayez plus tard.');
        }

        RateLimiter::hit($phoneKey, 60);
        RateLimiter::hit($ipKey, 3600);

        Otp::where('phone', $phone)->where('used', false)->update(['used' => true]);

        $code = str_pad((string) random_int(0, 999999), 6, '0', STR_PAD_LEFT);

        Otp::create([
            'phone' => $phone,
            'code_hash' => Hash::make($code),
            'expires_at' => now()->addMinutes(self::OTP_TTL_MINUTES),
        ]);

        Notification::route('mail', $phone.'@mailpit.test')
            ->notify(new OtpNotification($code));

        return null;
    }

    public function verifyOtp(string $phone, string $code): User
    {
        $attemptsKey = 'verify-otp:'.$phone;
        if (RateLimiter::tooManyAttempts($attemptsKey, 5)) {
            $seconds = RateLimiter::availableIn($attemptsKey);
            throw new \DomainException("Trop de tentatives. Veuillez réessayer dans {$seconds} secondes.");
        }

        $otp = Otp::where('phone', $phone)
            ->where('used', false)
            ->where('expires_at', '>', now())
            ->latest()
            ->first();

        if (! $otp || $otp->isLocked() || ! Hash::check($code, $otp->code_hash)) {
            RateLimiter::hit($attemptsKey, 300);
            if ($otp) {
                $otp->increment('attempts');
                if ($otp->isLocked()) {
                    $otp->update(['used' => true]);
                }
            }
            throw new \InvalidArgumentException('Code OTP invalide ou expiré.');
        }

        $user = DB::transaction(function () use ($otp, $phone) {
            $otp->update(['used' => true]);

            $user = User::firstOrCreate(['phone' => $phone]);
            $user->update(['phone_verified_at' => now()]);

            if (! $user->customerProfile) {
                $user->customerProfile()->create([]);
            }

            return $user;
        });

        RateLimiter::clear($attemptsKey);

        return $user;
    }

    public function switchRole(User $user, string $mode): array
    {
        if ($user->isAdmin()) {
            return ['mode' => $mode, 'allowed' => false, 'reason' => 'admin_role'];
        }

        if ($mode === 'driver') {
            $profile = $user->driverProfile;

            if (! $profile) {
                return ['mode' => 'driver', 'allowed' => false, 'reason' => 'onboarding_required'];
            }

            if ($profile->status === DriverProfileStatus::Pending) {
                return ['mode' => 'driver', 'allowed' => false, 'reason' => 'verification_pending', 'verification_status' => 'pending'];
            }

            if ($profile->status !== DriverProfileStatus::Approved) {
                return ['mode' => 'driver', 'allowed' => false, 'reason' => 'verification_failed', 'verification_status' => strtolower($profile->status->value)];
            }

            $user->update(['role' => UserRole::Driver]);

            return ['mode' => 'driver', 'allowed' => true, 'user' => $user->fresh()->load('customerProfile', 'driverProfile')];
        }

        $user->update(['role' => UserRole::Client]);

        return ['mode' => 'client', 'allowed' => true, 'user' => $user->fresh()->load('customerProfile', 'driverProfile')];
    }

    public function updateProfile(User $user, array $data): User
    {
        if (isset($data['name'])) {
            $user->update(['name' => $data['name']]);
            optional($user->customerProfile)->update(['name' => $data['name']]);
        }

        if (array_key_exists('email', $data)) {
            optional($user->customerProfile)->update(['email' => $data['email']]);
        }

        return $user->fresh()->load('customerProfile');
    }
}
