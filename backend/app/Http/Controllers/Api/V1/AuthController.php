<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\Auth\SendOtpRequest;
use App\Http\Requests\Api\V1\Auth\VerifyOtpRequest;
use App\Http\Requests\Api\V1\Profile\UpdateProfileRequest;
use App\Models\Otp;
use App\Models\User;
use App\Notifications\OtpNotification;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Facades\RateLimiter;

class AuthController extends Controller
{
    private const OTP_TTL_MINUTES = 5;

    public function sendOtp(SendOtpRequest $request): JsonResponse
    {
        $phone = $request->validated('phone');

        // Spec US-101: max 1 request per phone per 60s.
        $phoneKey = 'send-otp:phone:'.$phone;
        if (RateLimiter::tooManyAttempts($phoneKey, 1)) {
            return $this->tooManyAttempts(RateLimiter::availableIn($phoneKey));
        }

        // Defense in depth: cap OTP dispatches per IP to prevent SMS/email bombing.
        $ipKey = 'send-otp:ip:'.$request->ip();
        if (RateLimiter::tooManyAttempts($ipKey, 10)) {
            return response()->json([
                'message' => 'Trop de demandes depuis cet appareil. Réessayez plus tard.',
            ], 429);
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

        // MVP delivery channel: local mailbox (Mailpit). Swap for an SMS gateway post-MVP.
        Notification::route('mail', $phone.'@mailpit.test')
            ->notify(new OtpNotification($code));

        return response()->json([
            'message' => 'Code OTP envoyé.',
        ]);
    }

    public function verifyOtp(VerifyOtpRequest $request): JsonResponse
    {
        $phone = $request->validated('phone');
        $code = $request->validated('code');

        $attemptsKey = 'verify-otp:'.$phone;
        if (RateLimiter::tooManyAttempts($attemptsKey, 5)) {
            return $this->tooManyAttempts(RateLimiter::availableIn($attemptsKey));
        }

        $otp = Otp::where('phone', $phone)
            ->where('used', false)
            ->where('expires_at', '>', now())
            ->latest()
            ->first();

        if (! $otp || $otp->isLocked() || ! Hash::check($code, $otp->code_hash)) {
            return $this->registerFailedAttempt($attemptsKey, $otp);
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

        return response()->json([
            'message' => 'Authentification réussie.',
            'token' => $user->createToken('mobile-app')->plainTextToken,
            'token_type' => 'Bearer',
            'user' => $user->load('customerProfile'),
        ]);
    }

    public function switchRole(Request $request): JsonResponse
    {
        $request->validate(['mode' => ['required', 'in:client,driver']]);

        $user = $request->user();
        $mode = $request->input('mode');

        if ($mode === 'driver') {
            $profile = $user->driverProfile;

            if (! $profile) {
                return $this->switchResponse('driver', false, 'onboarding_required');
            }

            if ($profile->status === 'PENDING') {
                return $this->switchResponse('driver', false, 'verification_pending', 'pending');
            }

            if ($profile->status !== 'APPROVED') {
                return $this->switchResponse('driver', false, 'verification_failed', strtolower($profile->status));
            }

            $user->update(['role' => 'driver']);

            return $this->switchResponse('driver', true, null, null, $user);
        }

        if ($user->isAdmin()) {
            return $this->switchResponse('client', false, 'admin_role');
        }

        $user->update(['role' => 'client']);

        return $this->switchResponse('client', true, null, null, $user);
    }

    public function logout(Request $request): JsonResponse
    {
        $request->user()->currentAccessToken()?->delete();

        return response()->json([
            'message' => 'Déconnexion réussie.',
        ]);
    }

    public function me(Request $request): JsonResponse
    {
        return response()->json([
            'user' => $request->user()->load('customerProfile', 'driverProfile'),
        ]);
    }

    public function updateProfile(UpdateProfileRequest $request): JsonResponse
    {
        $user = $request->user();
        $data = $request->validated();

        if (isset($data['name'])) {
            $user->update(['name' => $data['name']]);
            optional($user->customerProfile)->update(['name' => $data['name']]);
        }

        if (array_key_exists('email', $data)) {
            optional($user->customerProfile)->update(['email' => $data['email']]);
        }

        return response()->json([
            'message' => 'Profil mis à jour.',
            'user' => $user->fresh()->load('customerProfile'),
        ]);
    }

    private function registerFailedAttempt(string $key, ?Otp $otp): JsonResponse
    {
        RateLimiter::hit($key, 300);

        if ($otp) {
            $otp->increment('attempts');
            // Spec US-101: 3 failed attempts invalidate the code.
            if ($otp->isLocked()) {
                $otp->update(['used' => true]);
            }
        }

        return response()->json([
            'message' => 'Code OTP invalide ou expiré.',
        ], 422);
    }

    private function tooManyAttempts(int $seconds): JsonResponse
    {
        return response()->json([
            'message' => 'Trop de tentatives. Veuillez réessayer dans '.$seconds.' secondes.',
        ], 429)->withHeaders([
            'Retry-After' => $seconds,
        ]);
    }

    private function switchResponse(
        string $mode,
        bool $allowed,
        ?string $reason,
        ?string $verificationStatus = null,
        ?User $user = null,
    ): JsonResponse {
        return response()->json(array_filter([
            'mode' => $mode,
            'allowed' => $allowed,
            'reason' => $reason,
            'verification_status' => $verificationStatus,
            'user' => $allowed && $user ? $user->fresh()->load('customerProfile', 'driverProfile') : null,
        ], fn ($value) => $value !== null));
    }
}
