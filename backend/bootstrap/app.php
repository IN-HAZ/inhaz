<?php

use App\Http\AttachCorsHeadersToErrors;
use App\Http\Middleware\EnsureUserIsActive;
use App\Http\Middleware\EnsureUserIsAdmin;
use App\Http\Middleware\EnsureUserIsDriver;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Request;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        $middleware->alias([
            'active' => EnsureUserIsActive::class,
            'admin' => EnsureUserIsAdmin::class,
            'driver' => EnsureUserIsDriver::class,
        ]);

        // API-only app: no named "login" route exists. The framework default
        // (fn () => route('login')) eagerly throws during exception construction
        // whenever a guest omits Accept: application/json, turning 401 into 500.
        // Returning null defers entirely to shouldRenderJsonWhen below.
        $middleware->redirectGuestsTo(fn (): ?string => null);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        $exceptions->shouldRenderJsonWhen(
            fn (Request $request) => $request->is('api/*') || $request->expectsJson(),
        );

        // Exception responses bypass CORS middleware; attach the headers here.
        $exceptions->respond(new AttachCorsHeadersToErrors);
    })->create();
