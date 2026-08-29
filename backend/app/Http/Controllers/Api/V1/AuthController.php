<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\Auth\SendOtpRequest;
use App\Http\Requests\Api\V1\Auth\VerifyOtpRequest;
use App\Http\Requests\Api\V1\Profile\UpdateProfileRequest;
use App\Services\AuthService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AuthController extends Controller
{
    public function __construct(private AuthService $authService) {}

    private const OTP_TTL_MINUTES = 5;

    public function sendOtp(SendOtpRequest $request): JsonResponse
    {
        try {
            $seconds = $this->authService->sendOtp($request->validated('phone'), $request->ip());
            if ($seconds !== null) {
                return response()->json([
                    'message' => 'Trop de tentatives. Veuillez réessayer dans '.$seconds.' secondes.',
                ], 429)->withHeaders([
                    'Retry-After' => $seconds,
                ]);
            }

            return response()->json([
                'message' => 'Code OTP envoyé.',
            ]);
        } catch (\DomainException $e) {
            return response()->json(['message' => $e->getMessage()], 429);
        }
    }

    public function verifyOtp(VerifyOtpRequest $request): JsonResponse
    {
        try {
            $user = $this->authService->verifyOtp($request->validated('phone'), $request->validated('code'));

            return response()->json([
                'message' => 'Authentification réussie.',
                'token' => $user->createToken('mobile-app')->plainTextToken,
                'token_type' => 'Bearer',
                'user' => $user->load('customerProfile'),
            ]);
        } catch (\DomainException $e) {
            return response()->json(['message' => $e->getMessage()], 429);
        } catch (\InvalidArgumentException $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        }
    }

    public function switchRole(Request $request): JsonResponse
    {
        $request->validate(['mode' => ['required', 'in:client,driver']]);

        $result = $this->authService->switchRole($request->user(), $request->input('mode'));

        return response()->json(array_filter($result, fn ($value) => $value !== null));
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
        $user = $this->authService->updateProfile($request->user(), $request->validated());

        return response()->json([
            'message' => 'Profil mis à jour.',
            'user' => $user,
        ]);
    }
}
