import { apiClient } from './client';

export interface BrowseRequest {
  id: number;
  title: string | null;
  description: string | null;
  proposed_price: string | null;
  budget_min: string | null;
  budget_max: string | null;
  preferred_date: string | null;
  preferred_time_slot: string | null;
  package_weight: string | null;
  stops: {
    type: 'PICKUP' | 'DESTINATION';
    address: string | null;
    latitude: number | null;
    longitude: number | null;
  }[];
  offers_count: number;
  created_at: string;
}

export interface OfferItem {
  id: number;
  status: string;
  price: string;
  message: string | null;
  rejection_reason: string | null;
  driver: { id: number; name: string; phone: string } | null;
  created_at: string;
}

export interface Pagination {
  total: number;
  per_page: number;
  current_page: number;
  last_page: number;
}

export const offersApi = {
  browse: async (page = 1, params?: { search?: string; budget_min?: number; budget_max?: number }) => {
    const query = new URLSearchParams({ page: String(page) });
    if (params?.search) query.set('search', params.search);
    if (params?.budget_min) query.set('budget_min', String(params.budget_min));
    if (params?.budget_max) query.set('budget_max', String(params.budget_max));

    const response = await apiClient.get<{ requests: BrowseRequest[]; pagination: Pagination }>(
      `/requests/browse?${query.toString()}`
    );
    return response.data;
  },

  createOffer: async (requestId: number, price: number, message?: string) => {
    const response = await apiClient.post<{ message: string; offer: OfferItem }>(
      `/requests/${requestId}/offers`,
      { price, message }
    );
    return response.data;
  },

  listOffers: async (requestId: number) => {
    const response = await apiClient.get<{ offers: OfferItem[] }>(
      `/requests/${requestId}/offers`
    );
    return response.data;
  },

  acceptOffer: async (offerId: number) => {
    const response = await apiClient.post<{ message: string; offer: OfferItem }>(
      `/offers/${offerId}/accept`
    );
    return response.data;
  },

  rejectOffer: async (offerId: number, reason?: string) => {
    const response = await apiClient.post<{ message: string; offer: OfferItem }>(
      `/offers/${offerId}/reject`,
      { rejection_reason: reason }
    );
    return response.data;
  },

  withdrawOffer: async (offerId: number) => {
    const response = await apiClient.post<{ message: string; offer: OfferItem }>(
      `/offers/${offerId}/withdraw`
    );
    return response.data;
  },
};
