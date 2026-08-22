import { View, Text, TouchableOpacity, FlatList, ActivityIndicator, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { Plus, Package, ChevronRight, Clock, XCircle, CheckCircle } from 'lucide-react-native';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { requestsApi, DeliveryRequestItem } from '@/lib/api/requests';
import { getErrorMessage } from '@/lib/api/errors';

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; icon: typeof Clock }> = {
  DRAFT: { label: 'Brouillon', color: '#6B7280', bg: '#F3F4F6', icon: Clock },
  OPEN: { label: 'En attente', color: '#D97706', bg: '#FEF3C7', icon: Clock },
  MATCHED: { label: 'En cours', color: '#2563EB', bg: '#DBEAFE', icon: CheckCircle },
  CANCELLED: { label: 'Annulée', color: '#DC2626', bg: '#FEE2E2', icon: XCircle },
  EXPIRED: { label: 'Expirée', color: '#6B7280', bg: '#F3F4F6', icon: Clock },
};

export default function RequestsScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);

  const { data, isLoading, error, refetch, isRefetching } = useQuery({
    queryKey: ['requests', page],
    queryFn: () => requestsApi.list(page),
  });

  const renderItem = ({ item }: { item: DeliveryRequestItem }) => {
    const status = STATUS_CONFIG[item.status] || STATUS_CONFIG.DRAFT;
    const StatusIcon = status.icon;
    const pickup = item.stops?.find((s) => s.type === 'PICKUP');
    const destination = item.stops?.find((s) => s.type === 'DESTINATION');

    return (
      <TouchableOpacity
        onPress={() => router.push(`/requests/${item.id}`)}
        className="bg-white mx-6 mb-3 p-4 rounded-2xl border border-gray-100"
        style={{ elevation: 1 }}
      >
        <View className="flex-row items-center justify-between mb-3">
          <View className="flex-row items-center gap-2">
            <View className="w-8 h-8 rounded-xl items-center justify-center" style={{ backgroundColor: status.bg }}>
              <StatusIcon size={16} color={status.color} />
            </View>
            <Text className="text-xs font-semibold" style={{ color: status.color }}>
              {status.label}
            </Text>
          </View>
          {item.proposed_price && (
            <Text className="text-primary-800 font-bold text-sm">
              {Number(item.proposed_price).toFixed(0)} MAD
            </Text>
          )}
        </View>

        {item.title && (
          <Text className="text-gray-900 font-semibold text-sm mb-1" numberOfLines={1}>
            {item.title}
          </Text>
        )}

        {pickup && (
          <Text className="text-gray-500 text-xs mb-1" numberOfLines={1}>
            De: {pickup.address || 'Non renseigné'}
          </Text>
        )}
        {destination && (
          <Text className="text-gray-500 text-xs" numberOfLines={1}>
            À: {destination.address || 'Non renseigné'}
          </Text>
        )}

        <View className="flex-row items-center justify-between mt-3 pt-3 border-t border-gray-50">
          <Text className="text-gray-400 text-xs">
            {new Date(item.created_at).toLocaleDateString('fr-FR')}
          </Text>
          <ChevronRight size={16} color="#9CA3AF" />
        </View>
      </TouchableOpacity>
    );
  };

  if (isLoading) {
    return (
      <View className="flex-1 bg-gray-50 items-center justify-center">
        <ActivityIndicator size="large" color="#4B2861" />
      </View>
    );
  }

  if (error) {
    return (
      <View className="flex-1 bg-gray-50 items-center justify-center px-6">
        <Package size={48} color="#D1D5DB" />
        <Text className="text-gray-500 mt-4 text-center text-sm">{getErrorMessage(error)}</Text>
        <TouchableOpacity onPress={() => refetch()} className="mt-4 bg-primary-800 px-6 py-3 rounded-xl">
          <Text className="text-white font-semibold text-sm">Réessayer</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const requests = data?.requests || [];

  return (
    <View className="flex-1 bg-gray-50">
      <View className="flex-row items-center justify-between px-6 pt-14 pb-4 bg-white border-b border-gray-100">
        <Text className="text-2xl font-black text-primary-800">Mes Demandes</Text>
        <TouchableOpacity
          onPress={() => router.push('/requests/create')}
          className="w-10 h-10 bg-primary-800 rounded-xl items-center justify-center"
        >
          <Plus size={20} color="white" />
        </TouchableOpacity>
      </View>

      {requests.length === 0 ? (
        <View className="flex-1 items-center justify-center px-6">
          <View className="w-16 h-16 bg-gray-100 rounded-2xl items-center justify-center mb-4">
            <Package size={28} color="#9CA3AF" />
          </View>
          <Text className="text-gray-900 text-lg font-semibold mb-1">Aucune demande</Text>
          <Text className="text-gray-500 text-sm text-center font-regular">
            Créez votre première demande de livraison.
          </Text>
          <TouchableOpacity
            onPress={() => router.push('/requests/create')}
            className="mt-6 bg-primary-800 px-6 py-3 rounded-xl"
          >
            <Text className="text-white font-semibold text-sm">Créer une demande</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={requests}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderItem}
          contentContainerStyle={{ paddingVertical: 16 }}
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor="#4B2861" />}
          onEndReached={() => {
            if (data?.pagination && page < data.pagination.last_page) {
              setPage((p) => p + 1);
            }
          }}
          onEndReachedThreshold={0.3}
        />
      )}
    </View>
  );
}
