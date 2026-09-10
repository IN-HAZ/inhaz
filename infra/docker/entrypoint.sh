#!/bin/sh
set -e

cd /var/www/html

# Ensure Laravel's required directory structure exists
# (bind-mount or fresh clone may be missing these)
mkdir -p \
    storage/framework/views \
    storage/framework/cache/data \
    storage/framework/sessions \
    storage/framework/testing \
    storage/logs \
    bootstrap/cache

# Fix ownership so www-data can write
chown -R www-data:www-data storage bootstrap/cache

# Run migrations (idempotent — safe on every boot)
php artisan migrate --force

exec "$@"
