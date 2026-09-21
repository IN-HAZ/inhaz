import { create } from "zustand";
import { tokenStorage } from "@/lib/storage/secureStore";
import { apiClient, setAuthToken, onUnauthenticated } from "@/lib/api/client";

const TOKEN_KEY = "auth_token";

type UserRole = "client" | "driver" | "admin";

interface User {
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
            const user = response.data.user;
            set({ user, isAuthenticated: true, isLoading: false });
        } catch {
            setAuthToken(null);
            await tokenStorage.removeToken();
            set({ user: null, isAuthenticated: false, isLoading: false });
        }
    },

    setUser: (user) => {
        set({ user, isAuthenticated: !!user });
    },

    setSession: async (user, token) => {
        setAuthToken(token);
        await tokenStorage.setToken(token);
        set({ user, isAuthenticated: true });
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
