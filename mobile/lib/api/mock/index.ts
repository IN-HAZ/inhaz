/**
 * Mock data layer (W6 §6.5).
 *
 * All fakes are typed against the real contracts and are only reachable
 * through the seams in `lib/api/*` guarded by `EXPO_PUBLIC_USE_MOCK=true`.
 * Phase B tickets replace each fake with a real backend call — the mock
 * module for that feature then becomes dead code that is safe to delete.
 */
export { mockNearbyDrivers, mockNearbyRequests } from "./nearby";
export { subscribeMockFeed } from "./feed";
export { mockRequestDetailForDriver } from "./requests";
export { mockUploadProfilePhoto } from "./uploads";
export type {
  NearbyDriver,
  NearbyRequest,
  FeedEvent,
  MockUploadResult,
} from "./types";