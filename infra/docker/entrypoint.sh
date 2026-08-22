#!/bin/sh
set -e

APP_DIR=/var/www/html
cd "$APP_DIR"

# Only the master containers (default CMD) run bootstrap; command overrides
# like `php artisan queue:work` / `schedule:work` just exec below.
case "$1" in
    "" | supervisord | /usr/bin/supervisord | php-fpm)
        bootstrap=1
        ;;
    *)
        bootstrap=0
        ;;
esac

if [ "${APP_ENV:-production}" = "local" ] || [ "${APP_ENV:-}" = "development" ]; then
    if [ "$bootstrap" = "1" ]; then
        echo "==> [dev] bootstrapping..."
        if [ ! -f .env ]; then
            echo "==> [dev] no .env found, creating from .env.example"
            cp .env.example .env
            php artisan key:generate --force
        fi
        # Bind-mount ownership differs from the image; make storage writable.
        chown -R www-data:www-data storage bootstrap/cache
        php artisan migrate --force
        # Best-effort: a broken seeder must not take the API down.
        php artisan db:seed --force || echo "WARNING: db:seed failed - continuing"
    fi
else
    # Production: fail fast instead of generating a key that breaks sessions.
    if [ -z "${APP_KEY:-}" ]; then
        echo "ERROR: APP_KEY is not set. Add it to the root .env (php artisan key:generate --show)." >&2
        exit 1
    fi
    if [ "$bootstrap" = "1" ]; then
        echo "==> [prod] bootstrapping..."
        # Runtime env vars must win over whatever .env was baked at build time,
        # so caches are (re)built here, not during docker build.
        php artisan migrate --force
        php artisan storage:link || true
        php artisan config:cache
        php artisan route:cache
        php artisan view:cache
    fi
fi

exec "$@"
