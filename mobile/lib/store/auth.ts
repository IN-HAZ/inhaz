import { create } from "zustand";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { apiClient, setAuthToken } from "@/lib/api/client";

const TOKEN_KEY = "auth_token";

interface User {
  id: number;
  name: string;
  phone: string;
  role: 'client' | 'driver' | 'admin';
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
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoading: true,
  isAuthenticated: false,

  checkAuth: async () => {
    try {
      const token = await AsyncStorage.getItem(TOKEN_KEY);
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
      await AsyncStorage.removeItem(TOKEN_KEY);
      set({ user: null, isAuthenticated: false, isLoading: false });
    }
  },

  setUser: (user) => {
    set({ user, isAuthenticated: !!user });
  },

  setSession: async (user, token) => {
    setAuthToken(token);
    await AsyncStorage.setItem(TOKEN_KEY, token);
    set({ user, isAuthenticated: true });
  },

  logout: async () => {
    try {
      await apiClient.post("/auth/logout");
    } catch {
      // Silent fail
    } finally {
      setAuthToken(null);
      set({ user: null, isAuthenticated: false });
      await AsyncStorage.removeItem(TOKEN_KEY);
    }
  },
}));