<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Session\Middleware\StartSession;
use Illuminate\View\Middleware\ShareErrorsFromSession;
use Symfony\Component\HttpFoundation\Response;

class AuthenticateSession
{
    public function handle(Request $request, Closure $next): Response
    {
        $startSession = new StartSession(app('session.store'));
        $shareErrors = new ShareErrorsFromSession(app('view'));

        $response = $startSession->handle($request, function ($request) use ($shareErrors, $next) {
            return $shareErrors->handle($request, function ($request) use ($next) {
                return $next($request);
            });
        });

        return $response;
    }
}
