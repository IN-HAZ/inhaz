import { View, Text, TouchableOpacity, FlatList, ActivityIndicator, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, User, DollarSign, Check, X } from 'lucide-react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { offersApi, OfferItem } from '@/lib/api/offers';
import { getErrorMessage } from '@/lib/api/errors';

const STATUS_CONFIG: Record<string, { label: string; badge: string; text: string }> = {
  PENDING: { label: 'En attente', badge: 'bg-amber-100', text: 'text-amber-600' },
  ACCEPTED: { label: 'Accept\u00e9e', badge: 'bg-emerald-100', text: 'text-emerald-600' },
  REJECTED: { label: 'Rejet\u00e9e', badge: 'bg-red-100', text: 'text-red-600' },
  WITHDRAWN: { label: 'Retir\u00e9e', badge: 'bg-gray-100', text: 'text-gray-500' },
};

export default function OffersScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: ['offers', id],
    queryFn: () => offersApi.listOffers(Number(id)),
    enabled: !!id,
  });

  const acceptMutation = useMutation({
    mutationFn: (offerId: number) => offersApi.acceptOffer(offerId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['offers', id] });
      queryClient.invalidateQueries({ queryKey: ['request', id] });
      queryClient.invalidateQueries({ queryKey: ['requests'] });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: (offerId: number) => offersApi.rejectOffer(offerId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['offers', id] });
    },
  });

  const handleAccept = (offer: OfferItem) => {
    Alert.alert('Accepter cette offre', `Prix: ${Number(offer.price).toFixed(0)} MAD`, [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Accepter', onPress: () => acceptMutation.mutate(offer.id) },
    ]);
  };

  const handleReject = (offer: OfferItem) => {
    Alert.alert('Rejeter cette offre', 'Confirmer le rejet ?', [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Rejeter', style: 'destructive', onPress: () => rejectMutation.mutate(offer.id) },
    ]);
  };

  const renderItem = ({ item }: { item: OfferItem }) => {
    const status = STATUS_CONFIG[item.status] || STATUS_CONFIG.PENDING;

    return (
      <View className="bg-white mx-6 mb-3 p-4 rounded-2xl border border-gray-100">
        <View className="flex-row items-center justify-between mb-3">
          <View className="flex-row items-center gap-2">
            <View className="w-8 h-8 bg-gray-100 rounded-full items-center justify-center">
              <User size={16} color="#6B7280" />
            </View>
            <View>
              <Text className="text-gray-900 text-sm font-semibold">{item.driver?.name || 'Chauffeur'}</Text>
              <Text className="text-gray-400 text-xs">{item.driver?.phone}</Text>
            </View>
          </View>
          <View className={`px-3 py-1 rounded-full ${status.badge}`}>
            <Text className={`text-xs font-semibold ${status.text}`}>{status.label}</Text>
          </View>
        </View>

        <View className="flex-row items-center gap-1 mb-2">
          <DollarSign size={16} color="#4B2861" />
          <Text className="text-primary-800 font-bold text-lg">{Number(item.price).toFixed(0)} MAD</Text>
        </View>

        {item.message && (
          <Text className="text-gray-500 text-xs mb-3">{item.message}</Text>
        )}

        {item.rejection_reason && (
          <Text className="text-red-500 text-xs mb-3">Motif: {item.rejection_reason}</Text>
        )}

        {item.status === 'PENDING' && (
          <View className="flex-row gap-3 mt-2 pt-3 border-t border-gray-50">
            <TouchableOpacity
              onPress={() => handleReject(item)}
              className="flex-1 bg-red-50 py-3 rounded-xl items-center flex-row justify-center gap-1"
            >
              <X size={14} color="#DC2626" />
              <Text className="text-red-600 font-semibold text-sm">Rejeter</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => handleAccept(item)}
              className="flex-1 bg-green-50 py-3 rounded-xl items-center flex-row justify-center gap-1"
            >
              <Check size={14} color="#16A34A" />
              <Text className="text-green-600 font-semibold text-sm">Accepter</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };

  return (
    <View className="flex-1 bg-gray-50">
      <View className="flex-row items-center gap-3 px-6 pt-14 pb-4 bg-white border-b border-gray-100">
        <TouchableOpacity onPress={() => router.back()} className="w-10 h-10 items-center justify-center">
          <ArrowLeft size={22} color="#1F2937" />
        </TouchableOpacity>
        <Text className="text-lg font-bold text-gray-900">Offres re\u00e7ues</Text>
      </View>

      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#4B2861" />
        </View>
      ) : error ? (
        <View className="flex-1 items-center justify-center px-6">
          <Text className="text-gray-500 text-center text-sm">{getErrorMessage(error)}</Text>
        </View>
      ) : data?.offers.length === 0 ? (
        <View className="flex-1 items-center justify-center px-6">
          <Text className="text-gray-500 text-center text-sm">Aucune offre re\u00e7ue</Text>
        </View>
      ) : (
        <FlatList
          data={data?.offers || []}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderItem}
          contentContainerClassName="py-4"
        />
      )}
    </View>
  );
}
