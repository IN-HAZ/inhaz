import React from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { MapPin, Search, X, Plus, Navigation, ChevronUp, ChevronDown } from 'lucide-react-native';
import { StopItem } from './types';
import { PlaceSearchResult } from '@/lib/api/geocoding';

interface Step1LocationsProps {
  stops: StopItem[];
  activeSearchIndex: number | null;
  searchResults: PlaceSearchResult[];
  isSearching: boolean;
  onAddressInputChange: (index: number, text: string) => void;
  onSelectSearchResult: (index: number, result: PlaceSearchResult) => void;
  onSetActiveSearchIndex: (index: number | null) => void;
  onUpdateStopField: (index: number, field: keyof StopItem, value: any) => void;
  onAddStop: () => void;
  onRemoveStop: (index: number) => void;
  onUseCurrentLocation: (index: number) => void;
  onMoveStop: (index: number, direction: 'up' | 'down') => void;
}

function stopLabel(index: number, total: number): string {
  if (index === 0) return 'POINT DE RETRAIT';
  if (index === total - 1) return 'DESTINATION';
  return `ÉTAPE ${index}`;
}

function stopClass(index: number, total: number): string {
  if (index === 0) return 'text-blue-600';
  if (index === total - 1) return 'text-red-600';
  return 'text-orange-500';
}

// Icon `color` stays a hex prop: lucide-react-native renders its own <Svg>,
// which is not a NativeWind-registered component.
function stopColor(index: number, total: number): string {
  if (index === 0) return '#2563EB';
  if (index === total - 1) return '#DC2626';
  return '#F97316';
}

export function Step1Locations({
  stops,
  activeSearchIndex,
  searchResults,
  isSearching,
  onAddressInputChange,
  onSelectSearchResult,
  onSetActiveSearchIndex,
  onUpdateStopField,
  onAddStop,
  onRemoveStop,
  onUseCurrentLocation,
  onMoveStop,
}: Step1LocationsProps) {
  const total = stops.length;

  return (
    <View>
      {stops.map((stop, index) => {
        const isPickup = index === 0;
        const isDest = index === total - 1;
        const isIntermediate = !isPickup && !isDest;
        const isThisActive = activeSearchIndex === index;
        const color = stopColor(index, total);
        const hasCoords = stop.latitude != null && stop.longitude != null;

        return (
          <View
            key={index}
            className="bg-gray-50 border border-gray-200 rounded-xl p-3.5 mb-3"
          >
            {/* Header row */}
            <View className="flex-row items-center justify-between mb-2">
              <View className="flex-row items-center gap-2 flex-1">
                <MapPin size={15} color={color} />
                <Text className={`text-xs font-bold ${stopClass(index, total)}`}>
                  {stopLabel(index, total)}
                </Text>
                {hasCoords && (
                  <View className="bg-green-100 px-1.5 py-0.5 rounded-full">
                    <Text className="text-[10px] text-green-700 font-semibold">✓ GPS</Text>
                  </View>
                )}
              </View>

              <View className="flex-row items-center gap-1">
                {/* Reorder controls for intermediate stops */}
                {isIntermediate && (
                  <>
                    {index > 1 && (
                      <TouchableOpacity
                        onPress={() => onMoveStop(index, 'up')}
                        className="p-1"
                        hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                      >
                        <ChevronUp size={16} color="#6B7280" />
                      </TouchableOpacity>
                    )}
                    {index < total - 2 && (
                      <TouchableOpacity
                        onPress={() => onMoveStop(index, 'down')}
                        className="p-1"
                        hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                      >
                        <ChevronDown size={16} color="#6B7280" />
                      </TouchableOpacity>
                    )}
                    <TouchableOpacity
                      onPress={() => onRemoveStop(index)}
                      className="p-1 ml-1"
                      hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                    >
                      <X size={15} color="#EF4444" />
                    </TouchableOpacity>
                  </>
                )}
              </View>
            </View>

            {/* Address search input */}
            <View className="relative mb-2">
              <View
                className={`flex-row items-center bg-white border rounded-lg px-3 py-1 ${
                  isThisActive ? 'border-primary-800' : 'border-gray-200'
                }`}
              >
                <Search size={15} color="#9CA3AF" />
                <TextInput
                  value={stop.address}
                  onChangeText={(v) => onAddressInputChange(index, v)}
                  onFocus={() => onSetActiveSearchIndex(index)}
                  placeholder="Adresse ou nom du lieu..."
                  className="flex-1 ml-2 py-1.5 text-sm text-gray-900"
                  placeholderTextColor="#9CA3AF"
                  returnKeyType="search"
                />
                {isThisActive && isSearching ? (
                  <ActivityIndicator size="small" color="#7928CA" />
                ) : stop.address.length > 0 ? (
                  <TouchableOpacity
                    onPress={() => {
                      onUpdateStopField(index, 'address', '');
                      onUpdateStopField(index, 'latitude', undefined);
                      onUpdateStopField(index, 'longitude', undefined);
                      onSetActiveSearchIndex(index);
                    }}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <X size={14} color="#9CA3AF" />
                  </TouchableOpacity>
                ) : null}
              </View>

              {/* Live suggestions dropdown */}
              {isThisActive && searchResults.length > 0 && (
                <View className="absolute left-0 right-0 top-full bg-white border border-gray-200 rounded-xl mt-1 shadow-xl z-30 max-h-[200px]">
                  <ScrollView keyboardShouldPersistTaps="handled" nestedScrollEnabled>
                    {searchResults.map((item) => (
                      <TouchableOpacity
                        key={item.placeId}
                        onPress={() => onSelectSearchResult(index, item)}
                        className="p-3 border-b border-gray-100 flex-row items-center gap-2.5"
                      >
                        <MapPin size={14} color="#7928CA" />
                        <View className="flex-1">
                          <Text className="text-xs font-semibold text-gray-900" numberOfLines={1}>
                            {item.mainText}
                          </Text>
                          {item.secondaryText ? (
                            <Text className="text-[11px] text-gray-500" numberOfLines={1}>
                              {item.secondaryText}
                            </Text>
                          ) : null}
                        </View>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              )}
            </View>



            {/* GPS button */}
            <TouchableOpacity
              onPress={() => onUseCurrentLocation(index)}
              disabled={stop.isLocating}
              className="flex-row items-center gap-1.5 self-start"
            >
              {stop.isLocating ? (
                <ActivityIndicator size="small" color="#7928CA" />
              ) : (
                <Navigation size={13} color="#7928CA" />
              )}
              <Text className="text-[11px] font-semibold text-primary-800">
                {stop.isLocating ? 'Localisation...' : 'Utiliser ma position GPS'}
              </Text>
            </TouchableOpacity>
          </View>
        );
      })}

      {/* Add intermediate stop */}
      <TouchableOpacity
        onPress={onAddStop}
        className="flex-row items-center justify-center gap-2 py-3 border border-dashed border-gray-300 rounded-xl mb-4"
      >
        <Plus size={15} color="#6B7280" />
        <Text className="text-gray-600 text-xs font-semibold">Ajouter une étape intermédiaire</Text>
      </TouchableOpacity>
    </View>
  );
}
