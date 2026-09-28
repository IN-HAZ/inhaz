import { View, Text, TouchableOpacity, FlatList, ActivityIndicator, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { Package, ChevronRight } from 'lucide-react-native';
import { tripsApi, TripItem, getStatusLabel } from '@/lib/api/trips';
import { queryKeys } from '@/lib/api/queryKeys';
import { getErrorMessage } from '@/lib/api/errors';
import { useRole } from '@/lib/store/auth';

const STATUS_COLORS: Record<string, { badge: string; text: string }> = {
  ASSIGNED: { badge: 'bg-amber-100', text: 'text-amber-600' },
  DRIVER_EN_ROUTE: { badge: 'bg-blue-100', text: 'text-blue-600' },
  AT_PICKUP: { badge: 'bg-purple-100', text: 'text-purple-600' },
  PICKED_UP: { badge: 'bg-emerald-100', text: 'text-emerald-600' },
  IN_TRANSIT: { badge: 'bg-blue-100', text: 'text-blue-600' },
  AT_DESTINATION: { badge: 'bg-purple-100', text: 'text-purple-600' },
  DELIVERED: { badge: 'bg-green-100', text: 'text-green-600' },
  CANCELLED: { badge: 'bg-red-100', text: 'text-red-600' },
};

export default function TripsScreen() {
  const router = useRouter();
  const { isDriver } = useRole();

  const { data, isLoading, error, refetch, isRefetching } = useQuery({
    queryKey: queryKeys.trips.list(isDriver ? 'driver' : 'client'),
    queryFn: () => isDriver ? tripsApi.driverTrips() : tripsApi.clientTrips(),
  });

  const renderItem = ({ item }: { item: TripItem }) => {
    const statusStyle = STATUS_COLORS[item.status] || { badge: 'bg-gray-100', text: 'text-gray-500' };
    const pickup = item.delivery_request?.stops?.find((s) => s.type === 'PICKUP');
    const destination = item.delivery_request?.stops?.find((s) => s.type === 'DESTINATION');
    const otherParty = isDriver ? item.client : item.driver;

    return (
      <TouchableOpacity
        onPress={() => router.push(`/trips/${item.id}` as any)}
        className="bg-white mx-6 mb-3 p-4 rounded-2xl border border-gray-100 shadow-sm"
      >
        <View className="flex-row items-center justify-between mb-3">
          <View className={`px-3 py-1 rounded-full ${statusStyle.badge}`}>
            <Text className={`text-xs font-semibold ${statusStyle.text}`}>
              {getStatusLabel(item.status)}
            </Text>
          </View>
          <Text className="text-primary-800 font-bold text-sm">
            {Number(item.agreed_price).toFixed(0)} MAD
          </Text>
        </View>

        {item.delivery_request?.title && (
          <Text className="text-gray-900 font-semibold text-sm mb-1" numberOfLines={1}>
            {item.delivery_request.title}
          </Text>
        )}

        {pickup && (
          <Text className="text-gray-500 text-xs mb-1" numberOfLines={1}>
            De: {pickup.address || 'Non renseign\u00e9'}
          </Text>
        )}
        {destination && (
          <Text className="text-gray-500 text-xs" numberOfLines={1}>
            \u00c0: {destination.address || 'Non renseign\u00e9'}
          </Text>
        )}

        {otherParty && (
          <Text className="text-gray-400 text-xs mt-2">
            {isDriver ? 'Client' : 'Chauffeur'}: {otherParty.name}
          </Text>
        )}

        <View className="flex-row items-center justify-end mt-2 pt-2 border-t border-gray-50">
          <Text className="text-gray-400 text-xs">
            {new Date(item.created_at).toLocaleDateString('fr-FR')}
          </Text>
          <ChevronRight size={14} color="#9CA3AF" />
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
          <Text className="text-white font-semibold text-sm">R\u00e9essayer</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const trips = data?.trips || [];

  return (
    <View className="flex-1 bg-gray-50">
      <View className="px-6 pt-14 pb-4 bg-white border-b border-gray-100">
        <Text className="text-2xl font-black text-primary-800">
          {isDriver ? 'Mes trajets' : 'Mes livraisons'}
        </Text>
      </View>

      {trips.length === 0 ? (
        <View className="flex-1 items-center justify-center px-6">
          <Package size={48} color="#D1D5DB" />
          <Text className="text-gray-500 mt-4 text-center text-sm">Aucun trajet</Text>
        </View>
      ) : (
        <FlatList
          data={trips}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderItem}
          contentContainerClassName="py-4"
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor="#4B2861" />}
        />
      )}
    </View>
  );
}
