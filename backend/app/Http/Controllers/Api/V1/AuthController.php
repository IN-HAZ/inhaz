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
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Str;

class AuthController extends Controller
{
    public function sendOtp(SendOtpRequest $request): JsonResponse
    {
        $phone = $request->validated('phone');

        $throttleKey = 'send-otp:'.$phone;

        if (RateLimiter::tooManyAttempts($throttleKey, 3)) {
            $seconds = RateLimiter::availableIn($throttleKey);

            return response()->json([
                'message' => 'Trop de demandes. Veuillez réessayer dans '.$seconds.' secondes.',
            ], 429);
        }

        RateLimiter::hit($throttleKey, 300);

        Otp::where('phone', $phone)
            ->where('used', false)
            ->update(['used' => true]);

        $code = str_pad((string) random_int(0, 999999), 6, '0', STR_PAD_LEFT);

        Otp::create([
            'phone' => $phone,
            'code' => $code,
            'expires_at' => now()->addMinutes(5),
        ]);

        $user = User::where('phone', $phone)->first();
        $email = ($user->email ?? $phone).'@mailpit.test';

        Notification::route('mail', $email)
            ->notify(new OtpNotification($code));

        return response()->json([
            'message' => 'Code OTP envoyé.',
            'debug_code' => config('app.debug') ? $code : null,
        ]);
    }

    public function verifyOtp(VerifyOtpRequest $request): JsonResponse
    {
        $phone = $request->validated('phone');
        $code = $request->validated('code');

        $otp = Otp::where('phone', $phone)
            ->where('code', $code)
            ->where('used', false)
            ->where('expires_at', '>', now())
            ->latest()
            ->first();

        if (! $otp) {
            $attemptsKey = 'verify-otp:'.$phone;
            RateLimiter::hit($attemptsKey, 300);

            if (RateLimiter::tooManyAttempts($attemptsKey, 10)) {
                return response()->json([
                    'message' => 'Trop de tentatives. Veuillez redemander un nouveau code.',
                ], 429);
            }

            return response()->json([
                'message' => 'Code OTP invalide ou expiré.',
            ], 422);
        }

        DB::transaction(function () use ($otp, $phone) {
            $otp->update(['used' => true]);

            $user = User::firstOrCreate(
                ['phone' => $phone],
                ['name' => '']
            );

            $user->update(['phone_verified_at' => now()]);

            if (! $user->customerProfile) {
                $user->customerProfile()->create([]);
            }
        });

        $user = User::where('phone', $phone)->first();

        $request->session()->put('auth_token', Str::random(60));
        $request->session()->put('user_id', $user->id);
        $request->session()->regenerate();

        return response()->json([
            'message' => 'Authentification réussie.',
            'user' => $user->load('customerProfile'),
        ]);
    }

    public function logout(Request $request): JsonResponse
    {
        $request->session()->forget(['auth_token', 'user_id']);
        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return response()->json([
            'message' => 'Déconnexion réussie.',
        ]);
    }

    public function me(Request $request): JsonResponse
    {
        $userId = $request->session()->get('user_id');

        if (! $userId) {
            return response()->json(['message' => 'Non authentifié.'], 401);
        }

        $user = User::with(['customerProfile', 'driverProfile'])->find($userId);

        if (! $user) {
            return response()->json(['message' => 'Utilisateur introuvable.'], 404);
        }

        return response()->json([
            'user' => $user,
        ]);
    }

    public function updateProfile(UpdateProfileRequest $request): JsonResponse
    {
        $userId = $request->session()->get('user_id');

        if (! $userId) {
            return response()->json(['message' => 'Non authentifié.'], 401);
        }

        $user = User::find($userId);

        if (! $user) {
            return response()->json(['message' => 'Utilisateur introuvable.'], 404);
        }

        $data = $request->validated();

        if (isset($data['name'])) {
            $user->update(['name' => $data['name']]);
            if ($user->customerProfile) {
                $user->customerProfile->update(['name' => $data['name']]);
            }
        }

        if (array_key_exists('email', $data)) {
            if ($user->customerProfile) {
                $user->customerProfile->update(['email' => $data['email']]);
            }
        }

        return response()->json([
            'message' => 'Profil mis à jour.',
            'user' => $user->load('customerProfile'),
        ]);
    }
}
