import type { BrowseRequest } from "@/lib/api/offers";
import { mockNearbyRequests } from "./nearby";

function asBrowseRequest(
  id: number,
  title: string,
  description: string,
  proposedPrice: number,
  budgetMax: number,
  pickup: string,
  destination: string
): BrowseRequest {
  return {
    id,
    title,
    description,
    proposed_price: String(proposedPrice),
    budget_min: null,
    budget_max: String(budgetMax),
    preferred_date: new Date(Date.now() + 6 * 36e5).toISOString(),
    preferred_time_slot: null,
    package_weight: null,
    stops: [
      { type: "PICKUP", address: pickup, latitude: 33.57, longitude: -7.59 },
      { type: "DESTINATION", address: destination, latitude: 33.55, longitude: -7.61 },
    ],
    offers_count: 0,
    created_at: new Date(Date.now() - 24 * 36e5).toISOString(),
  };
}

const DETAILS: BrowseRequest[] = [
  asBrowseRequest(
    801,
    "Livraison colis — Gauthier vers Sidi Maârouf",
    "Carton de 8 kg, à livrer avant 18h. Entrée de l'immeuble, 2e étage.",
    60,
    80,
    "Bd Zerktouni, Casablanca",
    "Sidi Maârouf, Casablanca"
  ),
  asBrowseRequest(
    802,
    "Documents administratifs — Centre-ville vers Aïn Diab",
    "Enveloppes urgentes, trajet court. Remettre en personne au client.",
    45,
    55,
    "Place Mohammed V, Casablanca",
    "Aïn Diab, Casablanca"
  ),
  asBrowseRequest(
    803,
    "Électroménager — Derb Omar vers Hay Hassani",
    "Machine à laver, prévoir 2 personnes pour le chargement.",
    120,
    150,
    "Derb Omar, Casablanca",
    "Hay Hassani, Casablanca"
  ),
];

/**
 * Fake driver-facing request detail. Phase B: real `GET /requests/{id}` will
 * become driver-visible; until then this mirrors the browse detail shape.
 */
export async function mockRequestDetailForDriver(id: number): Promise<BrowseRequest> {
  await new Promise((resolve) => setTimeout(resolve, 250));
  const found = DETAILS.find((r) => r.id === id);
  if (!found) throw new Error("Demande introuvable.");
  return found;
}

/** Geo-scoped browse used by the marketplace/map (mock). */
export async function mockBrowseNearby(page = 1): Promise<{
  requests: BrowseRequest[];
  pagination: { total: number; per_page: number; current_page: number; last_page: number };
}> {
  await new Promise((resolve) => setTimeout(resolve, 200));
  const requests = mockNearbyRequests().map((r) =>
    asBrowseRequest(
      r.id,
      r.title ?? "Demande à proximité",
      r.description ?? "",
      Number(r.proposed_price ?? 0),
      Number(r.budget_max ?? 100),
      r.pickup_address,
      r.destination_address
    )
  );
  return {
    requests,
    pagination: {
      total: requests.length,
      per_page: 10,
      current_page: page,
      last_page: 1,
    },
  };
}