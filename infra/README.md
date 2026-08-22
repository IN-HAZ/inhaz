# inHaz Infrastructure & Docker Setup

The `infra` directory contains the complete **Docker containerization environment** for inHaz, encompassing Nginx web servers, PHP-FPM application workers, PostgreSQL database instances, Redis caching/queues, and supervisor process monitoring.

---

## 🏗️ Directory Layout

```text
infra/
├── docker/
│   ├── nginx.dev.conf         # Nginx configuration for Local Development
│   ├── nginx.prod.conf        # Nginx configuration for Production
│   ├── php/
│   │   ├── dev.ini            # PHP development settings & xdebug
│   │   ├── prod.ini           # PHP production OPcache optimization
│   │   └── www.conf           # PHP-FPM pool configuration
│   └── supervisord.conf       # Process manager for Laravel queue workers
├── docker-compose.dev.yml     # Local Development Compose Configuration
├── docker-compose.prod.yml    # Production Compose Configuration
├── Dockerfile                 # Production Multi-Stage PHP Container
├── Dockerfile.dev             # Local Development PHP Container
└── README.md
```

---

## 🚀 Environment Execution Modes

### 1. Development Mode (`docker-compose.dev.yml`)
Started automatically via `make dev` or `make up`:

*   **Services:** `nginx` (port 8000), `php` (FPM app container), `postgres` (port 5432), `redis` (port 6379).
*   **Source Code:** Mounted live from `backend/` host directory for hot-reloading.

```bash
# Start development containers in background
make up

# View logs
make logs

# Execute artisan commands inside PHP container
docker compose -f infra/docker-compose.dev.yml exec php php artisan migrate
```

---

### 2. Production Mode (`docker-compose.prod.yml`)
Started via `make prod-up`:

*   **Environment Requirements:** Requires a `.env` file at the repository root (`cp .env.example .env`).
*   **Security:** Enforces strict passwords for PostgreSQL and Redis (`REDIS_PASSWORD` fail-fast check).
*   **OPcache:** PHP OPcache precompiled for high-throughput production workloads.

```bash
# 1. Copy root .env template and set production secrets
cp .env.example .env

# 2. Start production Docker stack
make prod-up

# 3. Force database migrations
docker compose --env-file .env -f infra/docker-compose.prod.yml exec php php artisan migrate --force
```
