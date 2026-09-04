import { apiClient } from './client';

export interface DashboardSummaryResponse {
  is_online: boolean;
  today_earnings_mad: number;
  commission_balance_mad: number;
  completed_trips_today: number;
  active_trip_id?: number | null;
  driver_status: string;
}

export interface ToggleOnlineResponse {
  message: string;
  is_online: boolean;
}

export const driverApi = {
  getDashboardSummary: async (): Promise<DashboardSummaryResponse> => {
    const response = await apiClient.get<DashboardSummaryResponse>('/driver/dashboard-summary');
    return response.data;
  },

  toggleOnline: async (): Promise<ToggleOnlineResponse> => {
    const response = await apiClient.post<ToggleOnlineResponse>('/driver/toggle-online');
    return response.data;
  },

  updateLocation: async (latitude: number, longitude: number): Promise<void> => {
    await apiClient.post('/driver/location', { latitude, longitude });
  },
};
