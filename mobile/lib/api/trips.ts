import { apiClient } from './client';

export interface TripItem {
  id: number;
  status: string;
  agreed_price: string;
  final_price: string | null;
  assigned_at: string | null;
  picked_up_at: string | null;
  delivered_at: string | null;
  cancelled_at: string | null;
  cancellation_reason: string | null;
  delivery_request: {
    id: number;
    title: string | null;
    stops: { type: string; address: string | null; latitude: number | null; longitude: number | null }[];
  } | null;
  driver: { id: number; name: string; phone: string } | null;
  client: { id: number; name: string; phone: string } | null;
  created_at: string;
}

export interface Waypoint {
  type: string;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  contact_name: string | null;
  contact_phone: string | null;
}

export interface Pagination {
  total: number;
  per_page: number;
  current_page: number;
  last_page: number;
}

const VALID_TRANSITIONS: Record<string, string[]> = {
  ASSIGNED: ['DRIVER_EN_ROUTE'],
  DRIVER_EN_ROUTE: ['AT_PICKUP'],
  AT_PICKUP: ['PICKED_UP'],
  PICKED_UP: ['IN_TRANSIT'],
  IN_TRANSIT: ['AT_DESTINATION'],
  AT_DESTINATION: ['DELIVERED'],
};

export function getNextStatus(current: string): string | null {
  return VALID_TRANSITIONS[current]?.[0] || null;
}

export function getStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    ASSIGNED: 'Assign\u00e9',
    DRIVER_EN_ROUTE: 'En chemin',
    AT_PICKUP: 'Au point de retrait',
    PICKED_UP: 'Colis r\u00e9cup\u00e9r\u00e9',
    IN_TRANSIT: 'En transit',
    AT_DESTINATION: ' \u00e0 destination',
    DELIVERED: 'Livr\u00e9',
    CANCELLED: 'Annul\u00e9',
  };
  return labels[status] || status;
}

export const tripsApi = {
  get: async (id: number) => {
    const response = await apiClient.get<{ trip: TripItem }>(`/trips/${id}`);
    return response.data;
  },

  driverTrips: async (page = 1) => {
    const response = await apiClient.get<{ trips: TripItem[]; pagination: Pagination }>(
      `/driver/trips?page=${page}`
    );
    return response.data;
  },

  clientTrips: async (page = 1) => {
    const response = await apiClient.get<{ trips: TripItem[]; pagination: Pagination }>(
      `/client/trips?page=${page}`
    );
    return response.data;
  },

  transition: async (id: number, status: string) => {
    const response = await apiClient.post<{ message: string; trip: TripItem }>(
      `/trips/${id}/transition`,
      { status }
    );
    return response.data;
  },

  cancel: async (id: number, reason: string) => {
    const response = await apiClient.post<{ message: string; trip: TripItem }>(
      `/trips/${id}/cancel`,
      { cancellation_reason: reason }
    );
    return response.data;
  },

  waypoints: async (id: number) => {
    const response = await apiClient.get<{ trip_id: number; status: string; current_stop_index: number; waypoints: Waypoint[] }>(
      `/trips/${id}/waypoints`
    );
    return response.data;
  },

  rate: async (id: number, score: number, comment?: string) => {
    const response = await apiClient.post<{ message: string; rating: { id: number; score: number; comment: string | null } }>(
      `/trips/${id}/rate`,
      { score, comment }
    );
    return response.data;
  },
};
