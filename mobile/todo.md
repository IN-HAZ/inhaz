# inHaz Mobile — Refactor & Implementation TODO (Phase A: mobile-only; Phase B: backend-coupled)

> **Scope:** Part A = mobile-only refactor (this round, branch `refactor_phase_a`).
> Part B = backend-coupled tickets, each on its own `<epic>_<us>` branch
> (repo rule: dedicated branch per user story).
>
> After completing or updating any user story, update
> `dev/implementation_status_and_design_system_matrix.md` (status, related files,
> implementation details).

---

## 0. Baseline / rules

-   [ ] Read the current `app/_layout.tsx` completely before changing
    routing/auth logic.
-   [ ] Keep API calls inside `lib/api/<domain>.ts`.
-   [ ] Keep server state in TanStack Query hooks under `lib/hooks/`.
-   [ ] Keep auth/session state in `lib/store/auth.ts`.
-   [ ] Keep UI text in French and prices in MAD.
-   [ ] Backend remains the source of truth for authorization and driver
    verification state.
-   [ ] Do not add new Context state for auth; use the existing Zustand
    auth store.
-   [ ] Do not introduce inline `style` / `StyleSheet.create()` outside
    styling files.
-   [ ] No hardcoded styles outside styling files: all shared custom
    Tailwind classes live in one global `global.css` (`@layer components`);
    component-specific styling lives in styling files beside the
    component; the only inline exception is runtime geometry on native
    map/animation primitives (map `edgePadding`, `anchor`, animated
    values, dynamic offsets).
-   [ ] Mock rule: mock data exists **only** for endpoints that do not
    exist yet, lives exclusively under `lib/api/mock/`, is toggled by the
    `EXPO_PUBLIC_USE_MOCK` flag, is never inlined in screens/components,
    and is easy to remove.
-   [ ] Only 6 Inter weights are loaded at boot: regular (400), medium
    (500), semibold (600), bold (700), extrabold (800), black (900).
    Thin/extralight/light are unused — do not re-add them.
-   [ ] Role guard is two-tier: **area** access by role/persona, **feature**
    access by driver verification state (backend-driven, never assumed
    locally).
-   [ ] Scope split: Part A is mobile-only; anything requiring a backend
    change belongs to Part B.

------------------------------------------------------------------------

# Part A — Mobile-only refactor (this round)

## 1. Styling migration — Tailwind only

### 1.1 Establish styling conventions

-   [x] Make Tailwind/NativeWind the only styling system for application
    UI.
-   [x] Remove component-level `StyleSheet` usage from
    screens/components.
-   [x] Do not put hardcoded style objects inside `.tsx` files.
-   [x] Use only `className` with Tailwind/custom classes in components.
-   [x] Keep styling definitions beside the component when they are
    component-specific.
-   [x] Keep all shared/reused custom classes in a single global styling
    file: `global.css`.
-   [x] Keep design tokens in `tailwind.config.js`.

### 1.2 Custom class system

-   [x] Define reusable semantic classes for repeated UI patterns in
    `global.css` (`@layer components`), for example:
    -   `btn-primary`
    -   `btn-secondary`
    -   `btn-outline`
    -   `btn-danger`
    -   `input-default`
    -   `card-default`
    -   `screen-container`
    -   `section-title`
    -   `text-muted`
    -   `badge-success`
    -   `badge-warning`
    -   `badge-error`
-   [x] Prefer semantic custom classes over repeating long Tailwind
    class strings.
-   [x] Add any other repeated patterns found during the sweep (e.g.
    sheet drag handle, nav header, list card).
-   [x] Refactor `components/ui/*` (Button, Input, Card, Badge,
    Toast/ToastProvider) to consume only the semantic classes; delete
    their variant/`StyleSheet` maps.
-   [x] Refactor in dependency order: `components/requests/*` →
    `app/auth/*` → `app/(tabs)/*` (before deletion) → `app/driver/*` →
    `app/requests/*` → `app/trips/*` → `app/documents/[id]`.
-   [x] Refactor the map UI styles where practical.
-   [x] Map carve-out: keep runtime geometry inline only in `BaseMap`,
    `RecenterButton`, `LiveDriverLayer`, and the wizard's animated sheet;
    all other map components use `className` (layout via Tailwind).
-   [x] Search the whole project for `StyleSheet`, `style={{`, and
    static `style=` usages.
-   [x] Remove all styling outside styling files.
-   [x] Remove `constants/Colors.ts` usages (file is deleted in §4) —
    replace with design tokens.

### 1.3 Styling validation

-   [ ] Verify Android.
-   [ ] Verify iOS if available.
-   [ ] Verify web if web support is still required.
-   [ ] Verify no visual regressions in buttons, inputs, cards, maps,
    sheets, badges, and tabs.

> W1 2026-09-21: styling sweep delivered. §1.3 device verification
> (Android/iOS/web + visual regression) cannot run in this environment —
> needs a device/emulator. Remaining inline styles are only the §0
> runtime-geometry exception (map `edgePadding`/`anchor`/animated values/
> dynamic offsets): map preview heights (dynamic props), wizard sheet
> animated `top`/`bottom`, onboarding progress width, Toast opacity,
> RecenterButton position, LiveDriverLayer transform, lucide color props.

------------------------------------------------------------------------

## 2. Boot sequence / startup optimization

### 2.1 Fonts

-   [x] The app loads 9 Inter weights today; only 6 are used: regular
    (400), medium (500), semibold (600), bold (700), extrabold (800),
    black (900). Thin/extralight/light are unused (verified).
-   [x] Keep only those 6 weights in `useFonts()`; remove thin,
    extralight, light.
-   [x] Remove the `fontFamily` keys for the removed weights from
    `tailwind.config.js` so they cannot reappear.
-   [ ] Verify fallback behavior if a weight is removed.
-   [ ] Measure startup before/after the font reduction.

### 2.2 Root layout

-   [x] Keep the root layout as lightweight as possible.
-   [x] Avoid doing feature-specific initialization in
    `app/_layout.tsx`.
-   [x] Keep `QueryClientProvider` and global providers here.
-   [x] Keep auth restoration here.
-   [x] Remove the boot-time location permission request
    (`useAppPermissions`) from the root layout — location permission
    moves to the client/driver home screens (§7/§9).
-   [x] Do not request camera permission during app startup (feature-time
    only, see §3).

### 2.3 Auth restoration

-   [x] Keep `checkAuth()` as the session restoration mechanism.
-   [x] Add an explicit auth loading state to prevent premature
    redirects.
-   [x] Make routing wait until auth restoration finishes.
-   [x] Avoid redirect loops caused by the Axios 401 handler + router
    guard: wire `onUnauthenticated()` from `lib/api/client.ts` into the
    store/root layout so a mid-session 401 clears the session and routes
    to `/auth/login`.

> W2 2026-09-21: boot sequence delivered. `app/_layout.tsx` loads only the
> 6 used Inter weights; `tailwind.config.js` `fontFamily` keys for the
> removed weights deleted; boot-time `useAppPermissions()` removed (location
> stays feature-time in `driver/dashboard.tsx` + wizard until W8/W9 move it
> to the home maps; camera never at boot). Explicit auth-restoration guard
> uses the store `isLoading`; 401 → `onUnauthenticated()` → store
> `resetAuth()` → guard routes to `/auth/login`. `npx tsc --noEmit` passes.
> Device-dependent items left open below: cold-start measurement
> before/after and font-fallback verification (§2.1 last two items).

------------------------------------------------------------------------

## 3. Permissions

### 3.1 Permission architecture

-   [x] Extend `lib/permissions.ts` to support camera and media-library
    permissions (via the expo-image-picker permission APIs: request/get,
    `canAskAgain`).
-   [x] Add an "Open Settings" helper (native app settings) and a
    re-check helper for returning from settings.
-   [x] Keep permission logic centralized.
-   [x] Do not request feature-specific permissions globally at boot
    unless required.
-   [ ] Location permission is requested on entering the client home /
    driver home (map-first screens), not at boot.

### 3.2 Camera permission UX

-   [x] Request camera permission when entering a feature that requires
    the camera (feature-time only).
-   [x] If permission is denied, show a clear explanation that camera
    access is required for the feature.
-   [x] Provide an "Open Settings" action.
-   [x] Open the native app settings using the appropriate Expo API.
-   [x] On returning to the app, re-check the camera permission.
-   [x] If permission is still denied, keep the feature unavailable.
-   [x] Avoid repeatedly triggering the native permission dialog after
    the user has permanently denied it (blocked → message + Settings
    button only, no dialog loop).
-   [x] Add a `useCameraPermission(featureKey)` hook owning the state
    machine; integrate it at the only two camera touchpoints: profile
    photo capture (client + driver onboarding, §6 — lands with the §6
    screens in W7) and step-2 package photos (§8 — integrated today in
    `app/requests/create.tsx`, carried into the RequestWizard).
-   [ ] Handle:
    -   first request
    -   denied
    -   denied again / blocked
    -   granted
    -   returning from settings

> W3 2026-09-22: permission infrastructure delivered. `lib/permissions.ts`
> gains camera + media-library request/get helpers and `openAppSettings()`
> (expo-linking `openSettings`); new `lib/hooks/useCameraPermission.ts`
> owns the state machine (`undetermined` → `granted` / `denied-can-ask` /
> `blocked`), passive mount sync, AppState return-from-settings re-check,
> and a per-feature permanent-denial registry so the native dialog is never
> re-opened after blocking. Integrated at the Step-2 package photos
> touchpoint in `app/requests/create.tsx` (featureKey
> `request-package-photos`, reused by the W8 RequestWizard): granted →
> launch, denied → French explanation + retry, blocked → French message +
> "Ouvrir les réglages". The gallery path stays best-effort (system picker
> needs no permission on modern Android/iOS). Profile-photo touchpoint
> lands with onboarding in W7. Location-on-home integration is staged for
> W8/W9. `npx tsc --noEmit` passes. Device verification of the full matrix
> (first request / denied / blocked / settings-return / granted + no camera
> permission at boot) still requires a device/emulator.

------------------------------------------------------------------------

## 4. Remove Expo template leftovers

Delete the legacy components/hooks after fixing their consumers:

-   [x] `components/Themed.tsx`
-   [x] `components/StyledText.tsx`
-   [x] `components/ExternalLink.tsx`
-   [x] `components/EditScreenInfo.tsx`
-   [x] `components/useColorScheme.ts`
-   [x] `components/useClientOnlyValue.ts`
-   [x] `constants/Colors.ts` if no longer referenced
-   [x] Delete `app/modal.tsx` (template-only content) and remove its
    Stack entry from the root layout.
-   [x] Replace `app/+not-found.tsx` legacy imports with plain RN
    `Text`/`View` + Tailwind classes.
-   [x] Replace legacy component usage with the current UI kit/Tailwind
    classes.
-   [x] Remove dead imports.
-   [x] Search for remaining references before deleting files.
-   [x] Run TypeScript after cleanup.

> W4 2026-09-22: code was already delivered inside the W1 sweep
> (template modules deleted, `app/modal.tsx` + Stack entry removed,
> `+not-found.tsx` rewritten plain RN, `constants/Colors.ts` gone). This
> pass re-verified and ticked the §4 checklist: zero references to any
> deleted module across `app/` + `components/` + `lib/`; `npx tsc --noEmit`
> passes. No code change.

------------------------------------------------------------------------

## 5. Auth architecture + role guards

### 5.1 User/role model

-   [x] Use the existing Zustand auth store.
-   [x] Define the supported roles explicitly:
    -   `client`
    -   `driver`
-   [x] Keep role information in the authenticated `user`.
-   [x] Do not duplicate role state in screens.
-   [x] Extend the auth store `User` type with `driver_profile` (id,
    status `PENDING`/`APPROVED`/`REJECTED`, rejection_reason) — `GET /me`
    already returns it; parse it in `checkAuth()`/`setSession()`.
-   [x] Add store selectors: `isClient`, `isDriver`, `driverStatus`,
    `isDriverApproved`.
-   [x] Role guard is two-tier: tier 1 = area access (role/persona);
    tier 2 = feature access (driver verification state).
-   [x] Driver applicants get `role=driver` with a non-approved status
    only after backend ticket B1; the mobile logic must keep working with
    both today's and the future model (role OR driver_profile presence).

### 5.2 Route groups

Refactor the Expo Router structure toward:

``` text
app/
├── _layout.tsx
├── auth/                      (login, otp, role-choice)
├── onboarding/                (apply, onboarding, vehicle — run before a driver_profile exists)
├── (client)/
│   ├── _layout.tsx            Tabs (Home map, Demandes, Profil)
│   ├── index.tsx              client home map
│   ├── requests/              (index, [id], offers/[id], create → wizard overlay)
│   └── profile.tsx
├── (driver)/
│   ├── _layout.tsx            Tabs (Accueil map, Marketplace, Profil)
│   ├── index.tsx              driver home map (dashboard summary moves to profile/compact header)
│   ├── marketplace/
│   ├── documents/
│   └── profile.tsx
├── documents/
│   └── [id].tsx               shared viewer
├── trips/                     shared by both roles
└── ...
```

-   [x] Create the client route group (`app/(client)/_layout.tsx`).
-   [x] Create the driver route group (`app/(driver)/_layout.tsx`).
-   [x] Move role-specific screens into the appropriate group.
-   [x] Keep genuinely shared authenticated screens outside
    role-specific groups: `auth/`, `trips/`, `documents/[id]`,
    `onboarding/` (apply/onboarding/vehicle).
-   [x] The `(client)`/`(driver)` groups do not change URLs.

### 5.3 RoleGuard

-   [x] Create `components/auth/RoleGuard.tsx`.
-   [x] Tier 1 (area): guard unauthenticated users → `/auth/login`.
-   [x] Tier 1 (area): guard authenticated users with the wrong role →
    route to that role's home (no separate unauthorized screen needed).
-   [x] Tier 2 (features, driver): pending/rejected drivers may enter
    the driver area, but every restricted action renders disabled with a
    French explanation ("Vérification en cours", or the rejection reason
    when supplied).
-   [x] Prevent rendering protected content before auth state is known.
-   [x] Apply `RoleGuard` at route-layout level instead of duplicating
    checks in every screen.
-   [x] Keep backend authorization independent from the client guard
    (backend 403s remain authoritative).

### 5.4 Root routing

-   [x] Update `app/_layout.tsx` to handle:
    -   auth loading
    -   unauthenticated state
    -   authenticated client
    -   authenticated driver
-   [ ] Authenticated users with an incomplete persona route to
    `/auth/role-choice` (§6.2) instead of a home screen.
-   [x] Remove old `(tabs)`-based role routing once the new structure is
    stable (including the `two.tsx` redirect stub).
-   [x] Avoid imperative navigation chains after login when route state
    can determine the destination.

------------------------------------------------------------------------
> W5 2026-09-22: auth store gains `driver_profile` on `User` (parsed + normalized
> in `checkAuth`/`setSession`; `verify-otp` does NOT load it, so `auth/otp.tsx`
> refreshes `/me` right after login) and role selectors (`selectIsDriver`,
> `selectIsClient`, `selectDriverStatus`, `selectIsDriverApproved` +
> `useRole()`). `components/auth/RoleGuard.tsx` guards at layout level
> (unauth → `/auth/login`, wrong persona → own home, `null` until auth known).
> Routes restructured: `(client)/` (index, requests/*, profile) and `(driver)/`
> (index, marketplace/*, documents/*, profile, dashboard) tab groups; shared
> screens stay outside (`auth/`, `trips/`, `documents/[id]`, onboarding at
> `app/driver/*`); `app/(tabs)/` + `two.tsx` deleted. URLs are unchanged by the
> groups. Per-screen role redirects removed (done-criteria: none remain).
> Tier-2 driver verification is exposed via selectors + a status pill on the
> driver home; per-feature disabled actions deepen in W7/W9. Left unticked:
> `§5.4` role-choice routing (screen ships in W7) and the B1 backend-role note
> (out of scope). Cold-start `/` resolves to `(client)` first (alphabetical);
> its guard bounces drivers to `/(driver)` — same shape the 2025 refactor used.
> ⚠️ device checks (fresh-login landings, pending-driver gate) pending emulator.

--------------------------------------------------------------------

## 6. New authentication/onboarding flow

### 6.1 Initial authentication

Required flow:

``` text
Open app
  ↓
Phone number
  ↓
Send OTP
  ↓
Validate OTP
  ↓
Choose role
  ├── Client
  └── Driver
```

-   [x] Keep phone validation with Zod.
-   [x] Keep OTP validation with Zod.
-   [x] Verify OTP through the Laravel API.
-   [x] Store the returned session through `authStore.setSession()`.
-   [x] After OTP success, route to `/auth/role-choice` only when the
    persona is incomplete (no name set, no role chosen, no driver
    profile); otherwise go straight to the role home.

### 6.2 Role selection

-   [x] Add a role-choice screen after OTP verification when the user
    has not selected a role (`app/auth/role-choice.tsx`).
-   [x] Add `client` and `driver` choices (two large buttons:
    Client / Chauffeur).
-   [x] Persist the role through the backend — real persistence is Part B
    (backend ticket); in Phase A use the mock seam where the backend path
    is missing.
-   [x] Refresh `/me` after the role change.
-   [x] Route to the corresponding onboarding flow (client → §6.3,
    driver → §6.4).

### 6.3 Client onboarding

``` text
Role = Client
  ↓
Full name
  ↓
Profile photo
  ↓
Client home
```

-   [x] Create client onboarding screen/state.
-   [x] Save full name through the backend (PUT /me).
-   [x] Upload profile photo (camera/media per §3) — upload goes through
    the mock seam until the backend photo endpoint exists (ticket B5).
-   [x] Refresh authenticated user.
-   [x] Enter client home only when required profile data is complete.

### 6.4 Driver onboarding

``` text
Role = Driver
  ↓
Full name
  ↓
Profile photo
  ↓
Vehicle
  ↓
Required documents
  ↓
Manual verification message
  ↓
Driver home
```

-   [x] Reuse the existing driver onboarding components/API where
    possible.
-   [x] Collect:
    -   full name
    -   profile photo
    -   car model
    -   car color  (backend `color` field is ticket B6; send as an extra
        field for now)
    -   plate number
    -   required documents
-   [x] Preserve document status and expiry handling.
-   [x] Show a manual verification message after submission (documents
    under manual review).
-   [x] Route the driver to the driver home after onboarding submission.

### 6.5 Driver verification state

-   [x] Define the backend-driven verification states in the mobile
    types.
-   [x] Never locally assume that a driver is approved.
-   [x] Fetch/refresh driver verification status from the backend
    (`/me` → `driver_profile`).
-   [x] Disable driver marketplace/offer/trip actions while the driver
    is not approved.
-   [x] Keep profile and status visibility available.
-   [x] Show the verification/rejection reason when supplied by the
    backend.
-   [x] Handle approval changes after app restart/resume/refetch (refresh
    the driver-status query key).

> W7 2026-09-22: new authentication + onboarding flow (branch `refactor_phase_a`).
> §6.1 — `app/auth/otp.tsx` routes incomplete personas (no name, no role
> chosen, no driver profile) to `/auth/role-choice`; a mid-flight driver
> application (driver_profile without name) continues into
> `/onboarding/driver`. Complete personas still skip to their role home.
> §6.2 — `app/auth/role-choice.tsx` (Client / Chauffeur). No backend
> persistence call in Phase A: the persona is persisted through the outcome
> of the ensuing onboarding (client → `PUT /me` name; driver → apply →
> driver_profile), and `/me` refreshes via `setUser`/focus-refetch. The
> backend `role` field only moves to `driver` at approval (B1), so nothing
> calls `switchRole` here yet.
> §6.3 — `app/onboarding/client.tsx`: name (required, PUT /me) + optional
> avatar via the new `lib/hooks/useProfilePhoto.ts` (gallery/camera behind
> the W3 state machine; upload through the mock seam until B5 — a failed
> upload never blocks entry); on success → `setUser` → `/(client)`.
> §6.4 — driver wizard moved to `app/onboarding/driver.tsx` (the W5
> deferred `app/onboarding/` grouping); orphaned `app/driver/apply.tsx` +
> `app/driver/vehicle.tsx` deleted (their steps live inside the wizard).
> Step 2 gains the avatar, step 3 gains "Couleur" sent as an extra
> `color` field (B6), `handleFinish` now replaces to `/(driver)` home.
> §6.5 — driver home (`(driver)/index.tsx`) shows a verification banner
> (with backend rejection reason) and gates Dashboard/Marketplace behind a
> French "Vérification en cours" toast while unapproved; Documents/Profil
> stay reachable. `useFocusEffect` re-fetches `/me` while unapproved so an
> approval picked up on focus/return updates the pill.
> Root gate: `selectPersonaComplete` added to the auth store; the
> `_layout.tsx` gate now lets incomplete personas sit inside the `auth`
> group (so `/auth/role-choice` isn't bounced home) while complete ones
> still bounce straight to their role home. Route types in
> `.expo/types/router.d.ts` hand-synced (gitignored).
> ⚠️ Device-verification pending (no emulator): role-choice visuals,
> client/driver onboarding photo flows (camera/denied/blocked paths),
> pending-gate toasts, fresh-login landings. Live-approval refresh is
> focus-time only (no push), noted for W9. Documents list keeps status
> (APPROVED/PENDING/REJECTED); expiry stays backend-driven (no expiry
> field in the backend documents shape today).

------------------------------------------------------------------------

## 7. Client home

Target:

``` text
┌──────────────────────┐
│                      │
│        MAP           │
│                      │
│  current location    │
│  nearby drivers      │
│                      │
├──────────────────────┤
│ Create request       │
└──────────────────────┘
```

-   [x] Make the client home primarily a map screen.
-   [x] Request location permission on entry; show current client
    location.
-   [x] Show nearby available drivers — from the mock data layer in
    Phase A (real endpoint is backend ticket B3); the layer/marker code
    is identical either way.
-   [x] Add/reuse `DriversLayer`.
-   [x] Add a bottom action ("Créer une demande") to start request
    creation.
-   [x] Keep the map mounted while the request flow is active.
-   [x] Avoid recreating the map unnecessarily during request steps.
-   [x] Keep map state/camera stable while the request sheet changes.

> §7 — `app/(client)/index.tsx` is now the map-first home. It owns the
> single `RequestMap` instance (BaseMap + CurrentLocationLayer +
> DriversLayer + route/pin layers), requests GPS on entry (permission +
> Balanced accuracy, never at boot), auto-centers once, seeds nearby
> drivers from the mock seam (`driverApi.nearbyDrivers`, mapped to
> `NearbyDriverMarker[]`; returns `[]` with the mock flag off), and keeps
> the map mounted while the wizard overlays it. Recenter was fixed (W8):
> it now always re-centers the camera on the current location instead of
> the old no-op once a fix had a location. The `/?create=1` intent param
> (used by the requests list) auto-opens the wizard.

------------------------------------------------------------------------

## 8. Client request flow over the home map

Current request flow already has the 5-step wizard:

``` text
Locations
→ Package
→ Vehicle
→ Pricing
→ Review
```

-   [x] Separate request wizard UI/state from the map container.
-   [x] Move map ownership to the client home screen/container.
-   [x] Render the request wizard as an overlay/bottom sheet above the
    existing map — the map does not remount between wizard steps.
-   [x] Suggested structure (extract from `app/requests/create.tsx`):

``` text
components/requests/
├── RequestWizard.tsx        (step state, draft id, validation, publish)
├── RequestWizardSheet.tsx   (draggable bottom sheet, snap points, keyboard)
├── Step1Locations.tsx
├── Step2Package.tsx
├── Step3Vehicle.tsx
├── Step4Pricing.tsx
├── Step5Review.tsx
└── types.ts
```

-   [x] Reuse the existing `RequestMap` layers/configuration where
    appropriate.
-   [x] Keep the same map instance mounted during the wizard; the wizard
    receives a handle/interface to drive map interactions for step 1
    only (pickup pin, destination pin, route, location search).
-   [x] Let later steps reduce/disable map interaction when appropriate.
-   [x] Preserve the current draft API behavior.
-   [x] Preserve live `patchStep()` behavior.
-   [x] Preserve photo upload flow (camera per §3, with retry/failure
    states).
-   [x] Preserve camera/map fitting behavior.
-   [x] Remove map responsibilities from `requests/create.tsx`.
-   [x] Delete `app/requests/create.tsx` once migrated — the entry point
    becomes the home button (§7).
-   [x] Split the current 644-line screen into smaller components/hooks.

> §8 — The 651-line wizard screen was split into `RequestWizard.tsx`
> (state owner: draft, 5-step state, stops/search/pin-apply, photo
> capture/upload/retry, `patchStep`, validation, publish) and
> `RequestWizardSheet.tsx` (draggable bottom sheet, snap points, keyboard,
> nav buttons) on top of the existing presentational `Step1Locations`…
> `Step5Review`. The wizard never mounts a map: it receives the home's
> `mapRef` (fit camera / `fitToCoordinates`) plus `currentLocation`, and
> pushes a `RequestWizardMapView` (`region`, `markers`, `polyline`,
> `bottomPadding`, per-step `onMapPress`) up through `onMapViewUpdate` —
> so the home's map instance is shared, never remounted, and camera
> behavior matches the old screen (single-stop center, multi-stop
> fit-to-coordinates with sheet padding). Step 1 keeps tap-to-pin;
> steps 2–5 disable map taps. `app/(client)/requests/create.tsx` is
> deleted (tab entry + route types updated); entry points are the home
> "Créer une demande" button and the requests list via `/?create=1`.
> ⚠️ Device-verification pending (no emulator): map-first landing,
> wizard-over-map visuals, snap/keyboard feel, recenter fix,
> intent-param auto-open.

------------------------------------------------------------------------

## 9. Driver home

Target:

``` text
┌──────────────────────┐
│                      │
│        MAP           │
│                      │
│   nearby requests    │
│                      │
├──────────────────────┤
│ Live requests        │
│ ┌──────────────────┐ │
│ │ Request 1        │ │
│ ├──────────────────┤ │
│ │ Request 2        │ │
│ ├──────────────────┤ │
│ │ Request 3        │ │
│ └──────────────────┘ │
└──────────────────────┘
```

-   [x] Make driver home map-first.
-   [x] Request location permission on entry; show current location.
-   [x] Show nearby open requests on the map — from the mock data layer
    in Phase A (real endpoint + broadcasts are backend tickets B4/B7/B8);
    the layer/marker code is identical either way.
-   [x] Create a request marker/layer for the map (`NearbyRequestLayer`).
-   [x] Make markers open request details.
-   [x] Replace the current dashboard-first home experience (dashboard
    summary — earnings, online toggle — moves to the profile area or a
    compact header; online toggle stays functional).
-   [x] Bottom live list (max 3 requests) fed by the realtime hook (§10).
-   [x] Keep driver profile/status accessible separately.
-   [x] Disable request interaction while driver verification is not
    approved.

> W9 2026-09-23: driver home rewritten map-first. Single `DriverHomeMap`
> (BaseMap + CurrentLocationLayer + `NearbyRequestLayer`) under a header
> overlay; GPS via shared `lib/hooks/useLocationOnEntry.ts` (also used by the
> client home — one permission-prompt/first-fix implementation). Baseline
> markers come from the new `requestsApi.nearbyRequests` seam (mock-backed
> `mockNearbyRequests`, geo `NearbyRequest` shape — `browseWithGeo` returns
> `BrowseRequest` with no map coordinates, so it can't feed markers; returns
> `[]` with the mock flag off). Approved: compact dashboard strip (greeting +
> status dot + online toggle + gains/courses/commission + "Résumé" →
> `/driver/dashboard`) and the floating max-3 live list (newest-first by
> `created_at`, opened from map marker or list tap). Unapproved: W7 banner
> over a read-only map — markers visible, taps no-op, no live list; profile +
> documents reachable (header icons + banner button). Realtime churn merges
> into the same cache key (§10). Unticked device items: map-first landing,
> live-feed churn, banner/strip/list spacing — emulator pending.

------------------------------------------------------------------------

## 10. Driver realtime request feed — infra + mock source

Echo/Pusher dependencies exist but are not wired into the application.

-   [ ] Implement the Echo connection + subscription infra in
    `lib/api/echo.ts` (single-connection singleton) against a swappable
    event-stream interface.
-   [x] Phase A wires the interface to a mock event source
    (`lib/api/mock/realtime.ts`: timer-driven realistic fake events,
    env-flag toggled, never inline).
-   [ ] Swapping to real Laravel broadcasts is a Phase B change (B8):
    wire the interface to the real channel, delete the mock.
-   [ ] Define the backend broadcast events required for nearby request
    updates (backend contract, Part B).
-   [x] Subscribe only while the driver home is active and eligible.
-   [x] Unsubscribe when leaving the screen.
-   [x] Avoid creating multiple Echo connections/subscriptions.
-   [x] Deduplicate incoming requests.
-   [x] Update the TanStack Query cache when a realtime event arrives.
-   [x] Keep the list capped at 3 requests.
-   [x] Sort/update the list according to the backend event data.
-   [x] Remove expired/claimed/cancelled requests from the live list.
-   [x] Update map markers from the same source of state.
-   [ ] Handle reconnect/disconnect.
-   [ ] Refetch authoritative data after reconnect.
-   [x] Do not treat WebSocket state as the backend source of truth.

Desired flow:

``` text
event source (mock in Phase A / Laravel broadcast in Phase B)
      ↓
Echo/Pusher (interface)
      ↓
realtime hook
      ↓
TanStack Query cache
      ├── nearby request markers
      └── max-3 bottom list
```

> W6 2026-09-22: the swappable event interface + mock source landed early as
> `lib/api/feed.ts` (`subscribeLiveFeed`, env-flag toggled) + `lib/api/mock/feed.ts`
> (timer-driven fake events, ~12s cadence) — file name differs from the fiche's
> `mock/realtime.ts`; nothing calls it yet (W9 home / W10 hook wiring). Unticked:
> Echo/pusher-js singleton (`lib/api/echo.ts` stays dead until Phase B B8) and all
> subscribe/unsubscribe/cache bullets (W10).
>
> W9 2026-09-23: the home now consumes it — `lib/hooks/useRealtimeRequests.ts`
> subscribes through `subscribeLiveFeed` ONLY while the driver home is focused
> AND the driver is approved (single subscription via a ref — no duplicates),
> unsubscribes on leave/unapprove, applies every event to the TanStack cache.
> `FeedEvent` extended with structured payloads: `new_request` carries a
> `NearbyRequest` (merged into `queryKeys.nearby.requests`, deduped);
> `request_claimed` / `request_cancelled` carry `request_id` (dropped from the
> set + the `detail-for-driver` key invalidated); `offer_update` / `trip_event`
> are pure notification events. Mock feed rewritten to a scripted ~8s scene
> (ids 811–815 rotate in/out + seeded 801/802 drain) for visible churn in the
> max-3 list and markers. Unticked here: `lib/api/echo.ts` singleton wiring
> (reconnect/disconnect + `disconnectEcho` on logout land with Phase B B8 — the
> mock source never drops); the live-feed is a cache mutation, never the source
> of truth (baseline `nearbyRequests` query + detail/browse refetches stay
> authoritative).

------------------------------------------------------------------------

## 11. Driver request interaction

-   [x] Tap map marker → open request detail.
-   [x] Tap bottom-list item → open request detail.
-   [x] Show request details.
-   [x] Fetch detail via a `getForDriver` API method — mock-backed in
    Phase A; real driver-accessible endpoint is backend ticket B2.
-   [x] Replace the current `marketplace/[id].tsx` page-1 `.find()` hack
    when the backend detail endpoint is available (ticket B2).
-   [x] Allow counter-offer when driver is eligible.
-   [ ] Allow direct acceptance when supported by the backend.
-   [x] Invalidate/update relevant request and offer queries after an
    action.
-   [x] Prevent actions when driver verification is not approved.
-   [x] Handle request becoming unavailable while the driver is viewing
    it.

> W6 2026-09-22: `requestsApi.getForDriver(id)` shipped (mock-backed
> `mockRequestDetailForDriver`; real mode falls back to the browse list until
> B2 — that fallback now lives in the module, not the screen). The
> `marketplace/[id].tsx` page-1 `.find()` hack is gone; it calls
> `getForDriver` under `queryKeys.requests.detailForDriver(id)`. Unticked:
> counter-offer/direct-acceptance action flows (W7+).
>
> W9 2026-09-23: interaction flows completed — map marker taps and live-list
> rows both open `/driver/marketplace/{id}` (`openRequest` gated to approved
> drivers); the detail form is gated (approved → offer form with custom price
> + message; unapproved → "Vérification en cours" card) so no counter-offer is
> possible while unverified. Offer `onSuccess` now invalidates browse /
> browseWithGeo / `nearby.requests` / detail / offers keys. "Became unavailable
> while viewing": `request_claimed`/`request_cancelled` events invalidate the
> `detail-for-driver` key → refetch slug falls into the new "Demande
> indisponible" error state (mock detail throws for non-seed ids; seeds still
> resolve until B2's authoritative store). Direct acceptance stays unticked —
> requires a backend action endpoint (Phase B, not in W9 scope).

------------------------------------------------------------------------

## 12. Map architecture

-   [x] Keep `BaseMap` domain-agnostic.
-   [x] Keep map layers presentational.
-   [x] Create a dedicated client-home map composition.
-   [x] Create a dedicated driver-home map composition.
-   [x] Add a `NearbyRequestLayer`.
-   [x] Reuse `CurrentLocationLayer`.
-   [x] Reuse `DriversLayer` for the client.
-   [x] Avoid duplicated MapView implementations.
-   [x] Delete `MapRenderer.tsx` and `MapRendererProps.ts` once all
    callers migrate (do not keep them as a permanent shim).
-   [x] Remove unused map variants after confirming they are no longer
    needed (delete in this round; recreate from `BaseMap` when a feature
    actually needs them):
    -   `LiveTrackingMap`
    -   `MarketplacePreviewMap`
    -   `TripRouteMap`

> W9 2026-09-23: `components/map/variants/DriverHomeMap.tsx` joins `RequestMap`
> (W8) as the second dedicated home composition — both are thin compositions of
> `BaseMap` + presentational layers + `RecenterButton`, no duplicated MapView.
> New `components/map/layers/NearbyRequestLayer.tsx` (package-chip markers +
> price badge + pickup→destination callout, tap → parent callback) follows the
> `DriversLayer` convention and consumes the new `NearbyRequestMarker` type in
> `core/BaseMapTypes.ts`. `CurrentLocationLayer` is reused by both homes. The
> W10 deletions stay pending: `MapRenderer.tsx`/`MapRendererProps.ts` shims and
> `MarketplacePreviewMap`/`TripRouteMap`/`LiveTrackingMap` all still exist on
> disk but have zero remaining imports (verified project-wide grep) — removal
> is planned in W10 per `plan.md`.
>
> W10 2026-09-23: §15 sweep executed — `MapRenderer.tsx`/`MapRendererProps.ts`
> shims deleted, `MarketplacePreviewMap`/`TripRouteMap`/`LiveTrackingMap`
> deleted, `layers/LiveDriverLayer.tsx` deleted (only `LiveTrackingMap` used
> it). Remaining map surface: `BaseMap`, `BaseMapTypes`, `mapStyles`,
> `RecenterButton`, layers `CurrentLocationLayer`/`DriversLayer`/
> `NearbyRequestLayer`/`RouteMarkersLayer`/`PolylineLayer`, variants
> `RequestMap`/`DriverHomeMap`/`DashboardMap` — every one referenced.

------------------------------------------------------------------------

## 13. Data/cache architecture

-   [x] Define stable React Query keys for:
    -   current user
    -   driver profile/status
    -   nearby drivers
    -   nearby requests
    -   live feed
    -   requests
    -   offers
    -   trips
-   [x] Update cache directly for realtime events where possible.
-   [x] Invalidate authoritative queries after mutations.
-   [ ] Avoid unnecessary polling where WebSocket events provide
    equivalent updates.
-   [x] Keep polling for data that does not have realtime events yet.
-   [x] Avoid fetching the same data independently from multiple
    screens.

------------------------------------------------------------------------
> W6 2026-09-22: canonical keys live in `lib/api/queryKeys.ts` (`queryKeys.*`)
> with a header inventory; all hooks (`useDriverDashboard`, `useDeliveryRequests`,
> `useRequestDetail`, `useBrowseRequests`, `useTripDetails`,
> `useDriverTrips`/`useClientTrips`) and screen-level queries (`trips/index`,
> `marketplace/index` via the shared `useBrowseRequests` hook) now derive keys
> from it. Mutation `onSuccess` handlers invalidate via those keys (offers/trips
> transitions, dashboard toggles). Unticked: realtime cache updates (§10 wires
> `subscribeLiveFeed` → cache in W9/W10) and polling-reduction trade-offs
> (behavioral).
>
> W9 2026-09-23: realtime cache updates landed — `useRealtimeRequests` reads +
> writes `queryKeys.nearby.requests` (single cache owner: the driver home's
> baseline query fetches, the feed mutates it in place, the home derives both
> markers and the max-3 list from that one source) and appends to
> `queryKeys.feed.live`. Detail/browse invalidation after an offer submission
> covers all driver-facing keys. Polling: dashboard summary keeps its 10s poll
> (no realtime events for it yet — B8), while the nearby set relies on the feed
> instead of polling. "Avoid unnecessary polling" stays unticked until the real
> channel exists (Phase B B8).

------------------------------------------------------------------------

## 14. API consistency

-   [x] Move direct `apiClient` calls from screens into typed API
    modules (`lib/api/auth.ts`, `lib/api/documents.ts`, `lib/api/driver.ts`,
    `lib/api/requests.ts`).
-   [x] Complete missing driver/document API types.
-   [x] Add API methods for new onboarding/role endpoints.
-   [x] Add API methods for nearby drivers/requests as placeholders —
    mock-backed in Phase A, real endpoints in Phase B (B3/B4).
-   [x] Add API methods for verification status (`/me` → `driver_profile`).
-   [x] Add API methods for profile photo upload — mock-backed until
    backend endpoint exists (B5).
-   [x] Add API methods for request acceptance/counter-offers as
    required.
-   [x] Add a `getForDriver` request-detail method — mock-backed until
    backend permission exists (B2).
-   [x] Create `lib/api/mock/*`: typed fakes for nearbyDrivers,
    nearbyRequests, realtime feed, photo upload, requestDetail — all
    behind the `EXPO_PUBLIC_USE_MOCK` flag; each typed module branches
    real-vs-mock at exactly one seam.
-   [x] Keep backend response types explicit.
-   [x] Use `getErrorMessage()` consistently.

------------------------------------------------------------------------
> W6 2026-09-22: screens hold zero direct HTTP — `grep apiClient|fetch( app/`
> returns nothing. Typed modules: `auth.ts` (sendOtp/verifyOtp/me/updateProfile/
> switchRole/logout — store `checkAuth`/`logout` also route through it),
> `documents.ts` (list/upload/view; `getView` encapsulates web blob + native
> FileSystem cache download, replacing the viewer's raw fetch), `driver.ts`
> (apply/getProfile/saveVehicle/verificationStatus/nearbyDrivers),
> `requests.ts` (+ `getForDriver`, `browseWithGeo`), `uploads.ts` (profile
> photo, mock), `feed.ts` (`subscribeLiveFeed`, mock). `files.ts` holds
> `fileUriToBlob`/`putToSignedUrl` so the create-wizard presigned PUT and
> blob conversions leave `app/`. Mock fakes in `lib/api/mock/*` (typed,
> env-flag only) — `EXPO_PUBLIC_USE_MOCK=false` default added to `.env(.example)`.
> `marketplace/index` now uses the shared `useBrowseRequests` hook; driver
> request detail uses `requestsApi.getForDriver` (real mode still falls back to
> browse until B2 — noted in the module). Unticked: acceptance/counter-offer
> UI flows (W7+); `lib/api/echo.ts` stays dead — realtime lands via
> `lib/api/feed.ts` in W9/W10 (fiche §10b ticked; Echo wiring deferred).
> ⚠️ mock-feature visual checks pending emulator.

------------------------------------------------------------------------

## 15. Remove obsolete architecture

After the new flow is working:

-   [x] Remove obsolete `(tabs)` routing and the `two.tsx` redirect stub.
-   [x] Delete `app/modal.tsx` (see §4).
-   [x] Delete `app/requests/create.tsx` (see §8).
-   [x] Delete `components/map/MapRenderer.tsx` and
    `components/map/MapRendererProps.ts` (see §12).
-   [x] Remove old role redirects duplicated inside screens.
-   [x] Remove duplicate navigation logic.
-   [x] Remove unused API methods/hooks.
-   [x] Remove unused map variants.
-   [x] Keep pusher-js/laravel-echo dependencies — the realtime infra
    uses them; remove dead Echo code only if the realtime architecture
    is dropped.
-   [x] Remove unused dependencies only after project-wide verification.
-   [x] Run a project-wide unused import/reference check.

> W10 2026-09-23: all §15 bullets done. `(tabs)`/`two.tsx` (W5),
> `modal.tsx` (W4), `requests/create.tsx` (W8) verified gone from the app
> tree. Map shims + unused variants/layers deleted (§12 note lists the
> surviving surface). Dead API methods removed: `authApi.switchRole`,
> `driverApi.verificationStatus`, `requestsApi.update`/`uploadPhoto`/
> `listPhotos`/`deletePhoto`/`browseWithGeo` (+ query key +
> `mockBrowseNearby`), `offersApi.withdrawOffer`; no dead hooks. Unused deps
> removed: `expo-maps` (plugin block too), `expo-linear-gradient`
> (`expo-symbols` remains as `expo-router`'s transitive dep). No per-screen
> role redirects / duplicate navigation remain. `pusher-js`/`laravel-echo` +
> `lib/api/echo.ts` kept for the Phase B realtime swap. `npx tsc --noEmit`
> passes; headless `expo export` (Android) bundles cleanly.

------------------------------------------------------------------------

## 16. Validation checklist

### Auth

-   [ ] New user can register with phone + OTP.
-   [ ] Existing user skips unnecessary onboarding.
-   [ ] Role-choice screen appears after OTP for users without a persona.
-   [ ] Client onboarding completes correctly.
-   [ ] Driver onboarding completes correctly.
-   [ ] Driver verification state is backend-driven.
-   [ ] Wrong-role routes are blocked (and redirected to the correct
    role home).
-   [ ] Logged-out users cannot access protected routes.
-   [ ] A 401 during an active session returns to login cleanly (no
    redirect loop).

### Permissions

-   [ ] Location permission works (requested on entering home maps, not
    at boot).
-   [ ] Camera permission works (feature-time only).
-   [ ] Denied camera permission shows the required-feature message.
-   [ ] Permanently denied path shows the blocked message + Settings
    button and never re-prompts the native dialog.
-   [ ] Settings button opens app settings.
-   [ ] Returning from settings refreshes permission state.

### Client

-   [x] Home map loads. (device — physical Android; W11 black-canvas
    regression fixed: `MapView` needs explicit `style={{ flex: 1 }}`, see
    BaseMap native-sizing whitelist)
-   [ ] Current location appears.
-   [ ] Nearby drivers appear.
-   [x] Request wizard opens above the same map. (device — wizard overlay
    was a full-screen `bg-black` view covering the shared map; now
    transparent + `pointerEvents="box-none"` so step-1 taps reach the map)
-   [ ] Map does not unnecessarily remount between wizard steps.
-   [ ] Request can be published successfully.

### Driver

-   [ ] Home map loads.
-   [ ] Nearby requests appear.
-   [ ] Realtime requests arrive (mock source in Phase A).
-   [ ] Maximum 3 live requests are shown.
-   [ ] Map and list stay synchronized.
-   [ ] Driver can open request details.
-   [ ] Driver can counter-offer/accept when approved.
-   [ ] Pending/rejected driver lands on the driver home (not client),
    with all restricted actions disabled and a French explanation /
    rejection reason.
-   [ ] Unapproved driver cannot perform restricted actions.

### Performance

-   [ ] Measure cold startup before changes.
-   [ ] Measure cold startup after changes.
-   [ ] Compare font loading time.
-   [x] Check unnecessary root-layout renders. (static — root gate renders
    `null` until fonts load AND auth restore; effect deps minimal)
-   [x] Check MapView remounts. (static — each home owns its single
    `RequestMap`/`DriverHomeMap`; the wizard never mounts a map)
-   [x] Check realtime subscription creation/destruction (exactly one
    connection/subscription while the driver home is active). (static —
    `useRealtimeRequests` is ref-guarded + unsubscribes on blur/unapprove;
    runtime confirmation device-pending)
-   [x] Check unnecessary React Query requests. (static — queries are
    screen-scoped; only the dashboard summary polls while mounted)

### Code quality

-   [x] No inline hardcoded styles outside styling files. (W11: two W9
    stragglers converted to Tailwind — driver-home banner icon, marketplace
    pending card; only runtime geometry stays inline)
-   [x] No legacy Expo template components.
-   [x] No duplicate auth/role state. (single zustand store + selectors)
-   [x] No direct API calls from screens. (all `apiClient`/`fetch` inside
    `lib/api/*`)
-   [x] No duplicated MapView implementations. (`BaseMap` is the only
    `MapView` owner; variants/layers compose it)
-   [x] Mock data lives only under `lib/api/mock/` and is flag-toggled.
-   [x] TypeScript passes.
-   [x] Expo build passes. (headless `expo export` — Android 7.1MB + iOS
    6.9MB bundles; on-device run still device-pending)

> W11 2026-09-23: host-side validation executed (device-free). Code-quality
> checklist verified by project-wide grep — every item ticked above is a
> W11 audit result, not an assumption. Static performance review: root-layout
> gate renders `null` until fonts+auth restore; each home owns its single map
> instance (wizard never mounts a map); `useRealtimeRequests` single-
> subscribes (ref-guarded) and tears down on blur/unapprove.
> `npx tsc --noEmit` passes; headless `expo export` bundles cleanly for
> Android (7.1MB) and iOS (6.9MB). Web: out of scope — `react-native-maps`
> has no web support (`+html.tsx` is inert for native targets).
> Device-only items stay on the blocked list with notes: manual §16 matrices
> (auth/permissions/client/driver flows, dialogs, toasts), cold-start +
> font-load timing, on-device map remount & realtime single-connection
> confirmation.

> W11 device pass 2026-09-23 (physical Android, `expo run:android --device`):
> four device-found refactor regressions fixed + committed — 1) black map
> canvas: the W1 styling sweep turned `MapView`'s sizing `style={{flex:1}}`
> into `className="flex-1"`, which NativeWind does not apply to the Fabric
> native view (explicit `style` restored, still on the §16 geometry
> whitelist); 2) request wizard's full-screen `bg-black` overlay painted over
> the single shared map (now transparent + `pointerEvents="box-none"` so the
> map shows above the sheet and step-1 tap-to-pin works); 3) the W5
> `(driver)` group rename strips group segments from URLs, leaving 12
> `router.push("/driver/...")` calls dead (→ `+not-found`) — a stale
> gitignored `.expo/types/router.d.ts` masked them from tsc until the dev
> build regenerated it; all call sites now use explicit `/(driver)/...`
> hrefs; 4) home recenter sat behind the full-width "Créer une demande" CTA
> (new `recenterBottomOffset` lifts it above) and `HOME_DELTA` 0.05→0.03
> zooms both homes in. Remaining device-only items: full auth/permissions
> matrices, cold-start + font-load timing, realtime single-connection
> runtime confirmation.

> W11 safe-area pass 2026-09-23: 5) under Android 15 edge-to-edge the system
> navigation bar overlapped the app's bottom tab bar (both `(client)` and
> `(driver)` Tabs layouts hardcoded `height: 60`, defeating react-navigation's
> automatic inset handling) — both layouts now extend over the bottom inset via
> `useSafeAreaInsets` (`height`/`paddingBottom` += `insets.bottom`). Stack
> screens use `pt-14` headers for top; `profile`/`dashboard` already wrap in
> `SafeAreaView`; no bottom-anchored CTAs exist outside the tabs.

------------------------------------------------------------------------

# Part B — Backend-coupled tickets (separate `<epic>_<us>` branches)

Each ticket gets its own dedicated branch per repo rule (`<epic>_<us>`,
e.g. `2_05`) and updates
`dev/implementation_status_and_design_system_matrix.md` on completion.

-   [ ] **B1 — Driver role at apply.** Applying/onboarding sets
    `role=driver` immediately while `driver_profile.status` stays
    `PENDING` until admin approval (and `REJECTED` after refusal).
    Current backend keeps applicants as `role=client` until approval —
    that must change. Touches `AuthService::switchRole` and the apply
    flow.
-   [ ] **B2 — Driver-accessible request detail.** Allow drivers to
    fetch `GET /api/v1/requests/{id}` for OPEN, non-draft requests
    (owner scope relaxed for drivers). Unblocks the `getForDriver` API
    and removes the `marketplace/[id]` page-1 `.find()` hack.
-   [ ] **B3 — Nearby drivers endpoint.** New endpoint returning online
    drivers within a radius of a lat/lng (client home).
-   [ ] **B4 — Browse geo filters.** `browse()` gains optional
    lat/lng/radius filters (driver home nearby requests).
-   [ ] **B5 — Profile photo.** New column + upload handling on `PUT /me`
    (or a dedicated endpoint).
-   [ ] **B6 — Vehicle color.** Optional `color` field on the vehicle.
-   [ ] **B7 — Realtime broadcasting.** `config/broadcasting.php`,
    `routes/channels.php`, Laravel events (request published /
    nearby-request feed), `Broadcast::routes` for
    `/api/v1/broadcasting/auth`, and a websocket server (e.g. soketi)
    added to `infra/docker-compose.dev.yml`. Mobile `.env` pusher vars
    point at it.
-   [ ] **B8 — Mobile realtime source swap.** Wire the mobile event-stream
    interface to the real channel added in B7; remove
    `lib/api/mock/realtime.ts`. Depends on B7.

## Backend contract — what the mobile app expects

For the record, so mobile and backend stay aligned:

-   Apply/onboarding sets `role=driver` while `driver_profile.status`
    stays `PENDING` until admin approval.
-   `/me` keeps returning `driver_profile` (id, status,
    rejection_reason).
-   Drivers may fetch `GET /api/v1/requests/{id}` for OPEN, non-draft
    requests.
-   New endpoint: nearby available drivers (online, within radius of
    lat/lng).
-   `browse()` gains optional lat/lng/radius filters.
-   Profile photo: new column + upload handling on PUT /me (or dedicated
    endpoint).
-   Vehicle: optional `color` field.
-   Realtime: `config/broadcasting.php`, `routes/channels.php`, Laravel
    events (request published / nearby-request feed), `Broadcast::routes`
    for `/api/v1/broadcasting/auth`, and a websocket server (soketi)
    service in `infra/docker-compose.dev.yml`; mobile `.env` pusher vars
    point at it.
