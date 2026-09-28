import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Check } from 'lucide-react-native';
import { VehicleOption } from './types';

interface Step3VehicleProps {
  vehicleOptions: VehicleOption[];
  selectedVehicleType: string;
  onSelectVehicle: (id: string) => void;
}

export function Step3Vehicle({
  vehicleOptions,
  selectedVehicleType,
  onSelectVehicle,
}: Step3VehicleProps) {
  return (
    <View>
      <Text className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Sélectionnez le véhicule requis *</Text>
      
      <View className="gap-2.5">
        {vehicleOptions.map((v) => {
          const isSelected = selectedVehicleType === v.id;
          const IconComp = v.icon;

          return (
            <TouchableOpacity
              key={v.id}
              onPress={() => onSelectVehicle(v.id)}
              className={`p-3.5 rounded-xl border flex-row items-center justify-between ${
                isSelected ? 'border-primary-800 bg-purple-50/60' : 'border-gray-200 bg-white'
              }`}
            >
              <View className="flex-row items-center gap-3">
                <View className={`p-2.5 rounded-lg ${isSelected ? 'bg-primary-800' : 'bg-gray-100'}`}>
                  <IconComp size={20} color={isSelected ? '#FFFFFF' : '#4B5563'} />
                </View>
                <View>
                  <Text className={`text-sm font-bold ${isSelected ? 'text-primary-800' : 'text-gray-900'}`}>{v.label}</Text>
                  <Text className="text-xs text-gray-500">{v.sub}</Text>
                </View>
              </View>

              {isSelected && (
                <View className="bg-primary-800 p-1 rounded-full">
                  <Check size={14} color="#FFFFFF" />
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}
