import axios from "axios";
import Constants from "expo-constants";
import { tokenStorage } from "@/lib/storage/secureStore";

// .env wins over app.json extra so the LAN IP can be changed without touching app config.
export const API_URL =
  process.env.EXPO_PUBLIC_API_URL ??
  Constants.expoConfig?.extra?.EXPO_PUBLIC_API_URL ??
  "http://localhost:8000/api/v1";

export const API_HOST = API_URL.replace("/api/v1", "");

export const apiClient = axios.create({
  baseURL: API_URL,
  timeout: 15000,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

let authToken: string | null = null;
type UnauthenticatedListener = () => void;
const unauthenticatedListeners = new Set<UnauthenticatedListener>();

export function setAuthToken(token: string | null) {
  authToken = token;
  if (token) {
    apiClient.defaults.headers.common.Authorization = `Bearer ${token}`;
  } else {
    delete apiClient.defaults.headers.common.Authorization;
  }
}

export function getAuthToken() {
  return authToken;
}

export function onUnauthenticated(listener: UnauthenticatedListener) {
  unauthenticatedListeners.add(listener);
  return () => {
    unauthenticatedListeners.delete(listener);
  };
}

apiClient.interceptors.request.use(async (config) => {
  if (!authToken) {
    const token = await tokenStorage.getToken();
    if (token) {
      authToken = token;
    }
  }
  if (authToken) {
    config.headers.Authorization = `Bearer ${authToken}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      setAuthToken(null);
      await tokenStorage.removeToken();
      unauthenticatedListeners.forEach((listener) => listener());
    }
    return Promise.reject(error);
  }
);

