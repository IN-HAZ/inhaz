import { View, Text, TouchableOpacity, ScrollView, TextInput, Alert, ActivityIndicator } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, MapPin, DollarSign, Clock, Package } from 'lucide-react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { offersApi, BrowseRequest } from '@/lib/api/offers';
import { getErrorMessage } from '@/lib/api/errors';

export default function RequestDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const queryClient = useQueryClient();
  const [price, setPrice] = useState('');
  const [message, setMessage] = useState('');

  const { data, isLoading, error } = useQuery({
    queryKey: ['browse-detail', id],
    queryFn: async () => {
      const result = await offersApi.browse(1);
      return result.requests.find((r) => r.id === Number(id)) || null;
    },
    enabled: !!id,
  });

  const offerMutation = useMutation({
    mutationFn: () => offersApi.createOffer(Number(id), Number(price), message || undefined),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['browse'] });
      Alert.alert('Succ\u00e8s', 'Votre offre a \u00e9t\u00e9 soumise', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    },
  });

  if (isLoading) {
    return (
      <View className="flex-1 bg-white items-center justify-center">
        <ActivityIndicator size="large" color="#4B2861" />
      </View>
    );
  }

  if (error || !data) {
    return (
      <View className="flex-1 bg-white items-center justify-center px-6">
        <Text className="text-gray-500">{error ? getErrorMessage(error) : 'Introuvable'}</Text>
        <TouchableOpacity onPress={() => router.back()} className="mt-4">
          <Text className="text-primary-800 font-semibold">Retour</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const request = data as BrowseRequest;
  const pickup = request.stops?.find((s) => s.type === 'PICKUP');
  const destination = request.stops?.find((s) => s.type === 'DESTINATION');

  const handleSubmit = () => {
    if (!price || Number(price) <= 0) {
      Alert.alert('Erreur', 'Veuillez entrer un prix valide');
      return;
    }
    offerMutation.mutate();
  };

  return (
    <View className="flex-1 bg-gray-50">
      <View className="flex-row items-center gap-3 px-6 pt-14 pb-4 bg-white border-b border-gray-100">
        <TouchableOpacity onPress={() => router.back()} className="w-10 h-10 items-center justify-center">
          <ArrowLeft size={22} color="#1F2937" />
        </TouchableOpacity>
        <Text className="text-lg font-bold text-gray-900 flex-1">D\u00e9tail de la demande</Text>
      </View>

      <ScrollView className="flex-1 px-6 py-4" keyboardShouldPersistTaps="handled">
        {request.title && (
          <Text className="text-gray-900 text-lg font-bold mb-3">{request.title}</Text>
        )}

        {request.description && (
          <View className="bg-white rounded-xl p-4 mb-3 border border-gray-100">
            <Text className="text-xs font-semibold text-gray-400 uppercase mb-1">Description</Text>
            <Text className="text-gray-700 text-sm">{request.description}</Text>
          </View>
        )}

        {request.proposed_price && (
          <View className="bg-white rounded-xl p-4 mb-3 border border-gray-100">
            <Text className="text-xs font-semibold text-gray-400 uppercase mb-1">Prix propos\u00e9 par le client</Text>
            <Text className="text-primary-800 text-xl font-bold">{Number(request.proposed_price).toFixed(0)} MAD</Text>
          </View>
        )}

        <View className="bg-white rounded-xl p-4 mb-3 border border-gray-100">
          <Text className="text-xs font-semibold text-gray-400 uppercase mb-3">Points de passage</Text>
          {request.stops?.map((stop, index) => (
            <View key={index} className="flex-row items-start gap-3 mb-3 last:mb-0">
              <View className="w-8 h-8 rounded-xl items-center justify-center mt-0.5"
                style={{ backgroundColor: stop.type === 'PICKUP' ? '#DBEAFE' : '#FEE2E2' }}>
                <MapPin size={14} color={stop.type === 'PICKUP' ? '#2563EB' : '#DC2626'} />
              </View>
              <View className="flex-1">
                <Text className="text-xs font-bold mb-0.5"
                  style={{ color: stop.type === 'PICKUP' ? '#2563EB' : '#DC2626' }}>
                  {stop.type === 'PICKUP' ? 'Retrait' : 'Destination'}
                </Text>
                <Text className="text-gray-900 text-sm">{stop.address || 'Non renseign\u00e9'}</Text>
              </View>
            </View>
          ))}
        </View>

        <View className="bg-white rounded-xl p-4 mb-6 border border-gray-100">
          <View className="flex-row items-center gap-2">
            <Clock size={14} color="#9CA3AF" />
            <Text className="text-gray-400 text-xs">
              Publi\u00e9e le {new Date(request.created_at).toLocaleDateString('fr-FR')}
            </Text>
          </View>
          {request.offers_count > 0 && (
            <Text className="text-gray-400 text-xs mt-1">
              {request.offers_count} offre{request.offers_count !== 1 ? 's' : ''} d\u00e9j\u00e0 soumise{request.offers_count !== 1 ? 's' : ''}
            </Text>
          )}
        </View>

        <View className="bg-white rounded-xl p-4 mb-4 border border-gray-200">
          <Text className="text-gray-900 font-semibold text-sm mb-3">Votre offre</Text>

          <Text className="text-xs font-semibold text-gray-400 uppercase mb-1">Prix (MAD) *</Text>
          <TextInput
            value={price}
            onChangeText={setPrice}
            placeholder="0.00"
            keyboardType="numeric"
            className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 mb-3"
            placeholderTextColor="#9CA3AF"
          />

          <Text className="text-xs font-semibold text-gray-400 uppercase mb-1">Message (optionnel)</Text>
          <TextInput
            value={message}
            onChangeText={setMessage}
            placeholder="Pr\u00e9sentez-vous..."
            multiline
            numberOfLines={3}
            className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 mb-4"
            placeholderTextColor="#9CA3AF"
            textAlignVertical="top"
          />

          <TouchableOpacity
            onPress={handleSubmit}
            disabled={offerMutation.isPending}
            className="bg-primary-800 py-4 rounded-xl items-center"
            style={{ opacity: offerMutation.isPending ? 0.6 : 1 }}
          >
            {offerMutation.isPending ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text className="text-white font-bold text-sm">Soumettre l'offre</Text>
            )}
          </TouchableOpacity>

          {offerMutation.isError && (
            <Text className="text-red-500 text-xs text-center mt-3">{getErrorMessage(offerMutation.error)}</Text>
          )}
        </View>
      </ScrollView>
    </View>
  );
}
