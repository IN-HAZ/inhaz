import { apiClient } from "./client";
import { USE_MOCK } from "./config";
import { mockNearbyDrivers } from "./mock";
import type { NearbyDriver } from "./mock/types";
import type { User } from "@/lib/store/auth";

export interface DashboardSummaryResponse {
  is_online: boolean;
  today_earnings_mad: number;
  commission_balance_mad: number;
  completed_trips_today: number;
  active_trip_id?: number | null;
  driver_status: string;
}

export interface ToggleOnlineResponse {
  message: string;
  is_online: boolean;
}

export interface DriverProfileItem {
  id: number;
  status: string;
  approved_at: string | null;
  rejection_reason: string | null;
  vehicle: { brand: string; model: string; registration_number: string } | null;
  documents: { id: number; type: string; status: string }[];
}

export interface VerificationStatus {
  status: "PENDING" | "APPROVED" | "REJECTED" | null;
  rejection_reason: string | null;
}

export interface GeoRegion {
  latitude: number;
  longitude: number;
  radiusKm?: number;
}

/**
 * Driver API (W6 §6.3). Owns the driver persona calls — screens never touch
 * `apiClient` directly. `nearbyDrivers` is mock-backed until the backend
 * ships the nearby endpoint (Phase B).
 */
export const driverApi = {
  getDashboardSummary: async (): Promise<DashboardSummaryResponse> => {
    const response = await apiClient.get<DashboardSummaryResponse>(
      "/driver/dashboard-summary"
    );
    return response.data;
  },

  toggleOnline: async (): Promise<ToggleOnlineResponse> => {
    const response = await apiClient.post<ToggleOnlineResponse>(
      "/driver/toggle-online"
    );
    return response.data;
  },

  updateLocation: async (latitude: number, longitude: number): Promise<void> => {
    await apiClient.post("/driver/location", { latitude, longitude });
  },

  /** Submit the driver application; returns the created driver_profile. */
  apply: async (): Promise<{ user?: User; driver_profile: DriverProfileItem }> => {
    const response = await apiClient.post<{
      user?: User;
      driver_profile: DriverProfileItem;
    }>("/driver/apply");
    return response.data;
  },

  /** Full driver profile (vehicle + documents + status). */
  getProfile: async (): Promise<DriverProfileItem> => {
    const response = await apiClient.get<{ driver_profile: DriverProfileItem }>(
      "/driver/profile"
    );
    return response.data.driver_profile;
  },

  saveVehicle: async (vehicle: {
    brand: string;
    model: string;
    registration_number: string;
  }): Promise<{ brand: string; model: string; registration_number: string }> => {
    const response = await apiClient.post<{ vehicle: DriverProfileItem["vehicle"] }>(
      "/driver/vehicle",
      vehicle
    );
    return response.data.vehicle!;
  },

  /** Verification state, derived from the authoritative `/me` driver_profile. */
  verificationStatus: async (): Promise<VerificationStatus> => {
    const response = await apiClient.get<{ user: User }>("/me");
    const dp = response.data.user.driver_profile;
    return {
      status: dp?.status ?? null,
      rejection_reason: dp?.rejection_reason ?? null,
    };
  },

  /**
   * Drivers near a point (map markers, W9). Mock-backed until the backend
   * ships `GET /driver/nearby` (Phase B); the real branch stays empty so
   * nothing breaks with the flag off.
   */
  nearbyDrivers: async (region?: GeoRegion): Promise<NearbyDriver[]> => {
    if (USE_MOCK) {
      return mockNearbyDrivers(region);
    }
    // Phase B ticket replaces this with the real endpoint call.
    return [];
  },
};