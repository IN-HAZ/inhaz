import { create } from "zustand";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { apiClient } from "@/lib/api/client";

interface User {
  id: number;
  name: string;
  phone: string;
  role: 'CLIENT' | 'DRIVER' | 'ADMIN';
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
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoading: true,
  isAuthenticated: false,

  checkAuth: async () => {
    try {
      set({ isLoading: true });
      const response = await apiClient.get("/me");
      const user = response.data.user;
      set({ user, isAuthenticated: true, isLoading: false });
    } catch {
      set({ user: null, isAuthenticated: false, isLoading: false });
    }
  },

  setUser: (user) => {
    set({ user, isAuthenticated: !!user });
  },

  logout: async () => {
    try {
      await apiClient.post("/auth/logout");
    } catch {
      // Silent fail
    } finally {
      set({ user: null, isAuthenticated: false });
      await AsyncStorage.removeItem("auth_token");
    }
  },
}));
