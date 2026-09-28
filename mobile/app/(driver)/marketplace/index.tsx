import { View, Text, TouchableOpacity, FlatList, TextInput, ActivityIndicator, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Search, MapPin, Package, ChevronRight, DollarSign } from 'lucide-react-native';
import { useBrowseRequests } from '@/lib/hooks/useDeliveryRequests';
import { BrowseRequest } from '@/lib/api/offers';
import { getErrorMessage } from '@/lib/api/errors';

export default function MarketplaceScreen() {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const {
    requests,
    pagination,
    isLoading,
    isRefetching,
    error,
    refetch,
  } = useBrowseRequests(page, search ? { search } : undefined);

  const renderItem = ({ item }: { item: BrowseRequest }) => {
    const pickup = item.stops?.find((s) => s.type === 'PICKUP');
    const destination = item.stops?.find((s) => s.type === 'DESTINATION');

    return (
      <TouchableOpacity
        onPress={() => router.push(`/(driver)/marketplace/${item.id}`)}
        className="bg-white mx-6 mb-3 p-4 rounded-2xl border border-gray-100 shadow-sm"
      >
        <View className="flex-row items-center justify-between mb-3">
          <View className="flex-row items-center gap-2">
            <Package size={16} color="#2563EB" />
            <Text className="text-blue-600 text-xs font-semibold">
              {item.offers_count} offre{item.offers_count !== 1 ? 's' : ''}
            </Text>
          </View>
          {item.proposed_price && (
            <View className="flex-row items-center gap-1">
              <DollarSign size={14} color="#4B2861" />
              <Text className="text-primary-800 font-bold text-sm">
                {Number(item.proposed_price).toFixed(0)} MAD
              </Text>
            </View>
          )}
        </View>

        {item.title && (
          <Text className="text-gray-900 font-semibold text-sm mb-1" numberOfLines={1}>
            {item.title}
          </Text>
        )}

        {pickup && (
          <View className="flex-row items-center gap-2 mb-1">
            <MapPin size={12} color="#2563EB" />
            <Text className="text-gray-500 text-xs flex-1" numberOfLines={1}>
              {pickup.address || 'Non renseign\u00e9'}
            </Text>
          </View>
        )}
        {destination && (
          <View className="flex-row items-center gap-2">
            <MapPin size={12} color="#DC2626" />
            <Text className="text-gray-500 text-xs flex-1" numberOfLines={1}>
              {destination.address || 'Non renseign\u00e9'}
            </Text>
          </View>
        )}

        <View className="flex-row items-center justify-between mt-3 pt-3 border-t border-gray-50">
          <Text className="text-gray-400 text-xs">
            {new Date(item.created_at).toLocaleDateString('fr-FR')}
          </Text>
          <View className="flex-row items-center gap-1">
            <Text className="text-primary-800 text-xs font-semibold">Proposer</Text>
            <ChevronRight size={14} color="#4B2861" />
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View className="flex-1 bg-gray-50">
      <View className="px-6 pt-14 pb-4 bg-white border-b border-gray-100">
        <Text className="text-2xl font-black text-primary-800 mb-3">Marketplace</Text>
        <View className="flex-row items-center bg-gray-50 rounded-xl px-3 gap-2 border border-gray-200">
          <Search size={18} color="#9CA3AF" />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Rechercher une demande..."
            className="flex-1 py-3 text-sm text-gray-900"
            placeholderTextColor="#9CA3AF"
            returnKeyType="search"
          />
        </View>
      </View>

      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#4B2861" />
        </View>
      ) : error ? (
        <View className="flex-1 items-center justify-center px-6">
          <Text className="text-gray-500 text-center text-sm">{getErrorMessage(error)}</Text>
          <TouchableOpacity onPress={() => refetch()} className="mt-4 bg-primary-800 px-6 py-3 rounded-xl">
            <Text className="text-white font-semibold text-sm">R\u00e9essayer</Text>
          </TouchableOpacity>
        </View>
      ) : requests.length === 0 ? (
        <View className="flex-1 items-center justify-center px-6">
          <Package size={48} color="#D1D5DB" />
          <Text className="text-gray-500 mt-4 text-center text-sm">Aucune demande disponible</Text>
        </View>
      ) : (
        <FlatList
          data={requests}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderItem}
          contentContainerClassName="py-4"
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor="#4B2861" />}
          onEndReached={() => {
            if (pagination && page < pagination.last_page) {
              setPage((p) => p + 1);
            }
          }}
          onEndReachedThreshold={0.3}
        />
      )}
    </View>
  );
}
