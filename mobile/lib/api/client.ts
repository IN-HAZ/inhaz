import axios from "axios";
import Constants from "expo-constants";

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

apiClient.interceptors.request.use((config) => {
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Session expired - will be handled by auth store
    }
    return Promise.reject(error);
  }
);
