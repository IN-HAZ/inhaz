import type { NearbyDriver, NearbyRequest } from "./types";

/** Casablanca-centred fake geolocations, offset around a supplied point. */
const BASE = { latitude: 33.5731, longitude: -7.5898 };

function offsetPoint(
  lat: number,
  lon: number,
  index: number,
  spread: number
): { latitude: number; longitude: number } {
  const row = Math.floor(index / 3);
  const col = index % 3;
  return {
    latitude: lat + (row - 1) * spread,
    longitude: lon + (col - 1) * spread,
  };
}

const DRIVERS: Omit<NearbyDriver, "id" | "online" | "position">[] = [
  { name: "Yassine B.", rating: 4.8, vehicle: "Fiat Fiorino", registration_number: "12345-A-12" },
  { name: "Salma R.", rating: 4.9, vehicle: "Peugeot Partner", registration_number: "22345-B-6" },
  { name: "Karim T.", rating: 4.6, vehicle: "Renault Kangoo", registration_number: "32345-C-3" },
  { name: "Amine L.", rating: 4.7, vehicle: "Ford Transit", registration_number: "42345-D-8" },
  { name: "Nadia M.", rating: 5.0, vehicle: "Citroën Berlingo", registration_number: "52345-E-2" },
  { name: "Omar S.", rating: 4.5, vehicle: "Dacia Dokker", registration_number: "62345-F-9" },
];

/** Fake nearby drivers (map markers). Phase B: real `GET /driver/nearby`. */
export function mockNearbyDrivers(region?: { latitude: number; longitude: number }): NearbyDriver[] {
  const origin = region ?? BASE;
  const spread = 0.012;
  return DRIVERS.map((d, i) => ({
    ...d,
    id: 900 + i,
    online: true,
    position: offsetPoint(origin.latitude, origin.longitude, i, spread),
  }));
}

const REQUESTS: Omit<
  NearbyRequest,
  "distance_m" | "position" | "created_at"
>[] = [
  {
    id: 801,
    title: "Livraison colis — Gauthier vers Sidi Maârouf",
    description: "Carton de 8 kg, à livrer avant 18h.",
    proposed_price: "60",
    budget_max: "80",
    preferred_date: new Date(Date.now() + 36e5).toISOString(),
    pickup_address: "Bd Zerktouni, Casablanca",
    destination_address: "Sidi Maârouf, Casablanca",
  },
  {
    id: 802,
    title: "Documents administratifs — Centre-ville vers Aïn Diab",
    description: "Enveloppes urgentes, trajet court.",
    proposed_price: "45",
    budget_max: "55",
    preferred_date: new Date(Date.now() + 72e5).toISOString(),
    pickup_address: "Place Mohammed V, Casablanca",
    destination_address: "Aïn Diab, Casablanca",
  },
  {
    id: 803,
    title: "Électroménager — Derb Omar vers Hay Hassani",
    description: "Machine à laver, 2 personnes pour le chargement.",
    proposed_price: "120",
    budget_max: "150",
    preferred_date: new Date(Date.now() + 108e5).toISOString(),
    pickup_address: "Derb Omar, Casablanca",
    destination_address: "Hay Hassani, Casablanca",
  },
  {
    id: 804,
    title: "Plats traiteur — Bouskoura vers Préfecture",
    description: "Caisse isotherme, livraison pour un événement.",
    proposed_price: "90",
    budget_max: "110",
    preferred_date: new Date(Date.now() + 144e5).toISOString(),
    pickup_address: "Bouskoura",
    destination_address: "Casablanca Préfecture",
  },
];

/** Fake nearby requests (map marketplace / geo-scoped browse). Phase B: `GET /requests/nearby`. */
export function mockNearbyRequests(
  region?: { latitude: number; longitude: number }
): NearbyRequest[] {
  const origin = region ?? BASE;
  return REQUESTS.map((r, i) => ({
    ...r,
    distance_m: 850 + i * 1170,
    position: offsetPoint(origin.latitude, origin.longitude, i + 1, 0.02),
    created_at: new Date(Date.now() - i * 13 * 60 * 1000).toISOString(),
  }));
}