import { useEffect, useRef } from "react";
import { useQueryClient, type QueryClient } from "@tanstack/react-query";
import { subscribeLiveFeed } from "@/lib/api/feed";
import { queryKeys } from "@/lib/api/queryKeys";
import type { FeedEvent, NearbyRequest } from "@/lib/api/mock/types";

/** Cap for the in-memory `feed.live` event log (newest first). */
const FEED_CAP = 20;

/**
 * Applies one live-feed event to the TanStack cache (W9):
 *
 * - every event is appended to the `feed.live` log (newest first, capped);
 * - `new_request` → merged into the nearby-requests set (deduped by id);
 * - `request_claimed` / `request_cancelled` → dropped from the set, and the
 *   `detail-for-driver` query for that id is invalidated so an open detail
 *   screen refetches and lands in its "no longer available" state;
 * - `offer_update` / `trip_event` are pure notification events — no cache
 *   mutation (they surface as toasts in Phase B).
 */
function applyEvent(queryClient: QueryClient, event: FeedEvent) {
    const prevFeed =
        queryClient.getQueryData<FeedEvent[]>(queryKeys.feed.live) ?? [];
    queryClient.setQueryData(queryKeys.feed.live, [
        event,
        ...prevFeed,
    ].slice(0, FEED_CAP));

    const prev =
        queryClient.getQueryData<NearbyRequest[]>(
            queryKeys.nearby.requests,
        ) ?? [];

    if (event.type === "new_request" && event.request) {
        const { id } = event.request;
        if (!prev.some((r) => r.id === id)) {
            queryClient.setQueryData(queryKeys.nearby.requests, [
                event.request,
                ...prev,
            ]);
        }
        return;
    }

    if (
        (event.type === "request_claimed" ||
            event.type === "request_cancelled") &&
        event.request_id != null
    ) {
        const next = prev.filter((r) => r.id !== event.request_id);
        if (next.length !== prev.length) {
            queryClient.setQueryData(queryKeys.nearby.requests, next);
        }
        queryClient.invalidateQueries({
            queryKey: queryKeys.requests.detailForDriver(event.request_id),
        });
    }
}

/**
 * Live nearby-request updates for the driver home (W9).
 *
 * Subscribes to the feed seam ONLY while the home is focused AND the driver
 * is approved (each event mutates the shared cache). Unsubscribes on blur /
 * unapprove, so the connection is alive exactly as long as it is useful.
 * phase B swaps the whole interface (`subscribeLiveFeed` no-ops with the
 * mock flag off), leaving callers unchanged.
 */
export function useRealtimeRequests(options: { enabled: boolean }) {
    const queryClient = useQueryClient();
    const subscribedRef = useRef(false);

    useEffect(() => {
        if (!options.enabled) return;
        if (subscribedRef.current) return; // one connection, one subscription
        subscribedRef.current = true;

        const unsubscribe = subscribeLiveFeed((event) => {
            applyEvent(queryClient, event);
        });

        return () => {
            subscribedRef.current = false;
            unsubscribe();
        };
    }, [options.enabled, queryClient]);
}