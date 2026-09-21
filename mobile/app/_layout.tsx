import "../global.css";

import { useFonts } from "expo-font";
import {
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    Inter_800ExtraBold,
    Inter_900Black,
} from "@expo-google-fonts/inter";
import { Stack, useRouter, useSegments } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";
import "react-native-reanimated";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ToastProvider } from "../components/ui/ToastProvider";
import { useAuthStore } from "../lib/store/auth";

export { ErrorBoundary } from "expo-router";

export const unstable_settings = {
    initialRouteName: "(tabs)",
};

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

export default function RootLayout() {
    const [loaded, error] = useFonts({
        Inter_400Regular,
        Inter_500Medium,
        Inter_600SemiBold,
        Inter_700Bold,
        Inter_800ExtraBold,
        Inter_900Black,
    });

    const { isLoading, isAuthenticated, checkAuth } = useAuthStore();
    const segments = useSegments();
    const router = useRouter();

    useEffect(() => {
        if (error) throw error;
    }, [error]);

    useEffect(() => {
        if (loaded) {
            SplashScreen.hideAsync();
        }
    }, [loaded]);

    useEffect(() => {
        checkAuth();
    }, []);

    // No boot-time permission requests here: location is requested when the
    // client/driver home maps mount (W8/W9), camera is feature-time only (W3).

    useEffect(() => {
        if (isLoading || !loaded) return;

        const inAuthGroup = segments[0] === "auth";

        if (!isAuthenticated && !inAuthGroup) {
            router.replace("/auth/login");
        } else if (isAuthenticated && inAuthGroup) {
            router.replace("/(tabs)");
        }
    }, [isAuthenticated, isLoading, loaded, segments]);

    if (!loaded || isLoading) {
        // Auth-restoration guard: never render the router gate until font load
        // AND auth restoration (store `isLoading` from `checkAuth`) have
        // finished, so we don't flash /auth/login or redirect prematurely.
        return null;
    }

    return (
        <QueryClientProvider client={queryClient}>
            <ToastProvider>
                <Stack
                    screenOptions={{
                        headerShown: false,
                        contentStyle: { backgroundColor: "#ffffff" },
                    }}
                >
                    <Stack.Screen name="auth/login" />
                    <Stack.Screen name="auth/otp" />
                    <Stack.Screen name="driver/apply" />
                    <Stack.Screen name="driver/onboarding" />
                    <Stack.Screen name="driver/profile" />
                    <Stack.Screen name="driver/vehicle" />
                    <Stack.Screen name="driver/documents/index" />
                    <Stack.Screen name="driver/documents/upload" />
                    <Stack.Screen name="documents/[id]" />
                    <Stack.Screen name="requests/index" />
                    <Stack.Screen name="requests/create" />
                    <Stack.Screen name="requests/[id]" />
                    <Stack.Screen name="requests/offers/[id]" />
                    <Stack.Screen name="driver/marketplace/index" />
                    <Stack.Screen name="driver/marketplace/[id]" />
                    <Stack.Screen name="(tabs)" />
                </Stack>
            </ToastProvider>
        </QueryClientProvider>
    );
}
