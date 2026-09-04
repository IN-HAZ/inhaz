import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { requestsApi, CreateRequestPayload, DeliveryRequestItem } from "@/lib/api/requests";
import { offersApi, OfferItem, BrowseRequest } from "@/lib/api/offers";

export function useDeliveryRequests(page = 1) {
  const queryClient = useQueryClient();

  const requestsQuery = useQuery({
    queryKey: ["requests", "list", page],
    queryFn: () => requestsApi.list(page),
  });

  const createMutation = useMutation({
    mutationFn: (payload: CreateRequestPayload) => requestsApi.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["requests"] });
    },
  });

  const cancelMutation = useMutation({
    mutationFn: ({ id, reason }: { id: number; reason: string }) => requestsApi.cancel(id, reason),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["requests", "list"] });
      queryClient.invalidateQueries({ queryKey: ["requests", "detail", variables.id] });
    },
  });

  return {
    requests: requestsQuery.data?.requests ?? [],
    pagination: requestsQuery.data?.pagination,
    isLoading: requestsQuery.isLoading,
    isRefetching: requestsQuery.isRefetching,
    error: requestsQuery.error,
    refetch: requestsQuery.refetch,
    createRequest: createMutation.mutateAsync,
    isCreating: createMutation.isPending,
    cancelRequest: cancelMutation.mutateAsync,
    isCancelling: cancelMutation.isPending,
  };
}

export function useRequestDetail(id: number) {
  const queryClient = useQueryClient();

  const detailQuery = useQuery({
    queryKey: ["requests", "detail", id],
    queryFn: () => requestsApi.get(id),
    enabled: !!id,
  });

  const offersQuery = useQuery({
    queryKey: ["requests", id, "offers"],
    queryFn: () => offersApi.listOffers(id),
    enabled: !!id,
  });

  const acceptOfferMutation = useMutation({
    mutationFn: (offerId: number) => offersApi.acceptOffer(offerId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["requests", "detail", id] });
      queryClient.invalidateQueries({ queryKey: ["requests", id, "offers"] });
      queryClient.invalidateQueries({ queryKey: ["trips"] });
    },
  });

  const rejectOfferMutation = useMutation({
    mutationFn: ({ offerId, reason }: { offerId: number; reason?: string }) =>
      offersApi.rejectOffer(offerId, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["requests", id, "offers"] });
    },
  });

  return {
    request: detailQuery.data?.request,
    offers: offersQuery.data?.offers ?? [],
    isLoading: detailQuery.isLoading || offersQuery.isLoading,
    error: detailQuery.error || offersQuery.error,
    refetch: () => {
      detailQuery.refetch();
      offersQuery.refetch();
    },
    acceptOffer: acceptOfferMutation.mutateAsync,
    isAccepting: acceptOfferMutation.isPending,
    rejectOffer: rejectOfferMutation.mutateAsync,
    isRejecting: rejectOfferMutation.isPending,
  };
}

export function useBrowseRequests(page = 1, params?: { search?: string; budget_min?: number; budget_max?: number }) {
  const queryClient = useQueryClient();

  const browseQuery = useQuery({
    queryKey: ["requests", "browse", page, params],
    queryFn: () => offersApi.browse(page, params),
  });

  const submitOfferMutation = useMutation({
    mutationFn: ({ requestId, price, message }: { requestId: number; price: number; message?: string }) =>
      offersApi.createOffer(requestId, price, message),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["requests", "browse"] });
      queryClient.invalidateQueries({ queryKey: ["requests", "detail", variables.requestId] });
      queryClient.invalidateQueries({ queryKey: ["requests", variables.requestId, "offers"] });
    },
  });

  return {
    requests: browseQuery.data?.requests ?? [],
    pagination: browseQuery.data?.pagination,
    isLoading: browseQuery.isLoading,
    isRefetching: browseQuery.isRefetching,
    error: browseQuery.error,
    refetch: browseQuery.refetch,
    submitOffer: submitOfferMutation.mutateAsync,
    isSubmittingOffer: submitOfferMutation.isPending,
  };
}
