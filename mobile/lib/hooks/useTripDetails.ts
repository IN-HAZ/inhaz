import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { tripsApi, TripItem, Waypoint } from "@/lib/api/trips";
import { queryKeys } from "@/lib/api/queryKeys";

export function useTripDetail(id: number) {
  const queryClient = useQueryClient();

  const tripQuery = useQuery({
    queryKey: queryKeys.trips.detail(id),
    queryFn: () => tripsApi.get(id),
    enabled: !!id,
    refetchInterval: 5000,
  });

  const waypointsQuery = useQuery({
    queryKey: queryKeys.trips.waypoints(id),
    queryFn: () => tripsApi.waypoints(id),
    enabled: !!id,
  });

  const transitionMutation = useMutation({
    mutationFn: (status: string) => tripsApi.transition(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.trips.detail(id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.trips.waypoints(id) });
      queryClient.invalidateQueries({ queryKey: ["trips"] });
      queryClient.invalidateQueries({ queryKey: queryKeys.driver.dashboard });
    },
  });

  const cancelMutation = useMutation({
    mutationFn: (reason: string) => tripsApi.cancel(id, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.trips.detail(id) });
      queryClient.invalidateQueries({ queryKey: ["trips"] });
      queryClient.invalidateQueries({ queryKey: queryKeys.driver.dashboard });
    },
  });

  const rateMutation = useMutation({
    mutationFn: ({ score, comment }: { score: number; comment?: string }) =>
      tripsApi.rate(id, score, comment),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.trips.detail(id) });
    },
  });

  return {
    trip: tripQuery.data?.trip,
    waypoints: waypointsQuery.data?.waypoints ?? [],
    currentStopIndex: waypointsQuery.data?.current_stop_index ?? 0,
    isLoading: tripQuery.isLoading,
    isRefetching: tripQuery.isRefetching,
    error: tripQuery.error,
    refetch: () => {
      tripQuery.refetch();
      waypointsQuery.refetch();
    },
    transitionStatus: transitionMutation.mutateAsync,
    isTransitioning: transitionMutation.isPending,
    cancelTrip: cancelMutation.mutateAsync,
    isCancelling: cancelMutation.isPending,
    rateTrip: rateMutation.mutateAsync,
    isRating: rateMutation.isPending,
  };
}

export function useDriverTrips(page = 1) {
  const query = useQuery({
    queryKey: queryKeys.trips.list("driver", page),
    queryFn: () => tripsApi.driverTrips(page),
  });

  return {
    trips: query.data?.trips ?? [],
    pagination: query.data?.pagination,
    isLoading: query.isLoading,
    isRefetching: query.isRefetching,
    error: query.error,
    refetch: query.refetch,
  };
}

export function useClientTrips(page = 1) {
  const query = useQuery({
    queryKey: queryKeys.trips.list("client", page),
    queryFn: () => tripsApi.clientTrips(page),
  });

  return {
    trips: query.data?.trips ?? [],
    pagination: query.data?.pagination,
    isLoading: query.isLoading,
    isRefetching: query.isRefetching,
    error: query.error,
    refetch: query.refetch,
  };
}
