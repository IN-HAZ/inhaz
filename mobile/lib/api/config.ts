/**
 * Runtime feature flag (W6).
 *
 * `EXPO_PUBLIC_USE_MOCK=true` routes mock-first seams (nearby drivers,
 * live feed, driver-facing request detail, profile-photo upload) through
 * `lib/api/mock`. Every real data path is unaffected by the flag — it only
 * changes the *source* for the features the backend has not shipped yet
 * (Marked "Phase B" in the code docs). Toggling it never changes shapes,
 * only where the data comes from.
 *
 * Defaults to `false` so the current app behaves identically without config.
 */
export const USE_MOCK: boolean =
  (process.env.EXPO_PUBLIC_USE_MOCK ?? "false").toLowerCase() === "true";