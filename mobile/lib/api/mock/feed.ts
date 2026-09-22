import type { FeedEvent } from "./types";

const EVENTS: Omit<FeedEvent, "id" | "created_at">[] = [
  {
    type: "new_request",
    title: "Nouvelle demande à proximité",
    message: "Livraison colis — Sidi Maârouf, 8 kg, budget 80 MAD.",
  },
  {
    type: "offer_update",
    title: "Offre acceptée",
    message: "Le client a accepté votre offre sur « Documents administratifs ».",
  },
  {
    type: "trip_event",
    title: "Course en cours",
    message: "Colis récupéré — rendez-vous à destination.",
  },
  {
    type: "new_request",
    title: "Demande urgente",
    message: "Électroménager — Hay Hassani, disponible maintenant.",
  },
];

/**
 * Mock live feed. Emits a fake event every 12s. Phase B: replace with the
 * backend realtime channel (PUSHER/SSE) behind the same `subscribeLiveFeed`
 * seam in `lib/api/feed.ts`.
 */
export function subscribeMockFeed(handler: (event: FeedEvent) => void): () => void {
  let index = 0;
  const timer = setInterval(() => {
    const base = EVENTS[index % EVENTS.length];
    index += 1;
    handler({
      ...base,
      id: `mock-feed-${index}`,
      created_at: new Date().toISOString(),
    });
  }, 12_000);
  return () => clearInterval(timer);
}