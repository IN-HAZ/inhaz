import React from 'react';
import { View, Text, ScrollView, ActivityIndicator, TouchableOpacity } from 'react-native';
import { Check } from 'lucide-react-native';
import { StopItem, PhotoItem } from './types';

interface Step5ReviewProps {
  stops: StopItem[];
  description: string;
  weightKg: string;
  photos: PhotoItem[];
  vehicleType: string;
  proposedPrice: number;
  isPublishing: boolean;
  onPublish: () => void;
}

export function Step5Review({
  stops,
  description,
  weightKg,
  photos,
  vehicleType,
  proposedPrice,
  isPublishing,
  onPublish,
}: Step5ReviewProps) {
  const uploadedPhotosCount = photos.filter((p) => p.status === 'uploaded').length;

  return (
    <View className="flex-1">
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <View className="bg-purple-50 border border-purple-200 rounded-2xl p-4 mb-4">
          <Text className="text-xs font-bold text-primary-800 uppercase tracking-wider mb-2">Trajet ({stops.length} adresses)</Text>
          {stops.map((s, idx) => (
            <View key={idx} className="mb-2">
              <Text className="text-xs font-bold text-gray-800">
                {idx === 0 ? '📍 Retrait:' : idx === stops.length - 1 ? '🏁 Destination:' : `🛑 Étape ${idx}:`}
              </Text>
              <Text className="text-xs text-gray-600 ml-3">{s.address || 'Non spécifiée'}</Text>
              {s.contact_name ? (
                <Text className="text-[11px] text-gray-400 ml-3">Contact: {s.contact_name} ({s.contact_phone})</Text>
              ) : null}
            </View>
          ))}
        </View>

        <View className="bg-gray-50 border border-gray-200 rounded-2xl p-4 mb-4">
          <Text className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Colis & Véhicule</Text>
          <Text className="text-xs text-gray-800 font-semibold mb-1">Description: {description}</Text>
          {weightKg ? <Text className="text-xs text-gray-600 mb-1">Poids: {weightKg} kg</Text> : null}
          <Text className="text-xs text-gray-600 mb-1">Photos S3 jointes: {uploadedPhotosCount} photo(s)</Text>
          <Text className="text-xs text-gray-600">Véhicule requis: {vehicleType.toUpperCase()}</Text>
        </View>

        <View className="bg-gray-900 rounded-2xl p-4 mb-6 flex-row items-center justify-between">
          <View>
            <Text className="text-xs text-gray-400 font-bold uppercase">Prix proposé</Text>
            <Text className="text-2xl font-extrabold text-white">{proposedPrice} MAD</Text>
          </View>
          <View className="bg-purple-700 px-3 py-1.5 rounded-xl">
            <Text className="text-xs text-white font-bold">P2P Enchères</Text>
          </View>
        </View>
      </ScrollView>

      <TouchableOpacity
        onPress={onPublish}
        disabled={isPublishing}
        className={`py-3.5 rounded-xl flex-row items-center justify-center gap-2 ${
          isPublishing ? 'bg-purple-300' : 'bg-primary-800'
        }`}
      >
        {isPublishing ? (
          <ActivityIndicator color="#FFFFFF" size="small" />
        ) : (
          <>
            <Check size={18} color="#FFFFFF" />
            <Text className="text-white font-bold text-sm">Publier la Demande de Livraison</Text>
          </>
        )}
      </TouchableOpacity>
    </View>
  );
}
