import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { MapPin, X } from 'lucide-react-native';

interface SelectedPinCardProps {
  selectedPin: { latitude: number; longitude: number; address: string } | null;
  onDismiss: () => void;
  onApply: (role: 'PICKUP' | 'DESTINATION' | 'STOP') => void;
}

export function SelectedPinCard({ selectedPin, onDismiss, onApply }: SelectedPinCardProps) {
  if (!selectedPin) return null;

  return (
    <View className="absolute bottom-4 left-4 right-4 bg-white p-3.5 rounded-2xl border border-gray-200 shadow-2xl z-30">
      <View className="flex-row items-center justify-between mb-2">
        <View className="flex-row items-center gap-2 flex-1 mr-2">
          <MapPin size={18} color="#7928CA" />
          <Text className="text-xs font-bold text-gray-900 flex-1" numberOfLines={1}>
            {selectedPin.address}
          </Text>
        </View>
        <TouchableOpacity onPress={onDismiss}>
          <X size={16} color="#9CA3AF" />
        </TouchableOpacity>
      </View>

      <Text className="text-[11px] text-gray-500 mb-3">
        Lat: {selectedPin.latitude.toFixed(4)}, Long: {selectedPin.longitude.toFixed(4)}
      </Text>

      <View className="flex-row gap-2">
        <TouchableOpacity
          onPress={() => onApply('PICKUP')}
          className="flex-1 bg-blue-600 py-2 rounded-xl items-center"
        >
          <Text className="text-white text-[11px] font-bold">Retrait</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => onApply('DESTINATION')}
          className="flex-1 bg-red-600 py-2 rounded-xl items-center"
        >
          <Text className="text-white text-[11px] font-bold">Destination</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => onApply('STOP')}
          className="flex-1 bg-purple-700 py-2 rounded-xl items-center"
        >
          <Text className="text-white text-[11px] font-bold">+ Étape</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
