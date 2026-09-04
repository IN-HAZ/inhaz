import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { driverApi, DashboardSummaryResponse, ToggleOnlineResponse } from "@/lib/api/driver";

export function useDriverDashboard() {
  const queryClient = useQueryClient();

  const dashboardQuery = useQuery<DashboardSummaryResponse>({
    queryKey: ["driver", "dashboard"],
    queryFn: () => driverApi.getDashboardSummary(),
    refetchInterval: 10000,
  });

  const toggleOnlineMutation = useMutation<ToggleOnlineResponse, Error>({
    mutationFn: () => driverApi.toggleOnline(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["driver", "dashboard"] });
    },
  });

  const updateLocationMutation = useMutation<void, Error, { latitude: number; longitude: number }>({
    mutationFn: ({ latitude, longitude }) => driverApi.updateLocation(latitude, longitude),
  });

  return {
    summary: dashboardQuery.data,
    isLoading: dashboardQuery.isLoading,
    isRefetching: dashboardQuery.isRefetching,
    error: dashboardQuery.error,
    refetch: dashboardQuery.refetch,
    toggleOnline: toggleOnlineMutation.mutateAsync,
    isTogglingOnline: toggleOnlineMutation.isPending,
    updateLocation: updateLocationMutation.mutateAsync,
  };
}
