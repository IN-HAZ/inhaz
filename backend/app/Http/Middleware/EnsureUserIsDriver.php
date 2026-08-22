<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureUserIsDriver
{
    public function handle(Request $request, Closure $next): Response
    {
        $userId = $request->session()->get('user_id');

        if (! $userId) {
            return response()->json(['message' => 'Non authentifié.'], 401);
        }

        $user = \App\Models\User::find($userId);

        if (! $user || ! $user->isDriver()) {
            return response()->json(['message' => 'Accès réservé aux chauffeurs.'], 403);
        }

        $request->attributes->set('user', $user);

        return $next($request);
    }
}
