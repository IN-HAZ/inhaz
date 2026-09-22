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

-   [ ] `components/Themed.tsx`
-   [ ] `components/StyledText.tsx`
-   [ ] `components/ExternalLink.tsx`
-   [ ] `components/EditScreenInfo.tsx`
-   [ ] `components/useColorScheme.ts`
-   [ ] `components/useClientOnlyValue.ts`
-   [ ] `constants/Colors.ts` if no longer referenced
-   [ ] Delete `app/modal.tsx` (template-only content) and remove its
    Stack entry from the root layout.
-   [ ] Replace `app/+not-found.tsx` legacy imports with plain RN
    `Text`/`View` + Tailwind classes.
-   [ ] Replace legacy component usage with the current UI kit/Tailwind
    classes.
-   [ ] Remove dead imports.
-   [ ] Search for remaining references before deleting files.
-   [ ] Run TypeScript after cleanup.

------------------------------------------------------------------------

## 5. Auth architecture + role guards

### 5.1 User/role model

-   [ ] Use the existing Zustand auth store.
-   [ ] Define the supported roles explicitly:
    -   `client`
    -   `driver`
-   [ ] Keep role information in the authenticated `user`.
-   [ ] Do not duplicate role state in screens.
-   [ ] Extend the auth store `User` type with `driver_profile` (id,
    status `PENDING`/`APPROVED`/`REJECTED`, rejection_reason) — `GET /me`
    already returns it; parse it in `checkAuth()`/`setSession()`.
-   [ ] Add store selectors: `isClient`, `isDriver`, `driverStatus`,
    `isDriverApproved`.
-   [ ] Role guard is two-tier: tier 1 = area access (role/persona);
    tier 2 = feature access (driver verification state).
-   [ ] Driver applicants get `role=driver` with a non-approved status
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

-   [ ] Create the client route group (`app/(client)/_layout.tsx`).
-   [ ] Create the driver route group (`app/(driver)/_layout.tsx`).
-   [ ] Move role-specific screens into the appropriate group.
-   [ ] Keep genuinely shared authenticated screens outside
    role-specific groups: `auth/`, `trips/`, `documents/[id]`,
    `onboarding/` (apply/onboarding/vehicle).
-   [ ] The `(client)`/`(driver)` groups do not change URLs.

### 5.3 RoleGuard

-   [ ] Create `components/auth/RoleGuard.tsx`.
-   [ ] Tier 1 (area): guard unauthenticated users → `/auth/login`.
-   [ ] Tier 1 (area): guard authenticated users with the wrong role →
    route to that role's home (no separate unauthorized screen needed).
-   [ ] Tier 2 (features, driver): pending/rejected drivers may enter
    the driver area, but every restricted action renders disabled with a
    French explanation ("Vérification en cours", or the rejection reason
    when supplied).
-   [ ] Prevent rendering protected content before auth state is known.
-   [ ] Apply `RoleGuard` at route-layout level instead of duplicating
    checks in every screen.
-   [ ] Keep backend authorization independent from the client guard
    (backend 403s remain authoritative).

### 5.4 Root routing

-   [ ] Update `app/_layout.tsx` to handle:
    -   auth loading
    -   unauthenticated state
    -   authenticated client
    -   authenticated driver
-   [ ] Authenticated users with an incomplete persona route to
    `/auth/role-choice` (§6.2) instead of a home screen.
-   [ ] Remove old `(tabs)`-based role routing once the new structure is
    stable (including the `two.tsx` redirect stub).
-   [ ] Avoid imperative navigation chains after login when route state
    can determine the destination.

------------------------------------------------------------------------

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

-   [ ] Keep phone validation with Zod.
-   [ ] Keep OTP validation with Zod.
-   [ ] Verify OTP through the Laravel API.
-   [ ] Store the returned session through `authStore.setSession()`.
-   [ ] After OTP success, route to `/auth/role-choice` only when the
    persona is incomplete (no name set, no role chosen, no driver
    profile); otherwise go straight to the role home.

### 6.2 Role selection

-   [ ] Add a role-choice screen after OTP verification when the user
    has not selected a role (`app/auth/role-choice.tsx`).
-   [ ] Add `client` and `driver` choices (two large buttons:
    Client / Chauffeur).
-   [ ] Persist the role through the backend — real persistence is Part B
    (backend ticket); in Phase A use the mock seam where the backend path
    is missing.
-   [ ] Refresh `/me` after the role change.
-   [ ] Route to the corresponding onboarding flow (client → §6.3,
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

-   [ ] Create client onboarding screen/state.
-   [ ] Save full name through the backend (PUT /me).
-   [ ] Upload profile photo (camera/media per §3) — upload goes through
    the mock seam until the backend photo endpoint exists (ticket B5).
-   [ ] Refresh authenticated user.
-   [ ] Enter client home only when required profile data is complete.

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

-   [ ] Reuse the existing driver onboarding components/API where
    possible.
-   [ ] Collect:
    -   full name
    -   profile photo
    -   car model
    -   car color  (backend `color` field is ticket B6; send as an extra
        field for now)
    -   plate number
    -   required documents
-   [ ] Preserve document status and expiry handling.
-   [ ] Show a manual verification message after submission (documents
    under manual review).
-   [ ] Route the driver to the driver home after onboarding submission.

### 6.5 Driver verification state

-   [ ] Define the backend-driven verification states in the mobile
    types.
-   [ ] Never locally assume that a driver is approved.
-   [ ] Fetch/refresh driver verification status from the backend
    (`/me` → `driver_profile`).
-   [ ] Disable driver marketplace/offer/trip actions while the driver
    is not approved.
-   [ ] Keep profile and status visibility available.
-   [ ] Show the verification/rejection reason when supplied by the
    backend.
-   [ ] Handle approval changes after app restart/resume/refetch (refresh
    the driver-status query key).

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

-   [ ] Make the client home primarily a map screen.
-   [ ] Request location permission on entry; show current client
    location.
-   [ ] Show nearby available drivers — from the mock data layer in
    Phase A (real endpoint is backend ticket B3); the layer/marker code
    is identical either way.
-   [ ] Add/reuse `DriversLayer`.
-   [ ] Add a bottom action ("Créer une demande") to start request
    creation.
-   [ ] Keep the map mounted while the request flow is active.
-   [ ] Avoid recreating the map unnecessarily during request steps.
-   [ ] Keep map state/camera stable while the request sheet changes.

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

-   [ ] Separate request wizard UI/state from the map container.
-   [ ] Move map ownership to the client home screen/container.
-   [ ] Render the request wizard as an overlay/bottom sheet above the
    existing map — the map does not remount between wizard steps.
-   [ ] Suggested structure (extract from `app/requests/create.tsx`):

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

-   [ ] Reuse the existing `RequestMap` layers/configuration where
    appropriate.
-   [ ] Keep the same map instance mounted during the wizard; the wizard
    receives a handle/interface to drive map interactions for step 1
    only (pickup pin, destination pin, route, location search).
-   [ ] Let later steps reduce/disable map interaction when appropriate.
-   [ ] Preserve the current draft API behavior.
-   [ ] Preserve live `patchStep()` behavior.
-   [ ] Preserve photo upload flow (camera per §3, with retry/failure
    states).
-   [ ] Preserve camera/map fitting behavior.
-   [ ] Remove map responsibilities from `requests/create.tsx`.
-   [ ] Delete `app/requests/create.tsx` once migrated — the entry point
    becomes the home button (§7).
-   [ ] Split the current 644-line screen into smaller components/hooks.

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

-   [ ] Make driver home map-first.
-   [ ] Request location permission on entry; show current location.
-   [ ] Show nearby open requests on the map — from the mock data layer
    in Phase A (real endpoint + broadcasts are backend tickets B4/B7/B8);
    the layer/marker code is identical either way.
-   [ ] Create a request marker/layer for the map (`NearbyRequestLayer`).
-   [ ] Make markers open request details.
-   [ ] Replace the current dashboard-first home experience (dashboard
    summary — earnings, online toggle — moves to the profile area or a
    compact header; online toggle stays functional).
-   [ ] Bottom live list (max 3 requests) fed by the realtime hook (§10).
-   [ ] Keep driver profile/status accessible separately.
-   [ ] Disable request interaction while driver verification is not
    approved.

------------------------------------------------------------------------

## 10. Driver realtime request feed — infra + mock source

Echo/Pusher dependencies exist but are not wired into the application.

-   [ ] Implement the Echo connection + subscription infra in
    `lib/api/echo.ts` (single-connection singleton) against a swappable
    event-stream interface.
-   [ ] Phase A wires the interface to a mock event source
    (`lib/api/mock/realtime.ts`: timer-driven realistic fake events,
    env-flag toggled, never inline).
-   [ ] Swapping to real Laravel broadcasts is a Phase B change (B8):
    wire the interface to the real channel, delete the mock.
-   [ ] Define the backend broadcast events required for nearby request
    updates (backend contract, Part B).
-   [ ] Subscribe only while the driver home is active and eligible.
-   [ ] Unsubscribe when leaving the screen.
-   [ ] Avoid creating multiple Echo connections/subscriptions.
-   [ ] Deduplicate incoming requests.
-   [ ] Update the TanStack Query cache when a realtime event arrives.
-   [ ] Keep the list capped at 3 requests.
-   [ ] Sort/update the list according to the backend event data.
-   [ ] Remove expired/claimed/cancelled requests from the live list.
-   [ ] Update map markers from the same source of state.
-   [ ] Handle reconnect/disconnect.
-   [ ] Refetch authoritative data after reconnect.
-   [ ] Do not treat WebSocket state as the backend source of truth.

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

------------------------------------------------------------------------

## 11. Driver request interaction

-   [ ] Tap map marker → open request detail.
-   [ ] Tap bottom-list item → open request detail.
-   [ ] Show request details.
-   [ ] Fetch detail via a `getForDriver` API method — mock-backed in
    Phase A; real driver-accessible endpoint is backend ticket B2.
-   [ ] Replace the current `marketplace/[id].tsx` page-1 `.find()` hack
    when the backend detail endpoint is available (ticket B2).
-   [ ] Allow counter-offer when driver is eligible.
-   [ ] Allow direct acceptance when supported by the backend.
-   [ ] Invalidate/update relevant request and offer queries after an
    action.
-   [ ] Prevent actions when driver verification is not approved.
-   [ ] Handle request becoming unavailable while the driver is viewing
    it.

------------------------------------------------------------------------

## 12. Map architecture

-   [ ] Keep `BaseMap` domain-agnostic.
-   [ ] Keep map layers presentational.
-   [ ] Create a dedicated client-home map composition.
-   [ ] Create a dedicated driver-home map composition.
-   [ ] Add a `NearbyRequestLayer`.
-   [ ] Reuse `CurrentLocationLayer`.
-   [ ] Reuse `DriversLayer` for the client.
-   [ ] Avoid duplicated MapView implementations.
-   [ ] Delete `MapRenderer.tsx` and `MapRendererProps.ts` once all
    callers migrate (do not keep them as a permanent shim).
-   [ ] Remove unused map variants after confirming they are no longer
    needed (delete in this round; recreate from `BaseMap` when a feature
    actually needs them):
    -   `LiveTrackingMap`
    -   `MarketplacePreviewMap`
    -   `TripRouteMap`

------------------------------------------------------------------------

## 13. Data/cache architecture

-   [ ] Define stable React Query keys for:
    -   current user
    -   driver profile/status
    -   nearby drivers
    -   nearby requests
    -   live feed
    -   requests
    -   offers
    -   trips
-   [ ] Update cache directly for realtime events where possible.
-   [ ] Invalidate authoritative queries after mutations.
-   [ ] Avoid unnecessary polling where WebSocket events provide
    equivalent updates.
-   [ ] Keep polling for data that does not have realtime events yet.
-   [ ] Avoid fetching the same data independently from multiple
    screens.

------------------------------------------------------------------------

## 14. API consistency

-   [ ] Move direct `apiClient` calls from screens into typed API
    modules (`lib/api/auth.ts`, `lib/api/documents.ts`, `lib/api/driver.ts`,
    `lib/api/requests.ts`).
-   [ ] Complete missing driver/document API types.
-   [ ] Add API methods for new onboarding/role endpoints.
-   [ ] Add API methods for nearby drivers/requests as placeholders —
    mock-backed in Phase A, real endpoints in Phase B (B3/B4).
-   [ ] Add API methods for verification status (`/me` → `driver_profile`).
-   [ ] Add API methods for profile photo upload — mock-backed until
    backend endpoint exists (B5).
-   [ ] Add API methods for request acceptance/counter-offers as
    required.
-   [ ] Add a `getForDriver` request-detail method — mock-backed until
    backend permission exists (B2).
-   [ ] Create `lib/api/mock/*`: typed fakes for nearbyDrivers,
    nearbyRequests, realtime feed, photo upload, requestDetail — all
    behind the `EXPO_PUBLIC_USE_MOCK` flag; each typed module branches
    real-vs-mock at exactly one seam.
-   [ ] Keep backend response types explicit.
-   [ ] Use `getErrorMessage()` consistently.

------------------------------------------------------------------------

## 15. Remove obsolete architecture

After the new flow is working:

-   [ ] Remove obsolete `(tabs)` routing and the `two.tsx` redirect stub.
-   [ ] Delete `app/modal.tsx` (see §4).
-   [ ] Delete `app/requests/create.tsx` (see §8).
-   [ ] Delete `components/map/MapRenderer.tsx` and
    `components/map/MapRendererProps.ts` (see §12).
-   [ ] Remove old role redirects duplicated inside screens.
-   [ ] Remove duplicate navigation logic.
-   [ ] Remove unused API methods/hooks.
-   [ ] Remove unused map variants.
-   [ ] Keep pusher-js/laravel-echo dependencies — the realtime infra
    uses them; remove dead Echo code only if the realtime architecture
    is dropped.
-   [ ] Remove unused dependencies only after project-wide verification.
-   [ ] Run a project-wide unused import/reference check.

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

-   [ ] Home map loads.
-   [ ] Current location appears.
-   [ ] Nearby drivers appear.
-   [ ] Request wizard opens above the same map.
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
-   [ ] Check unnecessary root-layout renders.
-   [ ] Check MapView remounts.
-   [ ] Check realtime subscription creation/destruction (exactly one
    connection/subscription while the driver home is active).
-   [ ] Check unnecessary React Query requests.

### Code quality

-   [ ] No inline hardcoded styles outside styling files.
-   [ ] No legacy Expo template components.
-   [ ] No duplicate auth/role state.
-   [ ] No direct API calls from screens.
-   [ ] No duplicated MapView implementations.
-   [ ] Mock data lives only under `lib/api/mock/` and is flag-toggled.
-   [ ] TypeScript passes.
-   [ ] Expo build passes.

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
