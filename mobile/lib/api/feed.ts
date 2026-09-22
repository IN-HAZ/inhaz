import { USE_MOCK } from "./config";
import { subscribeMockFeed } from "./mock";
import type { FeedEvent, FeedEventType } from "./mock/types";

export type { FeedEvent, FeedEventType };

export type FeedHandler = (event: FeedEvent) => void;

/**
 * Live in-app event feed (W6 §6.5). Mock-backed until the backend ships a
 * realtime channel (Phase B) — subscribing with the flag off is currently a
 * no-op that returns a no-op unsubscribe, keeping callers safe either way.
 */
export function subscribeLiveFeed(handler: FeedHandler): () => void {
  if (USE_MOCK) {
    return subscribeMockFeed(handler);
  }
  return () => {
    // Real channel (PUSHER/SSE) lands with the Phase B backend ticket.
  };
}