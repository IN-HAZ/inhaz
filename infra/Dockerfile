FROM node:20-alpine AS frontend

WORKDIR /app

COPY backend/package*.json ./
RUN npm ci --ignore-scripts

COPY backend/vite.config.js ./
COPY backend/resources/ ./resources/
COPY backend/public/ ./public/

RUN npm run build

# --- PHP Dependencies ---
FROM composer:2 AS vendor

WORKDIR /app

COPY backend/composer.json backend/composer.lock ./
RUN composer install \
    --no-dev \
    --no-scripts \
    --no-autoloader \
    --prefer-dist \
    --optimize-autoloader \
    --ignore-platform-reqs

COPY backend/ ./
RUN composer dump-autoload --optimize --no-dev \
    && php artisan package:discover --ansi

# --- Production ---
FROM php:8.4-fpm-alpine AS production

RUN apk add --no-cache \
    nginx \
    supervisor \
    fcgi \
    libpq \
    libzip \
    icu-libs \
    libpng \
    libjpeg-turbo \
    freetype \
    oniguruma \
    zlib-dev \
    && docker-php-ext-configure gd \
        --with-freetype \
        --with-jpeg \
    && docker-php-ext-install -j$(nproc) \
        pdo_pgsql \
        mbstring \
        exif \
        pcntl \
        bcmath \
        gd \
        zip \
        intl \
    && pecl install redis \
    && docker-php-ext-enable redis opcache

RUN cp "$PHP_INI_DIR/php.ini-production" "$PHP_INI_DIR/php.ini"

COPY infra/docker/php/prod.ini $PHP_INI_DIR/conf.d/99-custom.ini
COPY infra/docker/php/www.conf /usr/local/etc/php-fpm.d/zz-www.conf
COPY infra/docker/supervisord.conf /etc/supervisor/conf.d/supervisord.conf
COPY infra/docker/nginx.prod.conf /etc/nginx/http.d/default.conf
COPY infra/docker/entrypoint.sh /usr/local/bin/entrypoint.sh
RUN chmod +x /usr/local/bin/entrypoint.sh

WORKDIR /var/www/html

COPY --from=vendor /app/vendor/ ./vendor/
COPY --from=frontend /app/public/build/ ./public/build/
COPY backend/ ./

# Masters (supervisord/nginx/php-fpm master) run as root; pool workers run as
# www-data via zz-www.conf. Caches are built at container start, not here, so
# runtime env vars win over whatever .env existed on the build machine.
RUN chown -R www-data:www-data /var/www/html \
    && chmod -R 775 storage bootstrap/cache

EXPOSE 80

ENTRYPOINT ["/usr/local/bin/entrypoint.sh"]
CMD ["/usr/bin/supervisord", "-c", "/etc/supervisor/conf.d/supervisord.conf"]
