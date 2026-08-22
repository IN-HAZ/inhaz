import { apiClient } from './client';

export interface RequestStop {
  type: 'PICKUP' | 'DESTINATION';
  order: number;
  address: string;
  latitude?: number;
  longitude?: number;
  contact_name?: string;
  contact_phone?: string;
}

export interface DeliveryRequestItem {
  id: number;
  status: string;
  title: string | null;
  description: string | null;
  proposed_price: string | null;
  budget_min: string | null;
  budget_max: string | null;
  package_weight: string | null;
  preferred_date: string | null;
  preferred_time_slot: string | null;
  instructions: string | null;
  cancellation_reason: string | null;
  created_at: string;
  stops: RequestStop[];
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

  create: async (payload: CreateRequestPayload) => {
    const response = await apiClient.post<{ message: string; request: DeliveryRequestItem }>(
      '/requests',
      payload
    );
    return response.data;
  },

  update: async (id: number, payload: Partial<CreateRequestPayload>) => {
    const response = await apiClient.put<{ message: string; request: DeliveryRequestItem }>(
      `/requests/${id}`,
      payload
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

  uploadPhoto: async (requestId: number, file: { uri: string; name: string; type: string }) => {
    const formData = new FormData();
    formData.append('file', {
      uri: file.uri,
      name: file.name,
      type: file.type,
    } as unknown as Blob);

    const response = await apiClient.post<{ message: string; photo: { id: number; url: string } }>(
      `/requests/${requestId}/photos`,
      formData,
      { headers: { 'Content-Type': undefined } }
    );
    return response.data;
  },

  listPhotos: async (requestId: number) => {
    const response = await apiClient.get<{ photos: { id: number; file_name: string; file_type: string; url: string }[] }>(
      `/requests/${requestId}/photos`
    );
    return response.data;
  },

  deletePhoto: async (photoId: number) => {
    const response = await apiClient.delete<{ message: string }>(`/request-photos/${photoId}`);
    return response.data;
  },
};
