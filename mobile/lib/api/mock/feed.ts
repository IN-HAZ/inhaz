import type { FeedEvent, NearbyRequest } from "./types";
import { offsetPoint } from "./nearby";

const BASE = { latitude: 33.5731, longitude: -7.5898 };

/** Rotating fake request that "appears nearby" — distinct from the static browse set. */
function rotatingRequest(opts: {
  id: number;
  index: number;
  title: string;
  description: string;
  proposedPrice: number;
  budgetMax: number;
  pickup: string;
  destination: string;
}): NearbyRequest {
  return {
    id: opts.id,
    title: opts.title,
    description: opts.description,
    proposed_price: String(opts.proposedPrice),
    budget_max: String(opts.budgetMax),
    preferred_date: new Date(Date.now() + (opts.index + 2) * 36e5).toISOString(),
    pickup_address: opts.pickup,
    destination_address: opts.destination,
    distance_m: 900 + opts.index * 520,
    position: offsetPoint(BASE.latitude, BASE.longitude, opts.index, 0.02),
    created_at: new Date().toISOString(),
  };
}

// ── Scripted scene ─────────────────────────────────────────────────────────────
//
// Cycles forever (~8s cadence). Requests appear (new_request), get claimed /
// cancelled (removed from the live set) and the toast-style events
// (offer_update / trip_event) fire in between, so a demo shows continuous
// churn in the max-3 live list and on the map markers. `request_claimed` /
// `request_cancelled` also reference ids from the static browse set (801/802)
// so the seeded map is drained over time.
function factory(seqId: number, createdAt: string): FeedEvent {
  const base = { id: `mock-${seqId}`, created_at: createdAt };
  switch (seqId % 12) {
    case 1:
      return {
        ...base,
        type: "new_request",
        title: "Nouvelle demande à proximité",
        message: "Urgent — colis médical vers Aïn Sebaâ.",
        request: rotatingRequest({
          id: 811, index: 9,
          title: "Colis médical — Maârif vers Aïn Sebaâ",
          description: "Rapide et fragile, à livrer sous 2h.",
          proposedPrice: 55, budgetMax: 70,
          pickup: "Maârif, Casablanca", destination: "Aïn Sebaâ, Casablanca",
        }),
      };
    case 2:
      return {
        ...base,
        type: "request_claimed",
        title: "Demande prise en charge",
        message: "Un chauffeur a accepté « Livraison colis — Gauthier vers Sidi Maârouf ».",
        request_id: 801,
      };
    case 3:
      return {
        ...base,
        type: "new_request",
        title: "Nouvelle demande à proximité",
        message: "Course courte — Maârif vers Californie.",
        request: rotatingRequest({
          id: 812, index: 10,
          title: "Courses — Maârif vers Californie",
          description: "Enveloppes à remettre en main propre.",
          proposedPrice: 40, budgetMax: 60,
          pickup: "Maârif, Casablanca", destination: "Californie, Casablanca",
        }),
      };
    case 4:
      return {
        ...base,
        type: "offer_update",
        title: "Offre acceptée",
        message: "Le client a accepté votre offre sur « Documents administratifs ».",
      };
    case 5:
      return {
        ...base,
        type: "request_cancelled",
        title: "Demande annulée",
        message: "Le client a annulé « Colis médical — Maârif vers Aïn Sebaâ ».",
        request_id: 811,
      };
    case 6:
      return {
        ...base,
        type: "new_request",
        title: "Nouvelle demande à proximité",
        message: "Électroménager — Sidi Bernoussi vers Oulfa.",
        request: rotatingRequest({
          id: 813, index: 11,
          title: "Électroménager — Sidi Bernoussi vers Oulfa",
          description: "Machine à laver, 2 personnes pour le chargement.",
          proposedPrice: 130, budgetMax: 170,
          pickup: "Sidi Bernoussi, Casablanca", destination: "Oulfa, Casablanca",
        }),
      };
    case 7:
      return {
        ...base,
        type: "request_cancelled",
        title: "Demande retirée",
        message: "« Documents administratifs » n'est plus disponible.",
        request_id: 802,
      };
    case 8:
      return {
        ...base,
        type: "new_request",
        title: "Nouvelle demande à proximité",
        message: "Déménagement partiel — Oasis vers Californie.",
        request: rotatingRequest({
          id: 814, index: 12,
          title: "Déménagement partiel — Oasis vers Californie",
          description: "Quelques cartons + petit mobilier.",
          proposedPrice: 200, budgetMax: 260,
          pickup: "Oasis, Casablanca", destination: "Californie, Casablanca",
        }),
      };
    case 9:
      return {
        ...base,
        type: "trip_event",
        title: "Course en cours",
        message: "Colis récupéré — en route vers la destination.",
      };
    case 10:
      return {
        ...base,
        type: "request_claimed",
        title: "Demande prise en charge",
        message: "Un collègue a accepté « Courses — Maârif vers Californie ».",
        request_id: 812,
      };
    case 11:
      return {
        ...base,
        type: "new_request",
        title: "Nouvelle demande à proximité",
        message: "Fleurs — Quartier des Habous.",
        request: rotatingRequest({
          id: 815, index: 13,
          title: "Livraison fleurs — Quartier des Habous",
          description: "Livraison soignée, avant 17h.",
          proposedPrice: 35, budgetMax: 50,
          pickup: "Quartier des Habous, Casablanca", destination: "Centre-ville, Casablanca",
        }),
      };
    default:
      return {
        ...base,
        type: "request_claimed",
        title: "Demande prise en charge",
        message: "« Électroménager — Sidi Bernoussi » a été attribué à un confrère.",
        request_id: 813,
      };
  }
}

/**
 * Mock live feed (W9 driver home). Emits a scripted nearby-request event
 * every 8s — new requests appear, others get claimed/cancelled, plus a few
 * toast-style offer/trip events. Phase B: replace with the backend realtime
 * channel (PUSHER/SSE) behind the same `subscribeLiveFeed` seam in
 * `lib/api/feed.ts`.
 */
export function subscribeMockFeed(handler: (event: FeedEvent) => void): () => void {
  let seq = 0;
  const timer = setInterval(() => {
    seq += 1;
    handler(factory(seq, new Date().toISOString()));
  }, 8_000);
  return () => clearInterval(timer);
}