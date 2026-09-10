# AGENTS.md — inHaz monorepo

P2P urban freight platform (Morocco): client posts a delivery request, drivers counter-bid, trip executes. Spec-driven repo — requirements live in docs, not just code.

## Layout

- `backend/` — Laravel API + Filament admin. REST under `/api/v1` (see `routes/api.php`). PHP ^8.3, Laravel ^13, Filament ^5, Postgres, Redis (cache/session/queue).
- `mobile/` — Expo SDK 57 / RN app for both Client and Driver personas (single app). See also `mobile/AGENTS.md`.
- `infra/` — Dev-only Docker Compose + Dockerfile. Services: `php` (PHP built-in server), `postgres`, `redis`, `mailpit`, `rustfs`.
- `tech-spects/`, `dev/` — technical specs and Agile epics. `dev/implementation_status_and_design_system_matrix.md` maps what's implemented vs spec; check it before building features.
- Docs drift: sub-READMEs claim "Laravel 11 / PHP 8.2+ / Expo SDK 51" — trust `composer.json` / `package.json` instead.

## Running: everything through Docker

The backend **only works inside containers** (Postgres, Redis are containerized). Never run artisan/composer commands on the host.

```bash
make env       # bootstrap per-directory .env files from .env.example (first time only)
make up        # start all containers (postgres, redis, mailpit, rustfs, php)
make dev       # make up + Expo dev server in foreground
make logs      # stream container logs
make art <cmd> # run artisan inside the php container, e.g: make art migrate
```

API is served by the **PHP built-in server** at `http://localhost:8000`; Mailpit UI at `http://localhost:8025`.

Run artisan/composer/tests **inside the php container**:

```bash
DOCKER="docker compose -f infra/docker-compose.dev.yml exec php"
$DOCKER php artisan test                       # full suite
$DOCKER php artisan test --filter=OfferApiTest # single test/class
$DOCKER ./vendor/bin/pint                      # PHP formatter
```

Tests use SQLite `:memory:` (configured in `backend/phpunit.xml`) — no DB setup needed.

## Gotchas

- **No root `.env`** — each directory has its own: `backend/.env`, `mobile/.env`, `infra/.env`. Run `make env` to create them from their `.env.example` templates.
- **Vendor volume**: a named Docker volume (`vendor`) shadows `/var/www/html/vendor`. After changing `composer.json`/`composer.lock`: run `composer install` inside the container, or wipe volumes with `make down-v && make up` (wipes pgdata too).
- **Mobile IP**: `make set-ip` / `make dev` auto-updates `EXPO_PUBLIC_API_URL` in `mobile/.env` with your current LAN IP.

## Mobile conventions

- File-based routing via **expo-router**: screens in `mobile/app/` (`(tabs)/`, `auth/`, `driver/`, `requests/`, `trips/`).
- State: Zustand stores in `lib/store/` (`auth.ts`); data fetching: TanStack Query + axios clients in `lib/api/`.
- Styling: NativeWind/Tailwind with brand tokens defined in `tailwind.config.js` (`inhaz.purple` #7928CA, `rounded-sheet` 24px, etc.) and `constants/Colors.ts` — reuse these tokens, don't hardcode colors. Full design system: `tech-spects/design_system.md`.
- Expo APIs change between SDK versions — consult the versioned docs at https://docs.expo.dev/versions/v57.0.0/ before using an Expo module.
- No test/lint scripts exist; typecheck with `npx tsc --noEmit`.

## Development Workflow & User Story Rules

1. **Branch Naming Requirement**:
   - For every User Story (US), a dedicated Git branch MUST be created before starting work.
   - Branch naming format: `<epic>_<us>` (e.g., `1_01` for Epic 1 US 01, `2_05` for Epic 2 US 05, `10_02` for Epic 10 US 02).

2. **Mandatory User Alignment & Pre-Implementation Planning**:
   - **Interactive Alignment (Before Planning)**: Before creating an implementation plan, the assistant MUST ALWAYS ask clarifying questions and establish implementation details, architectural choices, UI designs, and technical constraints with the user. All decisions MUST be explicitly confirmed with the user.
   - **Detailed Implementation Plan**: Once aligned with the user, create a detailed implementation plan (`implementation_plan.md`).
   - **Explicit User Approval**: The assistant MUST wait for explicit user approval on the plan before writing or modifying any implementation code.

3. **Progress Tracking Requirement**:
   - The status and progress of all User Stories MUST be actively tracked and updated in [`dev/implementation_status_and_design_system_matrix.md`](dev/implementation_status_and_design_system_matrix.md). After completing or updating any User Story, update its status (`done`, `done_partial`, `todo`, `blocked`), related files list, and implementation details in this matrix.
