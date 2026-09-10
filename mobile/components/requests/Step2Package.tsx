import React from 'react';
import { View, Text, TextInput, TouchableOpacity, Image, ActivityIndicator } from 'react-native';
import { Plus, X, RefreshCw, AlertTriangle } from 'lucide-react-native';
import { PhotoItem } from './types';

interface Step2PackageProps {
  description: string;
  weightKg: string;
  photos: PhotoItem[];
  isPhotosUploading: boolean;
  isPhotosFailed: boolean;
  onDescriptionChange: (text: string) => void;
  onWeightKgChange: (text: string) => void;
  onSelectPhotos: (useCamera: boolean) => void;
  onRetryUpload: (photo: PhotoItem) => void;
  onRemovePhoto: (id: string) => void;
}

export function Step2Package({
  description,
  weightKg,
  photos,
  isPhotosUploading,
  isPhotosFailed,
  onDescriptionChange,
  onWeightKgChange,
  onSelectPhotos,
  onRetryUpload,
  onRemovePhoto,
}: Step2PackageProps) {
  return (
    <View>
      <Text className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Description du colis *</Text>
      <TextInput
        value={description}
        onChangeText={onDescriptionChange}
        placeholder="Ex: 2 cartons d'électronique et documents..."
        multiline
        numberOfLines={3}
        className="bg-gray-50 border border-gray-200 rounded-xl p-3 text-sm text-gray-900 mb-3"
        placeholderTextColor="#9CA3AF"
        textAlignVertical="top"
      />

      <Text className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Poids estimé (kg)</Text>
      <TextInput
        value={weightKg}
        onChangeText={onWeightKgChange}
        placeholder="Ex: 15"
        keyboardType="numeric"
        className="bg-gray-50 border border-gray-200 rounded-xl p-3 text-sm text-gray-900 mb-4"
        placeholderTextColor="#9CA3AF"
      />

      {/* Photos Section */}
      <Text className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Photos du marchandise (S3 Direct Upload)</Text>
      
      <View className="flex-row flex-wrap gap-2.5 mb-3">
        {photos.map((p) => (
          <View key={p.id} className="relative w-20 h-20 rounded-xl overflow-hidden border border-gray-200 bg-gray-100">
            <Image source={{ uri: p.uri }} className="w-full h-full" resizeMode="cover" />

            {/* Status Overlay */}
            {p.status === 'uploading' && (
              <View className="absolute inset-0 bg-black/50 items-center justify-center">
                <ActivityIndicator size="small" color="#FFFFFF" />
                <Text className="text-[9px] text-white font-bold mt-1">Envoi S3...</Text>
              </View>
            )}

            {p.status === 'uploaded' && (
              <View className="absolute top-1 right-1 bg-green-500 px-1 py-0.5 rounded">
                <Text className="text-[8px] text-white font-bold">OK</Text>
              </View>
            )}

            {p.status === 'failed' && (
              <TouchableOpacity
                onPress={() => onRetryUpload(p)}
                className="absolute inset-0 bg-red-900/70 items-center justify-center p-1"
              >
                <AlertTriangle size={14} color="#FFFFFF" />
                <Text className="text-[9px] text-white font-bold text-center mt-0.5">Réessayer</Text>
              </TouchableOpacity>
            )}

            {/* Delete Photo Button */}
            <TouchableOpacity
              onPress={() => onRemovePhoto(p.id)}
              className="absolute top-1 left-1 bg-black/60 p-1 rounded-full"
            >
              <X size={10} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        ))}

        {/* Add Photo Buttons */}
        <TouchableOpacity
          onPress={() => onSelectPhotos(false)}
          className="w-20 h-20 rounded-xl border border-dashed border-primary-800 bg-purple-50/50 items-center justify-center"
        >
          <Plus size={20} color="#7928CA" />
          <Text className="text-[10px] text-primary-800 font-bold mt-1">Galerie</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => onSelectPhotos(true)}
          className="w-20 h-20 rounded-xl border border-dashed border-gray-300 bg-gray-50 items-center justify-center"
        >
          <Plus size={20} color="#6B7280" />
          <Text className="text-[10px] text-gray-600 font-bold mt-1">Caméra</Text>
        </TouchableOpacity>
      </View>

      {isPhotosUploading && (
        <Text className="text-xs text-purple-700 font-semibold mb-2">⏳ Envoi des photos vers le stockage S3 en cours...</Text>
      )}

      {isPhotosFailed && (
        <Text className="text-xs text-red-600 font-semibold mb-2">⚠️ Une ou plusieurs photos ont échoué. Touchez pour réessayer.</Text>
      )}
    </View>
  );
}
