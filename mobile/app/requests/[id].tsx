import { View, Text, TouchableOpacity, ScrollView, Alert, ActivityIndicator, TextInput } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, MapPin, Clock, XCircle, Package, FileText } from 'lucide-react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { requestsApi, DeliveryRequestItem } from '@/lib/api/requests';
import { getErrorMessage } from '@/lib/api/errors';

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  DRAFT: { label: 'Brouillon', color: '#6B7280', bg: '#F3F4F6' },
  OPEN: { label: 'En attente', color: '#D97706', bg: '#FEF3C7' },
  MATCHED: { label: 'En cours', color: '#2563EB', bg: '#DBEAFE' },
  CANCELLED: { label: 'Annulée', color: '#DC2626', bg: '#FEE2E2' },
  EXPIRED: { label: 'Expirée', color: '#6B7280', bg: '#F3F4F6' },
};

export default function RequestDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const queryClient = useQueryClient();
  const [cancelReason, setCancelReason] = useState('');
  const [showCancel, setShowCancel] = useState(false);

  const { data, isLoading, error } = useQuery({
    queryKey: ['request', id],
    queryFn: () => requestsApi.get(Number(id)),
    enabled: !!id,
  });

  const cancelMutation = useMutation({
    mutationFn: (reason: string) => requestsApi.cancel(Number(id), reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['requests'] });
      queryClient.invalidateQueries({ queryKey: ['request', id] });
      setShowCancel(false);
      setCancelReason('');
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

  const request: DeliveryRequestItem = data.request;
  const status = STATUS_CONFIG[request.status] || STATUS_CONFIG.DRAFT;
  const canCancel = request.status === 'DRAFT' || request.status === 'OPEN';

  const handleCancel = () => {
    if (!cancelReason.trim()) {
      Alert.alert('Erreur', 'Veuillez indiquer un motif d\'annulation.');
      return;
    }
    cancelMutation.mutate(cancelReason);
  };

  return (
    <View className="flex-1 bg-gray-50">
      <View className="flex-row items-center gap-3 px-6 pt-14 pb-4 bg-white border-b border-gray-100">
        <TouchableOpacity onPress={() => router.back()} className="w-10 h-10 items-center justify-center">
          <ArrowLeft size={22} color="#1F2937" />
        </TouchableOpacity>
        <Text className="text-lg font-bold text-gray-900 flex-1">Demande #{request.id}</Text>
        <View className="px-3 py-1 rounded-full" style={{ backgroundColor: status.bg }}>
          <Text className="text-xs font-semibold" style={{ color: status.color }}>{status.label}</Text>
        </View>
      </View>

      <ScrollView className="flex-1 px-6 py-4">
        {request.title && (
          <View className="mb-4">
            <Text className="text-gray-900 text-lg font-bold">{request.title}</Text>
          </View>
        )}

        {request.description && (
          <View className="bg-white rounded-xl p-4 mb-3 border border-gray-100">
            <View className="flex-row items-center gap-2 mb-2">
              <FileText size={14} color="#6B7280" />
              <Text className="text-xs font-semibold text-gray-400 uppercase">Description</Text>
            </View>
            <Text className="text-gray-700 text-sm">{request.description}</Text>
          </View>
        )}

        {request.proposed_price && (
          <View className="bg-white rounded-xl p-4 mb-3 border border-gray-100">
            <Text className="text-xs font-semibold text-gray-400 uppercase mb-1">Prix proposé</Text>
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
                <Text className="text-gray-900 text-sm">{stop.address || 'Non renseigné'}</Text>
                {stop.contact_name && (
                  <Text className="text-gray-500 text-xs mt-0.5">{stop.contact_name}{stop.contact_phone ? ` • ${stop.contact_phone}` : ''}</Text>
                )}
              </View>
            </View>
          ))}
        </View>

        {request.instructions && (
          <View className="bg-white rounded-xl p-4 mb-3 border border-gray-100">
            <Text className="text-xs font-semibold text-gray-400 uppercase mb-1">Instructions</Text>
            <Text className="text-gray-700 text-sm">{request.instructions}</Text>
          </View>
        )}

        <View className="bg-white rounded-xl p-4 mb-3 border border-gray-100">
          <View className="flex-row items-center gap-2">
            <Clock size={14} color="#9CA3AF" />
            <Text className="text-gray-400 text-xs">
              Créée le {new Date(request.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
            </Text>
          </View>
        </View>

        {request.cancellation_reason && (
          <View className="bg-red-50 rounded-xl p-4 mb-3 border border-red-100">
            <Text className="text-xs font-semibold text-red-500 uppercase mb-1">Motif d'annulation</Text>
            <Text className="text-red-700 text-sm">{request.cancellation_reason}</Text>
          </View>
        )}

        {canCancel && (
          <View className="mt-2 mb-8">
            {!showCancel ? (
              <View className="gap-3">
                <TouchableOpacity
                  onPress={() => router.push(`/requests/offers/${id}`)}
                  className="bg-primary-50 border border-primary-200 py-4 rounded-xl items-center"
                >
                  <Text className="text-primary-800 font-bold text-sm">Voir les offres re\u00e7ues</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => setShowCancel(true)}
                  className="bg-red-50 border border-red-200 py-4 rounded-xl items-center"
                >
                  <View className="flex-row items-center gap-2">
                    <XCircle size={18} color="#DC2626" />
                    <Text className="text-red-600 font-bold text-sm">Annuler la demande</Text>
                  </View>
                </TouchableOpacity>
              </View>
            ) : (
              <View className="bg-white rounded-xl p-4 border border-red-200">
                <Text className="text-gray-900 font-semibold text-sm mb-2">Motif d'annulation *</Text>
                <TextInput
                  value={cancelReason}
                  onChangeText={setCancelReason}
                  placeholder="Pourquoi annulez-vous ?"
                  multiline
                  numberOfLines={3}
                  className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-900 mb-3"
                  placeholderTextColor="#9CA3AF"
                  textAlignVertical="top"
                />
                <View className="flex-row gap-3">
                  <TouchableOpacity
                    onPress={() => { setShowCancel(false); setCancelReason(''); }}
                    className="flex-1 bg-gray-100 py-3 rounded-xl items-center"
                  >
                    <Text className="text-gray-600 font-semibold text-sm">Non</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={handleCancel}
                    disabled={cancelMutation.isPending}
                    className="flex-1 bg-red-600 py-3 rounded-xl items-center"
                    style={{ opacity: cancelMutation.isPending ? 0.6 : 1 }}
                  >
                    {cancelMutation.isPending ? (
                      <ActivityIndicator color="white" />
                    ) : (
                      <Text className="text-white font-bold text-sm">Confirmer</Text>
                    )}
                  </TouchableOpacity>
                </View>
                {cancelMutation.isError && (
                  <Text className="text-red-500 text-xs mt-2">{getErrorMessage(cancelMutation.error)}</Text>
                )}
              </View>
            )}
          </View>
        )}
      </ScrollView>
    </View>
  );
}
