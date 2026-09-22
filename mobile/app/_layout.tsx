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
import { selectPersonaComplete, useAuthStore, useRole } from "../lib/store/auth";

export { ErrorBoundary } from "expo-router";

export const unstable_settings = {
    // Cold links resolve `(client)` before `(driver)` (alphabetical); its
    // RoleGuard immediately bounces drivers to `/(driver)`. In-app navigation
    // always targets explicit group hrefs, so this only shows on cold starts.
    initialRouteName: "(client)",
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
    const { isDriver } = useRole();
    const personaComplete = useAuthStore(selectPersonaComplete);
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

    // Root routing gate (W5 §5.4). Post-login destinations are decided by
    // `app/auth/otp.tsx`; this effect only enforces the area boundary and the
    // "stay out of the auth group once logged in" rule.
    useEffect(() => {
        if (isLoading || !loaded) return;

        const inAuthGroup = segments[0] === "auth";

        if (!isAuthenticated && !inAuthGroup) {
            router.replace("/auth/login");
        } else if (isAuthenticated && inAuthGroup) {
            // `/auth/role-choice` (W7 §6.2) is also part of the auth group and
            // must be allowed to sit while the persona is incomplete — otp.tsx
            // sends incomplete users there. Complete personas bounce straight
            // to their home before any auth screen can render.
            if (personaComplete) {
                router.replace(isDriver ? "/(driver)" : "/(client)");
            }
        }
    }, [isAuthenticated, isLoading, loaded, segments, isDriver, personaComplete]);

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
                    <Stack.Screen name="auth/role-choice" />
                    <Stack.Screen name="onboarding/client" />
                    <Stack.Screen name="onboarding/driver" />
                    <Stack.Screen name="documents/[id]" />
                    <Stack.Screen name="(client)" />
                    <Stack.Screen name="(driver)" />
                </Stack>
            </ToastProvider>
        </QueryClientProvider>
    );
}