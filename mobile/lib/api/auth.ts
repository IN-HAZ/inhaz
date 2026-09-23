import { apiClient } from "./client";
import type { User } from "@/lib/store/auth";

/** `/auth/verify-otp` grant. `driver_profile` is NOT loaded here (W5 §5.1). */
export interface OtpGrant {
  user: User;
  token: string;
}

/**
 * Auth API (W6 §6.1). Owns every identity/account call — screens and the auth
 * store never touch `apiClient` directly for these.
 */
export const authApi = {
  /** Request an OTP for a phone number. */
  sendOtp: async (phone: string): Promise<void> => {
    await apiClient.post("/auth/send-otp", { phone });
  },

  /** Exchange phone + code for a session grant. */
  verifyOtp: async (phone: string, code: string): Promise<OtpGrant> => {
    const response = await apiClient.post<OtpGrant>("/auth/verify-otp", {
      phone,
      code,
    });
    return response.data;
  },

  /** Load the full current user (includes `customer_profile` + `driver_profile`). */
  me: async (): Promise<User> => {
    const response = await apiClient.get<{ user: User }>("/me");
    return response.data.user;
  },

  /** Persist display name / email; returns the refreshed user. */
  updateProfile: async (payload: {
    name?: string;
    email?: string | null;
  }): Promise<User> => {
    const response = await apiClient.put<{ user: User }>("/me", payload);
    return response.data.user;
  },

  logout: async (): Promise<void> => {
    await apiClient.post("/auth/logout");
  },
};