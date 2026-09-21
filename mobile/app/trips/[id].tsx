import { View, Text, TouchableOpacity, ScrollView, Alert, ActivityIndicator, TextInput } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';
import { useState } from 'react';
import { TripItem, getNextStatus, getStatusLabel } from '@/lib/api/trips';
import { useTripDetail } from '@/lib/hooks/useTripDetails';
import { getErrorMessage } from '@/lib/api/errors';
import { useAuthStore } from '@/lib/store/auth';

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

export default function TripDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuthStore();
  const isDriver = user?.role === 'driver';
  const [cancelReason, setCancelReason] = useState('');
  const [showCancel, setShowCancel] = useState(false);
  const [showRate, setShowRate] = useState(false);
  const [ratingScore, setRatingScore] = useState(0);
  const [ratingComment, setRatingComment] = useState('');

  const {
    trip,
    isLoading,
    error,
    transitionStatus,
    isTransitioning,
    cancelTrip,
    isCancelling,
    rateTrip,
    isRating,
  } = useTripDetail(Number(id));

  const handleTransition = async (status: string) => {
    try {
      await transitionStatus(status);
    } catch (e: any) {
      Alert.alert('Erreur', getErrorMessage(e));
    }
  };

  const handleCancel = async () => {
    try {
      await cancelTrip(cancelReason);
      setShowCancel(false);
      setCancelReason('');
    } catch (e: any) {
      Alert.alert('Erreur', getErrorMessage(e));
    }
  };

  const handleRate = async () => {
    try {
      await rateTrip({ score: ratingScore, comment: ratingComment || undefined });
      setShowRate(false);
      setRatingScore(0);
      setRatingComment('');
    } catch (e: any) {
      Alert.alert('Erreur', getErrorMessage(e));
    }
  };

  if (isLoading) return <View className="flex-1 bg-white items-center justify-center"><ActivityIndicator size="large" color="#4B2861" /></View>;

  if (error || !trip) return (
    <View className="flex-1 bg-white items-center justify-center px-6">
      <Text className="text-gray-500">{error ? getErrorMessage(error) : 'Introuvable'}</Text>
      <TouchableOpacity onPress={() => router.back()} className="mt-4"><Text className="text-primary-800 font-semibold">Retour</Text></TouchableOpacity>
    </View>
  );

  const statusStyle = STATUS_COLORS[trip.status] || { badge: 'bg-gray-100', text: 'text-gray-500' };
  const nextStatus = isDriver ? getNextStatus(trip.status) : null;
  const canCancel = trip.status === 'ASSIGNED' || trip.status === 'DRIVER_EN_ROUTE';
  const isCompleted = trip.status === 'DELIVERED';
  const pickup = trip.delivery_request?.stops?.find((s) => s.type === 'PICKUP');
  const destination = trip.delivery_request?.stops?.find((s) => s.type === 'DESTINATION');
  const otherParty = isDriver ? trip.client : trip.driver;

  return (
    <View className="flex-1 bg-gray-50">
      <View className="flex-row items-center gap-3 px-6 pt-14 pb-4 bg-white border-b border-gray-100">
        <TouchableOpacity onPress={() => router.back()} className="w-10 h-10 items-center justify-center">
          <ArrowLeft size={22} color="#1F2937" />
        </TouchableOpacity>
        <Text className="text-lg font-bold text-gray-900 flex-1">Trajet #{trip.id}</Text>
        <View className={`px-3 py-1 rounded-full ${statusStyle.badge}`}>
          <Text className={`text-xs font-semibold ${statusStyle.text}`}>{getStatusLabel(trip.status)}</Text>
        </View>
      </View>

      <ScrollView className="flex-1 px-6 py-4">
        {trip.delivery_request?.title && <Text className="text-gray-900 text-lg font-bold mb-3">{trip.delivery_request.title}</Text>}

        <View className="bg-white rounded-xl p-4 mb-3 border border-gray-100">
          <Text className="text-primary-800 text-xl font-bold">{Number(trip.agreed_price).toFixed(0)} MAD</Text>
        </View>

        <View className="bg-white rounded-xl p-4 mb-3 border border-gray-100">
          <Text className="text-xs font-semibold text-gray-400 uppercase mb-3">Itin\u00e9raire</Text>
          {pickup && <View className="flex-row items-center gap-2 mb-2"><View className="w-3 h-3 rounded-full bg-blue-500" /><Text className="text-gray-900 text-sm flex-1">{pickup.address || 'Non renseign\u00e9'}</Text></View>}
          {destination && <View className="flex-row items-center gap-2"><View className="w-3 h-3 rounded-full bg-red-500" /><Text className="text-gray-900 text-sm flex-1">{destination.address || 'Non renseign\u00e9'}</Text></View>}
        </View>

        {otherParty && (
          <View className="bg-white rounded-xl p-4 mb-3 border border-gray-100">
            <Text className="text-xs font-semibold text-gray-400 uppercase mb-1">{isDriver ? 'Client' : 'Chauffeur'}</Text>
            <Text className="text-gray-900 text-sm">{otherParty.name}</Text>
            <Text className="text-gray-500 text-xs">{otherParty.phone}</Text>
          </View>
        )}

        {trip.cancellation_reason && (
          <View className="bg-red-50 rounded-xl p-4 mb-3 border border-red-100">
            <Text className="text-xs font-semibold text-red-500 uppercase mb-1">Motif d'annulation</Text>
            <Text className="text-red-700 text-sm">{trip.cancellation_reason}</Text>
          </View>
        )}

        {nextStatus && !isCompleted && trip.status !== 'CANCELLED' && (
          <TouchableOpacity onPress={() => Alert.alert('Avancer', `Passer \u00e0 "${getStatusLabel(nextStatus)}" ?`, [{ text: 'Annuler', style: 'cancel' }, { text: 'Confirmer', onPress: () => handleTransition(nextStatus) }])} disabled={isTransitioning} className={`bg-primary-800 py-4 rounded-xl items-center mb-3 ${isTransitioning ? 'opacity-60' : ''}`}>
            <Text className="text-white font-bold text-sm">{isTransitioning ? 'En cours...' : `Marquer: ${getStatusLabel(nextStatus)}`}</Text>
          </TouchableOpacity>
        )}

        {canCancel && !showCancel && (
          <TouchableOpacity onPress={() => setShowCancel(true)} className="bg-red-50 border border-red-200 py-4 rounded-xl items-center mb-3">
            <Text className="text-red-600 font-bold text-sm">Annuler le trajet</Text>
          </TouchableOpacity>
        )}

        {showCancel && (
          <View className="bg-white rounded-xl p-4 border border-red-200 mb-3">
            <TextInput value={cancelReason} onChangeText={setCancelReason} placeholder="Motif d'annulation" multiline className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-900 mb-3" placeholderTextColor="#9CA3AF" textAlignVertical="top" />
            <View className="flex-row gap-3">
              <TouchableOpacity onPress={() => { setShowCancel(false); setCancelReason(''); }} className="flex-1 bg-gray-100 py-3 rounded-xl items-center"><Text className="text-gray-600 font-semibold text-sm">Non</Text></TouchableOpacity>
              <TouchableOpacity onPress={() => { if (!cancelReason.trim()) { Alert.alert('Erreur', 'Motif requis'); return; } handleCancel(); }} disabled={isCancelling} className="flex-1 bg-red-600 py-3 rounded-xl items-center">
                {isCancelling ? <ActivityIndicator color="white" /> : <Text className="text-white font-bold text-sm">Confirmer</Text>}
              </TouchableOpacity>
            </View>
          </View>
        )}

        {isCompleted && !showRate && (
          <TouchableOpacity onPress={() => setShowRate(true)} className="bg-yellow-50 border border-yellow-200 py-4 rounded-xl items-center mb-3">
            <Text className="text-yellow-700 font-bold text-sm">Noter ce trajet</Text>
          </TouchableOpacity>
        )}

        {showRate && (
          <View className="bg-white rounded-xl p-4 border border-yellow-200 mb-3">
            <Text className="text-gray-900 font-semibold text-sm mb-3">Votre note</Text>
            <View className="flex-row justify-center gap-2 mb-3">
              {[1, 2, 3, 4, 5].map((s) => (
                <TouchableOpacity key={s} onPress={() => setRatingScore(s)} className={`w-12 h-12 rounded-xl items-center justify-center ${s <= ratingScore ? 'bg-yellow-400' : 'bg-gray-100'}`}>
                  <Text className="text-lg">{s <= ratingScore ? '\u2605' : '\u2606'}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <TextInput value={ratingComment} onChangeText={setRatingComment} placeholder="Commentaire (optionnel)" multiline className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-900 mb-3" placeholderTextColor="#9CA3AF" textAlignVertical="top" />
            <TouchableOpacity onPress={() => { if (ratingScore === 0) { Alert.alert('Erreur', 'Note requise'); return; } handleRate(); }} disabled={isRating} className="bg-primary-800 py-3 rounded-xl items-center">
              {isRating ? <ActivityIndicator color="white" /> : <Text className="text-white font-bold text-sm">Envoyer</Text>}
            </TouchableOpacity>
          </View>
        )}

        <View className="mb-8" />
      </ScrollView>
    </View>
  );
}
