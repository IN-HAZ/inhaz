<?php

namespace App\Http;

use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;
use Throwable;

/**
 * Exception responses bypass the CORS middleware, which makes real 4xx/5xx
 * API errors look like "CORS errors" in the browser. Registered via
 * $exceptions->respond() so error responses carry the same headers.
 */
class AttachCorsHeadersToErrors
{
    public function __invoke(Response $response, Throwable $e, Request $request): Response
    {
        if (! $request->is('api/*')) {
            return $response;
        }

        $origin = (string) $request->headers->get('Origin');

        if ($origin !== '' && $this->originAllowed($origin)) {
            $response->headers->set('Access-Control-Allow-Origin', $origin);
            $response->headers->set('Access-Control-Allow-Credentials', 'true');
            $response->headers->set('Vary', 'Origin');
        }

        return $response;
    }

    /**
     * Same rules as the HandleCors middleware: exact origins + regex patterns.
     * Malformed patterns are skipped instead of masking the original error.
     */
    private function originAllowed(string $origin): bool
    {
        if (in_array($origin, (array) config('cors.allowed_origins'), true)) {
            return true;
        }

        foreach ((array) config('cors.allowed_origins_patterns') as $pattern) {
            if (@preg_match($pattern, '') !== false && preg_match($pattern, $origin) === 1) {
                return true;
            }
        }

        return false;
    }
}
