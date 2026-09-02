<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureUserHasDriverProfile
{
    public function handle(Request $request, Closure $next): Response
    {
        // Onboarding: a pending applicant (role=client) must be able to fill
        // vehicle + documents and read their own dossier. Only an existing
        // driver_profile is required, whatever its status.
        if (! $request->user()?->driverProfile()->exists()) {
            return response()->json([
                'message' => 'Accès réservé aux chauffeurs.',
            ], 403);
        }

        return $next($request);
    }
}
