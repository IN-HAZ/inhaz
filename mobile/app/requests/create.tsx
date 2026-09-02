import { View, Text, TextInput, TouchableOpacity, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { Redirect, useRouter } from 'expo-router';
import { useState } from 'react';
import { ArrowLeft, MapPin, Package, Plus, X } from 'lucide-react-native';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { requestsApi, CreateRequestPayload } from '@/lib/api/requests';
import { getErrorMessage } from '@/lib/api/errors';
import { useAuthStore } from '@/lib/store/auth';

interface StopInput {
  type: 'PICKUP' | 'DESTINATION';
  address: string;
  contact_name: string;
  contact_phone: string;
}

export default function CreateRequestScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const queryClient = useQueryClient();

  if (user?.role === 'driver') {
    return <Redirect href="/driver/dashboard" />;
  }

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [proposedPrice, setProposedPrice] = useState('');
  const [stops, setStops] = useState<StopInput[]>([
    { type: 'PICKUP', address: '', contact_name: '', contact_phone: '' },
    { type: 'DESTINATION', address: '', contact_name: '', contact_phone: '' },
  ]);

  const createMutation = useMutation({
    mutationFn: (payload: CreateRequestPayload) => requestsApi.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['requests'] });
      router.back();
    },
  });

  const updateStop = (index: number, field: keyof StopInput, value: string) => {
    setStops((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const addStop = () => {
    setStops((prev) => [...prev, { type: 'DESTINATION', address: '', contact_name: '', contact_phone: '' }]);
  };

  const removeStop = (index: number) => {
    if (stops.length <= 2) return;
    setStops((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = () => {
    const validStops = stops.filter((s) => s.address.trim());
    if (validStops.length < 2) {
      Alert.alert('Erreur', 'Veuillez renseigner au moins un point de retrait et une destination.');
      return;
    }

    const hasPickup = validStops.some((s) => s.type === 'PICKUP');
    const hasDest = validStops.some((s) => s.type === 'DESTINATION');
    if (!hasPickup || !hasDest) {
      Alert.alert('Erreur', 'Il faut au moins un point de retrait (PICKUP) et une destination.');
      return;
    }

    createMutation.mutate({
      title: title || undefined,
      description: description || undefined,
      proposed_price: proposedPrice ? Number(proposedPrice) : undefined,
      stops: validStops.map((s, i) => ({
        type: s.type,
        order: i,
        address: s.address,
        contact_name: s.contact_name || undefined,
        contact_phone: s.contact_phone || undefined,
      })),
    });
  };

  return (
    <View className="flex-1 bg-white">
      <View className="flex-row items-center gap-3 px-6 pt-14 pb-4 border-b border-gray-100">
        <TouchableOpacity onPress={() => router.back()} className="w-10 h-10 items-center justify-center">
          <ArrowLeft size={22} color="#1F2937" />
        </TouchableOpacity>
        <Text className="text-lg font-bold text-gray-900">Nouvelle demande</Text>
      </View>

      <ScrollView className="flex-1 px-6 py-4" keyboardShouldPersistTaps="handled">
        <Text className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Titre (optionnel)</Text>
        <TextInput
          value={title}
          onChangeText={setTitle}
          placeholder="Ex: Documents pour bureau"
          className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 mb-4"
          placeholderTextColor="#9CA3AF"
        />

        <Text className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Description</Text>
        <TextInput
          value={description}
          onChangeText={setDescription}
          placeholder="Décrivez votre colis..."
          multiline
          numberOfLines={3}
          className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 mb-4"
          placeholderTextColor="#9CA3AF"
          textAlignVertical="top"
        />

        <Text className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Prix proposé (MAD)</Text>
        <TextInput
          value={proposedPrice}
          onChangeText={setProposedPrice}
          placeholder="0.00"
          keyboardType="numeric"
          className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 mb-6"
          placeholderTextColor="#9CA3AF"
        />

        <Text className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Points de passage</Text>

        {stops.map((stop, index) => (
          <View key={index} className="bg-gray-50 border border-gray-200 rounded-xl p-4 mb-3">
            <View className="flex-row items-center justify-between mb-3">
              <View className="flex-row items-center gap-2">
                <MapPin size={16} color={stop.type === 'PICKUP' ? '#2563EB' : '#DC2626'} />
                <Text className="text-xs font-bold" style={{ color: stop.type === 'PICKUP' ? '#2563EB' : '#DC2626' }}>
                  {stop.type === 'PICKUP' ? 'RETRAIT' : `DESTINATION ${index > 1 ? index : ''}`}
                </Text>
              </View>
              {stops.length > 2 && (
                <TouchableOpacity onPress={() => removeStop(index)}>
                  <X size={16} color="#9CA3AF" />
                </TouchableOpacity>
              )}
            </View>

            <TextInput
              value={stop.address}
              onChangeText={(v) => updateStop(index, 'address', v)}
              placeholder="Adresse"
              className="bg-white border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-900 mb-2"
              placeholderTextColor="#9CA3AF"
            />
            <TextInput
              value={stop.contact_name}
              onChangeText={(v) => updateStop(index, 'contact_name', v)}
              placeholder="Nom du contact"
              className="bg-white border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-900 mb-2"
              placeholderTextColor="#9CA3AF"
            />
            <TextInput
              value={stop.contact_phone}
              onChangeText={(v) => updateStop(index, 'contact_phone', v)}
              placeholder="Téléphone"
              keyboardType="phone-pad"
              className="bg-white border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-900"
              placeholderTextColor="#9CA3AF"
            />
          </View>
        ))}

        <TouchableOpacity
          onPress={addStop}
          className="flex-row items-center justify-center gap-2 py-3 border border-dashed border-gray-300 rounded-xl mb-6"
        >
          <Plus size={16} color="#6B7280" />
          <Text className="text-gray-500 text-sm font-medium">Ajouter un point</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={handleSubmit}
          disabled={createMutation.isPending}
          className="bg-primary-800 py-4 rounded-xl items-center mb-8"
          style={{ opacity: createMutation.isPending ? 0.6 : 1 }}
        >
          {createMutation.isPending ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text className="text-white font-bold text-sm">Créer la demande</Text>
          )}
        </TouchableOpacity>

        {createMutation.isError && (
          <Text className="text-red-500 text-xs text-center mb-4">{getErrorMessage(createMutation.error)}</Text>
        )}
      </ScrollView>
    </View>
  );
}
