import { apiClient } from './client';
import { USE_MOCK } from './config';
import { offersApi, BrowseRequest } from './offers';
import { mockNearbyRequests, mockRequestDetailForDriver } from './mock';
import type { NearbyRequest } from './mock/types';

export interface RequestStop {
  type: 'PICKUP' | 'DESTINATION';
  order: number;
  address: string;
  latitude?: number;
  longitude?: number;
  contact_name?: string;
  contact_phone?: string;
}

export interface RequestPhotoItem {
  id: number;
  photo_key: string;
  file_name: string;
  file_type: string;
  file_size: number;
  url: string;
}

export interface DeliveryRequestItem {
  id: number;
  status: string;
  title: string | null;
  description: string | null;
  package_weight: string | null;
  package_dimensions: string | null;
  vehicle_type: string | null;
  proposed_price: string | null;
  budget_min: string | null;
  budget_max: string | null;
  preferred_date: string | null;
  preferred_time_slot: string | null;
  instructions: string | null;
  cancellation_reason: string | null;
  created_at: string;
  stops: RequestStop[];
  photos?: RequestPhotoItem[];
}

export interface Pagination {
  total: number;
  per_page: number;
  current_page: number;
  last_page: number;
}

export interface CreateRequestPayload {
  title?: string;
  description?: string;
  proposed_price?: number;
  budget_min?: number;
  budget_max?: number;
  package_weight?: number;
  vehicle_type?: string;
  preferred_date?: string;
  preferred_time_slot?: string;
  instructions?: string;
  stops: {
    type: 'PICKUP' | 'DESTINATION';
    order: number;
    address: string;
    latitude?: number;
    longitude?: number;
    contact_name?: string;
    contact_phone?: string;
  }[];
}

export interface PresignedUrlItem {
  photo_key: string;
  upload_url: string;
}

export const requestsApi = {
  list: async (page = 1) => {
    const response = await apiClient.get<{ requests: DeliveryRequestItem[]; pagination: Pagination }>(
      `/requests?page=${page}`
    );
    return response.data;
  },

  get: async (id: number) => {
    const response = await apiClient.get<{ request: DeliveryRequestItem }>(`/requests/${id}`);
    return response.data;
  },

  create: async (payload: CreateRequestPayload = { stops: [] }) => {
    const response = await apiClient.post<{ message: string; request: DeliveryRequestItem }>(
      '/requests',
      payload
    );
    return response.data;
  },

  createDraft: async () => {
    const response = await apiClient.post<{ message: string; request: DeliveryRequestItem }>(
      '/requests',
      {}
    );
    return response.data;
  },

  patchStep: async (id: number, step: string, data: Record<string, unknown>) => {
    const response = await apiClient.patch<{ message: string; request: DeliveryRequestItem }>(
      `/requests/${id}`,
      { step, ...data }
    );
    return response.data;
  },

  getPresignedUrls: async (id: number, files: { filename: string; content_type?: string; file_size?: number }[]) => {
    const response = await apiClient.post<PresignedUrlItem[]>(
      `/requests/${id}/photos/presigned-urls`,
      { files }
    );
    return response.data;
  },

  confirmPhoto: async (id: number, photoKey: string) => {
    const response = await apiClient.post<{ message: string; photo: RequestPhotoItem }>(
      `/requests/${id}/photos/confirm`,
      { photo_key: photoKey }
    );
    return response.data;
  },

  publish: async (id: number) => {
    const response = await apiClient.post<{ message: string; request: DeliveryRequestItem }>(
      `/requests/${id}/publish`
    );
    return response.data;
  },

  cancel: async (id: number, reason: string) => {
    const response = await apiClient.post<{ message: string; request: DeliveryRequestItem }>(
      `/requests/${id}/cancel`,
      { cancellation_reason: reason }
    );
    return response.data;
  },

  /**
   * Driver-facing request detail (W6 §6.4). Mock-backed until the backend
   * lets drivers read a single request (Phase B); with the flag off it falls
   * back to the browse list — today's only driver-visible source.
   */
  getForDriver: async (id: number): Promise<BrowseRequest> => {
    if (USE_MOCK) {
      return mockRequestDetailForDriver(id);
    }
    const { requests } = await offersApi.browse(1);
    const found = requests.find((r) => r.id === id);
    if (!found) {
      throw new Error('Demande introuvable.');
    }
    return found;
  },

  /**
   * Nearby open requests in the geo/marker shape (W9 driver home).
   *
   * `browse()` returns `BrowseRequest` (addresses, no map coordinates), which
   * can't feed the map markers or the live list — those operate on the
   * `NearbyRequest` shape (position + addresses + distance). This seam is
   * mock-backed until the backend ships `GET /requests/nearby` (Phase B);
   * with the flag off it returns an empty set so nothing breaks.
   */
  nearbyRequests: async (
    page = 1,
    region?: { latitude: number; longitude: number; radiusKm?: number }
  ): Promise<NearbyRequest[]> => {
    if (USE_MOCK) {
      return mockNearbyRequests(region);
    }
    // Phase B: real `GET /requests/nearby` replaces this.
    return [];
  },
};
