# inHaz Backend — Laravel REST API & Admin Back-Office

The `backend` directory contains the core server application for inHaz, built on **Laravel 11** and running inside containerized Docker infrastructure.

---

## ⚠️ Execution Policy

> [!WARNING]
> Do **not** attempt to run `php artisan serve` directly on your host machine. The backend requires containerized services (PostgreSQL database at `postgres:5432`, Redis at `redis:6379`, and Nginx web server) configured in `infra/`.

---

## 🛠️ Tech Stack & Architecture

*   **Framework:** Laravel 11 (PHP 8.2+)
*   **Database:** PostgreSQL (`pgsql`)
*   **Caching & Session:** Redis
*   **Queue Driver:** Redis
*   **Authentication:** Laravel Sanctum (Token-based)
*   **Admin Panel:** Filament v5 (Laravel/Livewire server-rendered back-office)

---

## 🚀 Running Commands via Docker Exec

To run Artisan commands, migrations, or tests, execute them inside the running container:

```bash
# Run Database Migrations
docker compose -f infra/docker-compose.dev.yml exec php php artisan migrate

# Seed Database
docker compose -f infra/docker-compose.dev.yml exec php php artisan db:seed

# Run Unit & Feature Tests
docker compose -f infra/docker-compose.dev.yml exec php php artisan test

# Access PHP Shell
docker compose -f infra/docker-compose.dev.yml exec php php artisan tinker
```

---

## 📡 API Endpoint Overview (`/api/v1/`)

| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/v1/auth/send-otp` | Generate and send 6-digit SMS OTP | No |
| `POST` | `/api/v1/auth/verify-otp` | Verify OTP code and issue Sanctum token | No |
| `GET` | `/api/v1/me` | Fetch authenticated user profile | Yes (Bearer) |
| `POST` | `/api/v1/driver/apply` | Submit driver application & credentials | Yes (Bearer) |
| `POST` | `/api/v1/requests` | Create a new delivery transport request | Yes (Bearer) |
| `GET` | `/api/v1/requests/browse` | Driver search feed for nearby open requests | Yes (Bearer) |
| `POST` | `/api/v1/requests/{id}/offers` | Driver submits offer or counter-price | Yes (Bearer) |
| `POST` | `/api/v1/offers/{id}/accept` | Client accepts winning offer & creates trip | Yes (Bearer) |
| `POST` | `/api/v1/trips/{id}/transition` | Driver steps trip status milestone | Yes (Bearer) |
| `POST` | `/api/v1/trips/{id}/rate` | Submit post-trip rating | Yes (Bearer) |

---

## ⚙️ Environment Variables

The backend environment inside Docker is managed by configuration files:
*   **Dev Mode:** Managed by `infra/docker-compose.dev.yml` environment variables.
*   **Production Mode:** Configured by root `.env` loaded via `make prod-up`.
