import React from 'react';
import { View, Text, TouchableOpacity, TextInput } from 'react-native';
import { Plus } from 'lucide-react-native';

interface Step4PricingProps {
  proposedPrice: number;
  onIncreasePrice: () => void;
  onDecreasePrice: () => void;
}

export function Step4Pricing({
  proposedPrice,
  onIncreasePrice,
  onDecreasePrice,
}: Step4PricingProps) {
  return (
    <View className="items-center py-4">
      <Text className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Votre prix proposé (MAD)</Text>
      <Text className="text-xs text-gray-400 mb-6 text-center">
        Définissez un prix initial attractif. Les chauffeurs pourront contre-proposer en temps réel.
      </Text>

      <View className="flex-row items-center gap-4 mb-4">
        <TouchableOpacity
          onPress={onDecreasePrice}
          disabled={proposedPrice <= 20}
          className={`w-12 h-12 rounded-2xl items-center justify-center border ${
            proposedPrice <= 20 ? 'bg-gray-100 border-gray-200' : 'bg-purple-100 border-purple-300'
          }`}
        >
          <Text className={`text-xl font-bold ${proposedPrice <= 20 ? 'text-gray-400' : 'text-primary-800'}`}>-</Text>
        </TouchableOpacity>

        <View className="bg-gray-50 border border-purple-200 px-6 py-3 rounded-2xl items-center min-w-[140px]">
          <TextInput
            value={proposedPrice.toString()}
            editable={false}
            className="text-3xl font-extrabold text-primary-800 text-center"
          />
          <Text className="text-xs font-bold text-gray-500">MAD</Text>
        </View>

        <TouchableOpacity
          onPress={onIncreasePrice}
          className="w-12 h-12 bg-primary-800 rounded-2xl items-center justify-center border border-primary-800"
        >
          <Plus size={22} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {proposedPrice <= 20 && (
        <Text className="text-xs text-amber-600 font-semibold mt-1">
          Le tarif minimum platforme est fixé à 20 MAD.
        </Text>
      )}
    </View>
  );
}
