# inHaz Mobile — Phase A Refactor: Full Implementation Plan

Status: awaiting user approval — no code is written until approved.

---

## 0. Locked decisions (from user)

- Backend will change so drivers get `role=driver` with a non-approved `driver_profile.status` (PENDING/REJECTED) instead of staying `role=client`. This is a Phase B backend ticket; the mobile guard is written to work either way (role OR presence of driver_profile).
- Endpoints that do not exist yet (nearby drivers, nearby requests, realtime feed, profile photo upload, driver-facing request detail) use **mock data in dev, via a single swappable data layer** — never inline fakes. Controlled by an env flag; easy to remove.
- Scope this round: **Phase A, mobile-only refactor**. Backend-coupled features get their own tickets/branches.
- Styling: **one `global.css`** holding all shared custom Tailwind classes (`@layer components`).
- Realtime: build the **full infrastructure** (Echo singleton, channel subscription, hooks, cache integration) but feed it a **mock event source**; swapping to real Laravel broadcasts later = change the data source only.
- `OPT.md` and `AUTHGARD.md` will be deleted — the plan below folds their content into `todo.md` (the single living spec).

## 1. Ground rules (todo.md section 0, updated)

1. Read `app/_layout.tsx` completely before changing routing/auth logic.
2. All API calls live in typed modules under `lib/api/<domain>.ts`. Screens never call `apiClient`/`fetch` directly.
3. Server state lives in TanStack Query hooks under `lib/hooks/`.
4. Auth/session state lives in `lib/store/auth.ts` (Zustand). No new Context.
5. UI text in French, prices in MAD.
6. Backend remains the source of truth for authorization and driver verification state.
7. **No hardcoded styles** in `.tsx` files — only `className` from Tailwind/custom classes. Narrow exception: runtime geometry on native map/animation primitives (react-native-maps `edgePadding`, `anchor`, animated values, dynamic offsets).
8. **Mock rule**: mock data only for endpoints that do not exist yet; lives exclusively under `lib/api/mock/`; toggled by an env flag; never inlined in screens/components.
9. Typecheck with `npx tsc --noEmit` after each workstream.

## 2. Branch & commit strategy

- Create branch `refactor_phase_a` before starting (per repo workflow, a dedicated branch per work unit; this is one umbrella branch for Phase A).
- At least one commit per workstream (W1…W11).
- After each completed workstream touching features, update `dev/implementation_status_and_design_system_matrix.md` (status, related files, implementation details).

## 3. Workstreams

### W1 — Styling foundation (Tailwind-only, one global.css)

Goal: establish the semantic class system and remove `StyleSheet`/inline styles from screens and UI components.

Steps:
1. In `global.css`, add a `@layer components` block defining the canonical semantic classes: `btn-primary`, `btn-secondary`, `btn-outline`, `btn-danger`, `input-default`, `card-default`, `screen-container`, `section-title`, `text-muted`, `badge-success`, `badge-warning`, `badge-error`, plus any additional repeated patterns found during the sweep (e.g. sheet-drag-handle, nav-header, list-card).
2. Refactor `components/ui/` first (Button, Input, Card, Badge, Toast/ToastProvider) to consume only the semantic classes; delete the variant/`StyleSheet` maps from those components.
3. Sweep the whole project for `StyleSheet`, `style={{`, and static `style=` occurrences. Convert every layout/typography/color style to semantic or utility classes.
4. Convert screens in dependency order: `components/requests/*` (wizard steps, SelectedPinCard), then `app/auth/*`, `app/(tabs)/*` (before deletion), `app/driver/*`, `app/requests/*`, `app/trips/*`, `app/documents/[id]`.
5. Handle the map carve-out: keep runtime geometry inline only in `BaseMap`, `RecenterButton`, `LiveDriverLayer`, and the request wizard's animated sheet logic. Everything else in `components/map/*` (layers, variants) becomes `className` (layout via Tailwind `flex-1` etc.).
6. Remove `constants/Colors.ts` usage everywhere (it dies in W4 anyway) — replace with token utilities.

Done criteria: `grep` for `StyleSheet` returns only the whitelisted map/animation files; `npx tsc --noEmit` passes; visual check on Android of buttons, inputs, cards, badges, tabs, sheets shows no regression.

### W2 — Boot sequence & fonts

Goal: faster cold start; root layout does only global work.

Steps:
1. `app/_layout.tsx`: reduce `useFonts` to the 6 weights actually used — regular, medium, semibold, bold, extrabold, black. Drop thin, extralight, light.
2. `tailwind.config.js`: remove the `sans`, `thin`, `extralight`, `light` fontFamily keys so unused weights cannot reappear.
3. Remove the boot-time `useAppPermissions` call from the root layout. Location permission moves into the client and driver home screens (W8/W9). Camera permission is never boot-time (W3).
4. Keep `QueryClientProvider`, `ToastProvider`, splash handling, and `checkAuth()` in the root layout. Add an explicit auth-loading state so the guard never renders before restoration finishes (avoid flash of login / premature redirect).
5. Wire `onUnauthenticated()` from `lib/api/client.ts` into the auth store or root layout: a 401 mid-session clears the session and routes to `/auth/login` (prevents redirect loops between the axios 401 handler and the router guard).

Done criteria: cold start measured before/after; fonts down to 6; boot requests no permissions; sessions with expired tokens route to login cleanly.

### W3 — Permissions (location, camera, media library)

Goal: centralized permission logic with a documented UX state machine.

Steps:
1. Extend `lib/permissions.ts`:
   - Keep `requestAllAppPermissions`/`useAppPermissions` for location-only (used by home screens).
   - Add camera and media-library permission helpers using the expo-image-picker permission APIs (request/get, `canAskAgain`).
   - Add a settings-opening helper (native app settings via `expo-linking`/RN Linking).
   - Add a re-check helper to run on app-return from settings.
2. Add a `useCameraPermission(featureKey)` hook that owns the state machine: first request → granted / denied-with-explanation / permanently-denied (show message with "Open Settings" button) → return-from-settings re-check → keep feature disabled if still denied. Never re-trigger the native dialog after permanent denial.
3. Integrate the hook at the only two camera touchpoints: profile-photo capture (client onboarding W7 and driver onboarding W7) and Step-2 package photos (W8 wizard).
4. Delete the boot-time location request in the root layout (done in W2); call location permission inside client home (W8) and driver home (W9).

Done criteria: camera first-request, denied, blocked, settings-return, and granted paths all verified on Android; no camera permission asked at app boot.

### W4 — Remove Expo template leftovers

Goal: delete legacy template code and fix consumers.

Steps:
1. Delete: `components/Themed.tsx`, `components/StyledText.tsx`, `components/ExternalLink.tsx`, `components/EditScreenInfo.tsx`, `components/useColorScheme.ts`, `components/useClientOnlyValue.ts`, `constants/Colors.ts`.
2. Fix consumers before deleting:
   - `app/modal.tsx` — delete the file (it only rendered template content; nothing navigates to it after W5 removes it from the Stack).
   - `app/+not-found.tsx` — replace its Themed usage with plain RN `Text`/`View` + Tailwind classes (imports `components/Themed` today).
3. Remove the `modal` entry from the root Stack screen list.
4. Project-wide grep for remaining references to the deleted modules; fix/remove dead imports.

Done criteria: grep returns zero references to the deleted files; `npx tsc --noEmit` passes.

### W5 — Auth store, RoleGuard, route groups, root routing

Goal: role-based areas with two-tier guarding; backend stays authority.

Steps:
1. Extend the `User` type in `lib/store/auth.ts`:
   - role (`client` | `driver` | `admin`), existing fields.
   - Add `driver_profile` (id, status PENDING/APPROVED/REJECTED, rejection_reason) — `GET /me` already returns it; parse it in `checkAuth`/`setSession`.
   - Add derived helpers as store selectors: `isClient`, `isDriver`, `driverStatus`, `isDriverApproved`.
2. Create `components/auth/RoleGuard.tsx`:
   - Tier 1 (area access): not authenticated → redirect `/auth/login`; wrong role → redirect to that role's home (no dedicated unauthorized screen needed).
   - Tier 2 (feature access, driver): expose the driver verification state; pending/rejected drivers may enter the driver area but every restricted action renders disabled with a French explanation; rejected drivers additionally see `rejection_reason`.
   - Guard is applied at route-layout level, never duplicated per screen.
3. Restructure routes (expo-router groups don't change URLs):
   - `app/(client)/_layout.tsx` — RoleGuard(client) wrapping a Tabs layout (Home map, Demandes, Profil).
   - Move client screens into `app/(client)/`: `index` (W8 home map), `requests/*` (index, [id], offers/[id], create — create becomes the wizard overlay entry in W8), `profile`.
   - `app/(driver)/_layout.tsx` — RoleGuard(driver) wrapping a Tabs layout (Accueil map, Marketplace, Profil).
   - Move driver screens into `app/(driver)/`: `index` (W9 home map), `marketplace/*`, `documents/*`, `profile`. `dashboard.tsx` content becomes the home (W9).
   - Keep **outside** the role groups: `app/auth/*`, `app/trips/*` (shared by both roles), `app/documents/[id]` (shared viewer), onboarding screens (`apply`, `onboarding`, `vehicle` — they run before a driver_profile exists).
4. Update `app/_layout.tsx` routing: after auth loads → unauthenticated → `/auth/login`; authenticated → `/auth/role-choice` if persona incomplete (W7) else role-based home. Remove the `(tabs)` redirect.
5. Delete `app/(tabs)/` and the `two.tsx` redirect stub once all screens migrated (W10 formalizes).
6. Keep `switch-role` handling in profile only for approved drivers who need it (backend ticket in Phase B; mobile can keep calling `/auth/switch-role` as-is).

Done criteria: fresh login lands on role-choice/home correctly; pending driver reaches driver home with locked features; logged-out users cannot reach protected screens; no screen contains its own role redirect anymore.

### W6 — API modules + mock data layer

Goal: no direct HTTP in screens; typed modules; swappable mock layer.

Steps:
1. Create `lib/api/auth.ts` and move login/OTP/me/update-profile/switch-role calls out of `app/auth/*`, `(tabs)/profile`, `driver/*` screens.
2. Create `lib/api/documents.ts` for driver document list/upload/view (documents screens call it today).
3. Extend `lib/api/driver.ts`: apply, driver profile, vehicle, toggle-online, location, dashboard summary (move direct calls from screens), plus `nearbyDrivers` (mock-backed for now) and `verificationStatus` (uses `/me` driver_profile).
4. Extend `lib/api/requests.ts`: add a typed `browseWithGeo` placeholder (used with mock) and a `getForDriver` detail method (mock-backed until backend allows drivers to view request detail).
5. Create `lib/api/mock/index.ts` + `lib/api/mock/*.ts`: typed fakes for nearbyDrivers, nearbyRequests, realtime feed events, profile photo upload, driver-facing request detail. All mock implementations are guarded by the env flag `EXPO_PUBLIC_USE_MOCK`; each typed module branches between real and mock at one seam.
6. Define and document canonical React Query keys: current user, driver profile/status, nearby drivers, nearby requests, requests, offers, trips, live feed.
7. Standardize error handling: screens use `getErrorMessage` + toast everywhere.

Done criteria: grep for `apiClient`/`fetch` inside `app/` returns zero; `npx tsc --noEmit` passes; toggling mock flag on/off changes only the data source.

### W7 — New authentication + onboarding flow

Goal: phone → OTP → role choice → per-role onboarding → home.

Steps:
1. `app/auth/otp.tsx` routing: after successful verify, if the user has no persona (no name set and no role choice made / no driver profile), `router.replace` to a new role-choice screen; otherwise go straight to role home.
2. New `app/auth/role-choice.tsx`: two large buttons (Client / Chauffeur). Selecting persists intent via the (Phase B) backend role/ticket or, until then, via the mock seam; then routes to the corresponding onboarding.
3. Client onboarding: full name (persist via PUT /me) + profile photo (picker/camera behind W3 camera permission; upload via mock seam until backend photo endpoint exists). On completion → client home. Existing users with complete profiles skip onboarding entirely.
4. Driver onboarding: reuse the existing onboarding/apply/vehicle/documents components and APIs. Collect: full name, profile photo (mock upload), vehicle (model, color, plate number — align with existing backend fields; `color` is a Phase B backend addition, sent as an extra field), required documents (existing real endpoints). Keep document status/expiry handling.
5. After driver onboarding submission: show the manual-verification message (modal/banner) stating documents are under manual review; route to driver home.
6. Driver home renders restricted: marketplace/offers/online/trip actions disabled with "Vérification en cours" or the rejection reason, while profile stays visible. Approval changes refresh on app resume/refetch (via the driver status query key).

Done criteria: full matrix from todo.md §16 (auth section) passes; documents upload still works against the real backend.

### W8 — Client home map + request wizard refactor

Goal: map-first client home; wizard rendered over the same map instance.

Steps:
1. `app/(client)/index.tsx` becomes the home: full-screen map (compose BaseMap + CurrentLocationLayer + DriversLayer), current location from GPS (location permission on entry), nearby drivers from the mock seam, and a bottom "Créer une demande" button that opens the wizard overlay.
2. Extract the wizard from `app/requests/create.tsx` into components: `components/requests/RequestWizard.tsx` (owns the 5-step state, draft id, validation, publish) and `components/requests/RequestWizardSheet.tsx` (the draggable bottom sheet + snap points + keyboard handling). Step1–Step5 components stay presentational (already largely are).
3. **Map ownership moves to the home screen.** The home renders and holds the map (instance + camera). The wizard receives a handle/interface to drive map interactions for Step 1 only: search results → center/fit camera, tap-to-pin, route polyline → markers. Later steps disable map interaction.
4. Preserve current behavior exactly: draft creation, live `patchStep` on "Suivant", photo capture/upload with retry and failure states, proposed-price steps, publish → success → route to `(client)/requests`.
5. Delete `app/requests/create.tsx` after migration (entry point is the home button).

Done criteria: map does not remount between wizard steps (verify via logs/measurement); request publishes successfully; camera/fit behavior identical to current app.

### W9 — Driver home + realtime infrastructure (mock feed)

Goal: map-first driver home with live nearby-request feed; realtime infra with a mock source.

Steps:
1. `app/(driver)/index.tsx` becomes the home: full-screen map with a new `NearbyRequestLayer` (request markers with pickup→destination preview), current location, and a bottom live list capped at 3.
2. Create `components/map/layers/NearbyRequestLayer.tsx`: presentational markers + tap-to-open-detail callback; follows the existing layers convention.
3. Build the realtime infra:
   - `lib/api/echo.ts`: single-connection singleton (exists), extend with subscribe/unsubscribe helpers, reconnect/disconnect handling, and `disconnectEcho` on logout.
   - New `lib/hooks/useRealtimeRequests.ts`: subscribes only while the driver home is active and the driver is eligible; unsubscribes on leave; dedupes events; caps the list at 3; removes claimed/expired/cancelled requests; updates the TanStack "nearby requests" + "live feed" cache; refetches authoritative data after reconnect.
   - **Data source is swappable**: the hook consumes an event stream interface; Phase A wires it to `lib/api/mock/realtime.ts` (emits realistic fake events on a timer). Swapping to real Laravel broadcasts later = wire the interface to the real Echo channel, delete the mock.
4. Request detail from map marker or list tap: use `getForDriver` (mock-backed until backend permits driver detail fetch — removes the page-1 `.find()` hack in `marketplace/[id]`).
5. Actions on detail: counter-offer and accept when approved (existing offer APIs); disabled + verification message otherwise; invalidate request/offer caches after an action; handle "request became unavailable while viewing".
6. Replace the `dashboard-first` experience: dashboard summary (earnings, online toggle) moves into the driver profile area or a compact header; online toggle stays functional (existing endpoint).

Done criteria: live list updates from mock feed with max 3; map markers sync with the same state; pending driver sees the home but all actions disabled; no duplicate Echo connections; leaving the screen unsubscribes.

### W10 — Remove obsolete architecture

Goal: delete what Phase A rendered obsolete.

Steps:
1. Delete `app/(tabs)/` (including `two.tsx`) after W5/W8/W9 migration.
2. Delete `app/modal.tsx` (W4) and its Stack entry.
3. Delete `components/map/MapRenderer.tsx` and `components/map/MapRendererProps.ts` (compat shims) after confirming no imports remain.
4. Delete unused map variants `MarketplacePreviewMap`, `TripRouteMap`, `LiveTrackingMap` and any unused layers (recreate from BaseMap when actually needed — keeps the codebase clean).
5. Remove unused dependencies only after a project-wide unused-import/require check (keep pusher-js/laravel-echo — realtime infra uses them).
6. Remove dead API methods/hooks and duplicate navigation logic discovered during the refactor.

Done criteria: `npx tsc --noEmit` passes; expo export/build passes; app boots to the new flows.

### W11 — Validation & measurement

Steps:
1. Run the full manual validation matrix from todo.md §16 (auth, permissions, client, driver, performance, code quality).
2. Measure cold start before (baseline captured in W2) vs after; compare font-load time; confirm no root-layout renders cause needless work; confirm MapView does not remount between wizard steps; confirm one realtime connection/subscription.
3. Verify Android; verify iOS if available; verify web only if web support is still required.
4. Update `dev/implementation_status_and_design_system_matrix.md` for every touched user story (status, related files, implementation details).

---

## 4. Backend contract (Phase B prerequisites — NOT this round)

For the record so mobile and backend stay aligned:
- Apply/onboarding sets `role=driver` while `driver_profile.status` stays PENDING until admin approval.
- `/me` keeps returning `driver_profile` (id, status, rejection_reason).
- Drivers may fetch `GET /api/v1/requests/{id}` for OPEN, non-draft requests.
- New endpoint: nearby available drivers (online, within radius of lat/lng).
- `browse()` gains optional lat/lng/radius filters.
- Profile photo: new column + upload handling on PUT /me (or dedicated endpoint).
- Vehicle: optional `color` field.
- Realtime: `config/broadcasting.php`, `routes/channels.php`, Laravel events (request published / nearby-request feed), `Broadcast::routes` for `/api/v1/broadcasting/auth`, and a websocket server (soketi) service in `infra/docker-compose.dev.yml`; mobile `.env` pusher vars point at it.

---

## 5. File change ledger (Phase A)

NEW:
- `lib/api/auth.ts`, `lib/api/documents.ts`
- `lib/api/mock/index.ts`, `lib/api/mock/*` (nearbyDrivers, nearbyRequests, realtime, photoUpload, requestDetail)
- `lib/hooks/useRealtimeRequests.ts`
- `components/auth/RoleGuard.tsx`
- `components/map/layers/NearbyRequestLayer.tsx`
- `components/requests/RequestWizard.tsx`, `components/requests/RequestWizardSheet.tsx`
- `app/auth/role-choice.tsx`, `app/(client)/_layout.tsx`, `app/(driver)/_layout.tsx`
- Client home, driver home, client/driver onboarding screens (or repurposed existing files)

MODIFY:
- `app/_layout.tsx` (fonts, permissions removal, routing, 401 wiring)
- `lib/store/auth.ts` (driver_profile, selectors)
- `lib/permissions.ts` (camera/media/settings/recheck + hook)
- `global.css` (component classes)
- `tailwind.config.js` (fontFamily trim)
- All `components/ui/*`, wizard steps, and every screen (style migration)
- `lib/api/driver.ts`, `lib/api/requests.ts`, `lib/api/client.ts` (unauthenticated wiring), `lib/api/echo.ts` (infra)
- `app/auth/otp.tsx` (route to role choice), `app/+not-found.tsx` (Themed removal)

DELETE:
- `components/Themed.tsx`, `StyledText.tsx`, `ExternalLink.tsx`, `EditScreenInfo.tsx`, `useColorScheme.ts`, `useClientOnlyValue.ts`
- `constants/Colors.ts`
- `app/modal.tsx`, `app/(tabs)/` (incl. `two.tsx`)
- `app/requests/create.tsx`
- `components/map/MapRenderer.tsx`, `components/map/MapRendererProps.ts`
- Unused map variants (MarketplacePreviewMap, TripRouteMap, LiveTrackingMap) and unused layers if any

---

## 6. Exact changes to `todo.md`

### 6.1 Which files get deleted
`OPT.md` and `AUTHGARD.md` are deleted. Their content is folded into `todo.md` so nothing is lost: fonts audit result, semantic class inventory, one-global.css rule, camera-permission UX, role guard two-tier spec, route-group structure, backend contract.

### 6.2 Restructure the document
1. Rename title to "inHaz Mobile — Refactor & Implementation TODO (Phase A: mobile-only; Phase B: backend-coupled)".
2. Keep section 0 (Baseline/rules) and append these new rules:
   - No hardcoded styles outside styling files (single `global.css` for shared classes; narrow exception for runtime map/animation geometry).
   - Mock rule: swappable data layer under `lib/api/mock/*`, env-flag toggled, never inline, easy to remove.
   - Only 6 Inter weights: regular, medium, semibold, bold, extrabold, black.
   - Role guard is two-tier: area by role/persona, features by driver verification state.
3. Split the checklist into two labeled parts:
   - **Part A — mobile-only (this round):** styling, boot/fonts, permissions, template cleanup, auth store + guards + route groups, auth/onboarding flow, client home + wizard refactor, driver home + realtime infra with mock feed, map architecture, cache keys, API consistency (incl. mock layer), obsolete removal, validation.
   - **Part B — backend tickets (separate branches `X_YY`):** role-at-apply with non-approved status, request-detail-permission for drivers, nearby drivers endpoint, browse geo params, profile photo upload, vehicle color, broadcasting config + channels + events + soketi service, mobile realtime source swap.
4. Update §10 (realtime): retitle to "Driver realtime request feed — infra + mock source". Keep all infra checkboxes; replace "Implement the Laravel Echo/Pusher connection" wording with "Implement the Echo connection + subscription infra against a swappable event-stream interface; supply a mock event source in dev; swap to real Laravel broadcasts in Phase B; mock never inline."
5. Update §6 (onboarding): add "role-choice screen after OTP when persona incomplete"; add "profile photo via camera/media permissions (mock upload until backend endpoint)"; add "driver home locked by verification state with 'Vérification en cours' or rejection reason".
6. Update §7/§8/§9: mark nearby-drivers and nearby-requests data as mock-backed in Phase A; note map ownership moves to home; note wizard becomes overlay components (`RequestWizard`, `RequestWizardSheet`).
7. Update §12 (map architecture): remove "keep MapRenderer as shim until all callers migrate" → replace with "delete MapRenderer shims and unused variants after migration (MarketplacePreviewMap, TripRouteMap, LiveTrackingMap)".
8. Update §15 (remove obsolete): add `app/modal.tsx`, `app/(tabs)/` incl. `two.tsx`, `requests/create.tsx`, and the deleted template components; add "verify pusher/echo deps still used (realtime infra keeps them)".
9. Update §16 (validation): add checks for "401 during active session returns to login", "pending driver sees driver home with locked actions", "map does not remount between wizard steps", "single realtime subscription".
10. Append a "Backend contract (Phase B)" section with the exact items from plan §4.
11. Remove any now-duplicate references to OPT.md/AUTHGARD.md.