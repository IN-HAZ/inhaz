import { Redirect } from "expo-router";
import type { ReactNode } from "react";
import { selectIsClient, selectIsDriver, useAuthStore } from "@/lib/store/auth";

type GuardRole = "client" | "driver";

/**
 * Area-level role guard, applied once per route group layout (W5 §5.3).
 *
 * Tier 1 — area access:
 *  - unauthenticated          → `/auth/login`
 *  - authenticated, wrong role → that role's home (`/(client)` or `/(driver)`)
 *  - returns `null` until auth restoration finished, so protected content is
 *    never rendered before the auth state is known.
 *
 * Tier 2 — feature access (driver verification state) is NOT enforced here;
 * screens read `driverStatus` / `isDriverApproved` from the auth store and
 * render restricted actions disabled with a French explanation. The backend
 * stays authoritative (its 403s are final).
 */
export default function RoleGuard({ role, children }: { role: GuardRole; children: ReactNode }) {
    const isLoading = useAuthStore((s) => s.isLoading);
    const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
    const allowed = useAuthStore(role === "client" ? selectIsClient : selectIsDriver);

    if (isLoading) return null;

    if (!isAuthenticated) return <Redirect href="/auth/login" />;

    if (!allowed) {
        // Wrong persona for this group: send them to their own area's home.
        return <Redirect href={role === "client" ? "/(driver)" : "/(client)"} />;
    }

    return <>{children}</>;
}