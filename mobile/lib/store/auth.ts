import { create } from "zustand";
import { tokenStorage } from "@/lib/storage/secureStore";
import { apiClient, setAuthToken, onUnauthenticated } from "@/lib/api/client";

const TOKEN_KEY = "auth_token";

type UserRole = "client" | "driver" | "admin";

/** Driver verification state, as returned by the backend `driver_profile`. */
export type DriverStatus = "PENDING" | "APPROVED" | "REJECTED";

export interface DriverProfile {
    id: number;
    status: DriverStatus;
    rejection_reason: string | null;
    /** Present once the backend has approved the profile. */
    approved_at?: string | null;
}

export interface User {
    id: number;
    name: string;
    phone: string;
    role: UserRole;
    phone_verified_at: string | null;
    customer_profile: {
        id: number;
        name: string | null;
        email: string | null;
        locale: string;
    } | null;
    /**
     * `GET /me` loads `driverProfile`, so this is populated after `checkAuth()`.
     * The `verify-otp` response does NOT load it — `setSession` normalizes the
     * missing key to `null`, and `app/auth/otp.tsx` refreshes `/me` right after
     * login so role routing never relies on the raw token grant.
     */
    driver_profile: DriverProfile | null;
}

/** Fill `driver_profile` so callers never have to handle an absent key. */
function normalizeUser(user: User): User {
    return { ...user, driver_profile: user.driver_profile ?? null };
}

/**
 * Role selectors (W5 §5.1).
 *
 * The backend keeps `role=client` until a driver is approved (ticket B1 will
 * change that); presence of a `driver_profile` is therefore the other half of
 * the "is this user on the driver persona" test. These selectors keep working
 * with both today's and the future model.
 */
export const selectIsDriver = (s: AuthState): boolean =>
    s.user?.role === "driver" || !!s.user?.driver_profile;

export const selectIsClient = (s: AuthState): boolean =>
    !!s.user && !selectIsDriver(s);

export const selectDriverStatus = (s: AuthState): DriverStatus | null =>
    s.user?.driver_profile?.status ?? null;

export const selectIsDriverApproved = (s: AuthState): boolean =>
    selectIsDriver(s) && selectDriverStatus(s) === "APPROVED";

/** Convenience hook exposing the four role selectors for screens. */
export function useRole() {
    return {
        isClient: useAuthStore(selectIsClient),
        isDriver: useAuthStore(selectIsDriver),
        driverStatus: useAuthStore(selectDriverStatus),
        isDriverApproved: useAuthStore(selectIsDriverApproved),
    };
}

interface AuthState {
    user: User | null;
    isLoading: boolean;
    isAuthenticated: boolean;

    checkAuth: () => Promise<void>;
    setUser: (user: User | null) => void;
    setSession: (user: User, token: string) => Promise<void>;
    logout: () => Promise<void>;
    resetAuth: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
    user: null,
    isLoading: true,
    isAuthenticated: false,

    checkAuth: async () => {
        try {
            const token = await tokenStorage.getToken();
            if (!token) {
                set({ user: null, isAuthenticated: false, isLoading: false });
                return;
            }
            setAuthToken(token);
            const response = await apiClient.get("/me");
            const user = response.data.user as User;
            set({ user: normalizeUser(user), isAuthenticated: true, isLoading: false });
        } catch {
            setAuthToken(null);
            await tokenStorage.removeToken();
            set({ user: null, isAuthenticated: false, isLoading: false });
        }
    },

    setUser: (user) => {
        set({ user: user ? normalizeUser(user) : null, isAuthenticated: !!user });
    },

    setSession: async (user, token) => {
        setAuthToken(token);
        await tokenStorage.setToken(token);
        set({ user: normalizeUser(user), isAuthenticated: true });
    },

    logout: async () => {
        try {
            await apiClient.post("/auth/logout");
        } catch {
            // Silent fail
        } finally {
            setAuthToken(null);
            await tokenStorage.removeToken();
            set({ user: null, isAuthenticated: false });
        }
    },

    resetAuth: () => {
        setAuthToken(null);
        set({ user: null, isAuthenticated: false });
    },
}));

// Auto reset session when 401 unauthenticated response is intercepted
onUnauthenticated(() => {
    useAuthStore.getState().resetAuth();
});