<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class StartSessionForApi
{
    public function handle(Request $request, Closure $next): Response
    {
        $kernel = app(\Illuminate\Contracts\Http\Kernel::class);

        $response = $kernel->handle(
            $request = $request->create($request->getPathInfo(), $request->getMethod(), [], [], [],
                $request->server->all())
        );

        return $response;
    }
}
