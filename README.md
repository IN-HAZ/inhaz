# inHaz — Urban On-Demand Logistics Monorepo

Welcome to the **inHaz** repository. inHaz is a peer-to-peer (B2C/C2C) urban freight and logistics platform built for urban Morocco, enabling clients to transport bulky goods via an inDrive-style reverse-bidding system.

---

## ⚠️ Important Startup Note

> [!IMPORTANT]
> **This application must be run using Docker & the provided `Makefile`.**  
> Running the backend directly on your host machine will **not** work properly because the application depends on containerized services (PostgreSQL database, Redis cache/queue, Nginx web server, and PHP-FPM worker environment) orchestrated within the `infra/` environment.

---

## 🏗️ Repository Architecture

This repository is structured as a **Unified Monorepo**:

```text
in-haz/
├── Makefile       # Primary command runner for Dev & Production
├── .env.example   # Root environment template (Required for Production Docker setup)
├── backend/       # Laravel API & Filament Admin Back-Office
├── mobile/        # React Native Expo Mobile App (Client & Driver UI)
├── infra/         # Docker Infrastructure, Compose & Nginx configs
├── tech-spects/   # Technical Specification Documents
└── dev/           # Agile Epics & User Stories (Engineering Specs)
```

---

## 🚀 Quick Start (Development Mode)

### Prerequisites
*   [Docker](https://docs.docker.com/get-docker/) & Docker Compose
*   [Node.js](https://nodejs.org/) (v18+) & `npm`
*   `make` utility

### 1. Launch Dev Stack with a Single Command
To start all containerized services (Postgres, Redis, PHP-FPM, Nginx) and boot the Expo mobile dev server:

```bash
make dev
```

*This command automatically executes `docker compose -f infra/docker-compose.dev.yml up -d --build` and starts `cd mobile && npm run start`.*

### 2. Available `Makefile` Commands

| Command | Action |
| :--- | :--- |
| `make dev` | Builds & starts Docker containers in background + runs Expo mobile app in foreground. |
| `make up` | Starts Docker development services in detached mode (`infra/docker-compose.dev.yml`). |
| `make down` | Stops and removes development Docker containers. |
| `make logs` | Streams logs from active development Docker containers. |
| `make build` | Rebuilds development Docker containers. |
| `make prod-up` | Starts Production Docker stack using root `.env` (`infra/docker-compose.prod.yml`). |
| `make prod-down` | Stops Production Docker stack. |

---

## 🔐 Environment Configuration & Root `.env.example`

### Why Root `.env.example` is Required
The `.env.example` file at the root repository directory is **mandatory for production Docker deployment**. 

When running `make prod-up`, Docker Compose loads secrets and credentials from `.env` at the root (`--env-file .env`), passing parameters (`APP_KEY`, `DB_PASSWORD`, `REDIS_PASSWORD`, `CORS_ALLOWED_ORIGINS`) to containerized services:

```bash
# Prepare production environment variables
cp .env.example .env

# Generate app key inside backend and populate .env
# Fill in DB_PASSWORD, REDIS_PASSWORD, CORS_ALLOWED_ORIGINS
```

---

## 📁 Sub-Repository Readmes

*   [Backend (Laravel API) README](backend/README.md)
*   [Mobile App (React Native Expo) README](mobile/README.md)
*   [Infrastructure (Docker Setup) README](infra/README.md)

---

## 📐 Specifications & Development Documentation

### Technical Specifications (`tech-spects/`)
*   [01 System Architecture & Infra](tech-spects/01_system_architecture_and_infra.md)
*   [02 Database Schema & Domain Models](tech-spects/02_database_schema_and_domain_models.md)
*   [03 Auth, Onboarding & Verification](tech-spects/03_auth_onboarding_and_verification.md)
*   [04 Request Creation & Geospatial](tech-spects/04_request_creation_and_geospatial.md)
*   [05 Reverse-Bidding & Negotiation Engine](tech-spects/05_negotiation_and_bidding_engine.md)
*   [06 Trip Execution, Tracking & Chat](tech-spects/06_trip_execution_tracking_and_chat.md)
*   [07 Payments, Commission Ledger & Ratings](tech-spects/07_payments_commission_and_ratings.md)
*   [08 Admin Panel & Filament Back-Office](tech-spects/08_admin_panel_filament_spec.md)
*   [09 Design System & UI/UX Specs](tech-spects/09_design_system_and_ui_ux_spec.md)

### Agile Epics & User Stories (`dev/`)
*   [Epic 01: Core Infra & Auth](dev/epic-01-core-infra-and-auth/README.md)
*   [Epic 02: Driver Onboarding & Verification](dev/epic-02-driver-onboarding-and-verification/README.md)
*   [Epic 03: Request Creation & Geospatial](dev/epic-03-request-creation-and-geospatial/README.md)
*   [Epic 04: Reverse Bidding & Negotiation Engine](dev/epic-04-reverse-bidding-and-negotiation/README.md)
*   [Epic 05: Trip Execution, Tracking & Chat](dev/epic-05-trip-execution-tracking-and-chat/README.md)
*   [Epic 06: Payments, Commission & Ratings](dev/epic-06-payments-commission-and-ratings/README.md)
*   [Epic 07: Admin Back-Office & Governance](dev/epic-07-admin-back-office-and-governance/README.md)
