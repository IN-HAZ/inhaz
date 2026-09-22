/**
 * Shared types for the mock data layer (W6 §6.5).
 *
 * Mock implementations are typed against the same contracts the real backend
 * will use, so toggling `EXPO_PUBLIC_USE_MOCK` only swaps the source.
 */

/** A driver visible on the map (W9 home). */
export interface NearbyDriver {
  id: number;
  name: string;
  rating: number;
  vehicle: string;
  registration_number: string;
  online: boolean;
  position: { latitude: number; longitude: number };
}

/** A public request visible on the map / marketplace (geo-scoped). */
export interface NearbyRequest {
  id: number;
  title: string | null;
  description: string | null;
  proposed_price: string | null;
  budget_max: string | null;
  preferred_date: string | null;
  pickup_address: string;
  destination_address: string;
  distance_m: number;
  position: { latitude: number; longitude: number };
  created_at: string;
}

/** In-app live feed event (driver home, W9). */
export interface FeedEvent {
  id: string;
  type: "new_request" | "offer_update" | "trip_event";
  title: string;
  message: string;
  created_at: string;
}

/** Result of a mock profile-photo upload. */
export interface MockUploadResult {
  url: string;
}