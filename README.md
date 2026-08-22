# inHaz — Urban On-Demand Logistics Monorepo

Welcome to the **inHaz** official repository. inHaz is a peer-to-peer (B2C/C2C) urban freight and logistics platform built for urban Morocco, enabling clients to transport bulky goods via an inDrive-style reverse-bidding system.

---

## 🏗️ Repository Architecture

This repository is structured as a **Unified Monorepo**:

```text
in-haz/
├── backend/       # Laravel API & Filament Admin Back-Office
├── mobile/        # React Native Expo Mobile App (Client & Driver)
├── tech-spects/   # Technical Specification Documents
├── dev/           # Agile Epics & User Stories (Engineering Specs)
└── infra/         # Docker Infrastructure & Deployment Setup
```

---

## 🚀 Quick Navigation & Documentation

### 📐 Technical Specifications (`tech-spects/`)
*   [01 System Architecture & Infra](tech-spects/01_system_architecture_and_infra.md)
*   [02 Database Schema & Domain Models](tech-spects/02_database_schema_and_domain_models.md)
*   [03 Auth, Onboarding & Verification](tech-spects/03_auth_onboarding_and_verification.md)
*   [04 Request Creation & Geospatial](tech-spects/04_request_creation_and_geospatial.md)
*   [05 Reverse-Bidding & Negotiation Engine](tech-spects/05_negotiation_and_bidding_engine.md)
*   [06 Trip Execution, Tracking & Chat](tech-spects/06_trip_execution_tracking_and_chat.md)
*   [07 Payments, Commission Ledger & Ratings](tech-spects/07_payments_commission_and_ratings.md)
*   [08 Admin Panel & Filament Back-Office](tech-spects/08_admin_panel_filament_spec.md)
*   [09 Design System & UI/UX Specs](tech-spects/09_design_system_and_ui_ux_spec.md)

---

### 📋 Agile Epics & User Stories (`dev/`)
*   [Epic 01: Core Infra & Auth](dev/epic-01-core-infra-and-auth/README.md)
*   [Epic 02: Driver Onboarding & Verification](dev/epic-02-driver-onboarding-and-verification/README.md)
*   [Epic 03: Request Creation & Geospatial](dev/epic-03-request-creation-and-geospatial/README.md)
*   [Epic 04: Reverse Bidding & Negotiation Engine](dev/epic-04-reverse-bidding-and-negotiation/README.md)
*   [Epic 05: Trip Execution, Tracking & Chat](dev/epic-05-trip-execution-tracking-and-chat/README.md)
*   [Epic 06: Payments, Commission & Ratings](dev/epic-06-payments-commission-and-ratings/README.md)
*   [Epic 07: Admin Back-Office & Governance](dev/epic-07-admin-back-office-and-governance/README.md)

---

## 🛠️ Stack Overview

*   **Backend:** PHP 8.2+, Laravel 11, Sanctum, Reverb (WebSockets), Eloquent ORM.
*   **Admin Panel:** Filament v5 (Laravel/Livewire server-rendered back-office).
*   **Mobile App:** React Native, Expo, NativeWind (Tailwind CSS), Zustand, React Query.
*   **Geospatial & Services:** Google Maps Places/Geocoding/Distance Matrix, Redis location caching, S3 bucket storage.

---

## 💻 Getting Started

### 1. Backend Setup
```bash
cd backend
composer install
cp .env.example .env
php artisan key:generate
php artisan migrate --seed
php artisan serve
```

### 2. Mobile App Setup
```bash
cd mobile
npm install
npx expo start
```
