<?php

namespace Tests;

use Illuminate\Contracts\Auth\Authenticatable as UserContract;
use Illuminate\Foundation\Testing\TestCase as BaseTestCase;

abstract class TestCase extends BaseTestCase
{
    /**
     * All API tests authenticate through the Sanctum guard by default,
     * matching the `auth:sanctum` middleware used across routes/api.php.
     */
    public function actingAs(UserContract $user, $guard = 'sanctum')
    {
        return parent::actingAs($user, $guard);
    }

    /**
     * Reset cached guard instances between HTTP requests within one test.
     *
     * RequestGuard caches the resolved user per app instance; since a feature
     * test shares one app across multiple requests, a guard would otherwise
     * keep returning a previously authenticated user even after its token
     * was revoked. Production is unaffected (one process per request).
     */
    protected function freshAuth(): static
    {
        $this->app->make('auth')->forgetGuards();

        return $this;
    }
}
