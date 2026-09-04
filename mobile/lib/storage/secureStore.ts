import * as SecureStore from "expo-secure-store";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";

const TOKEN_KEY = "auth_token";

export const tokenStorage = {
  async getToken(): Promise<string | null> {
    if (Platform.OS === "web") {
      return AsyncStorage.getItem(TOKEN_KEY);
    }
    try {
      return await SecureStore.getItemAsync(TOKEN_KEY);
    } catch (e) {
      console.warn("SecureStore getItemAsync failed, falling back to AsyncStorage", e);
      return AsyncStorage.getItem(TOKEN_KEY);
    }
  },

  async setToken(token: string): Promise<void> {
    if (Platform.OS === "web") {
      await AsyncStorage.setItem(TOKEN_KEY, token);
      return;
    }
    try {
      await SecureStore.setItemAsync(TOKEN_KEY, token);
    } catch (e) {
      console.warn("SecureStore setItemAsync failed, falling back to AsyncStorage", e);
      await AsyncStorage.setItem(TOKEN_KEY, token);
    }
  },

  async removeToken(): Promise<void> {
    if (Platform.OS === "web") {
      await AsyncStorage.removeItem(TOKEN_KEY);
      return;
    }
    try {
      await SecureStore.deleteItemAsync(TOKEN_KEY);
    } catch (e) {
      console.warn("SecureStore deleteItemAsync failed, falling back to AsyncStorage", e);
      await AsyncStorage.removeItem(TOKEN_KEY);
    }
  },
};
