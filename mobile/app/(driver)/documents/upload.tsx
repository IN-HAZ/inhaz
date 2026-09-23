import { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { documentsApi } from '@/lib/api/documents';
import { useToast } from '@/components/ui/ToastProvider';
import { getErrorMessage } from '@/lib/api/errors';
import { ArrowLeft, Upload, Check } from 'lucide-react-native';

const ALL_DOCUMENT_TYPES = [
  { value: 'CIN', label: 'Carte Nationale d\'Identité' },
  { value: 'REGISTRATION', label: 'Carte Grise' },
  { value: 'INSURANCE', label: 'Assurance' },
  { value: 'DRIVING_LICENSE', label: 'Permis de Conduire' },
];

export default function DocumentUploadScreen() {
  const { type: presetType } = useLocalSearchParams<{ type?: string }>();
  const [selectedType, setSelectedType] = useState<string>(presetType || '');
  const [file, setFile] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [existingTypes, setExistingTypes] = useState<Set<string>>(new Set());
  const router = useRouter();
  const toast = useToast();

  useEffect(() => {
    if (!presetType) {
      fetchExistingDocuments();
    }
  }, []);

  const fetchExistingDocuments = async () => {
    try {
      const docs = await documentsApi.list();
      const types = new Set<string>(docs.map((d) => d.type));
      setExistingTypes(types);
    } catch (error) {
      console.error('Error fetching documents:', error);
    }
  };

  const documentTypes = ALL_DOCUMENT_TYPES.filter((t) => !existingTypes.has(t.value));

  const pickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'image/*'],
        copyToCacheDirectory: true,
      });

      if (!result.canceled) {
        setFile(result.assets[0]);
      }
    } catch (error) {
      toast.error('Impossible de sélectionner le document');
    }
  };

  const handleUpload = async () => {
    if (!selectedType || !file) {
      toast.error('Veuillez sélectionner un type et un fichier');
      return;
    }

    setLoading(true);
    try {
      await documentsApi.upload(selectedType, {
        uri: file.uri,
        name: file.name,
        mimeType: file.mimeType,
      });

      toast.success('Document téléchargé avec succès');
      router.replace('/(driver)/documents');
    } catch (error: any) {
      toast.error(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  return (
    <View className="flex-1 bg-white">
      <View className="pt-14 pb-4 px-6 border-b border-gray-100">
        <View className="flex-row items-center justify-between">
          <TouchableOpacity onPress={() => router.back()}>
            <ArrowLeft size={22} color="#111827" />
          </TouchableOpacity>
          <Text className="text-gray-900 font-semibold text-base font-semibold">Téléverser</Text>
          <View className="w-6" />
        </View>
      </View>

      <View className="flex-1 px-6 pt-6">
        {!presetType && (
          <View className="mb-6">
            <Text className="text-sm font-semibold text-gray-700 mb-3 font-medium">Type de document</Text>
            {documentTypes.length === 0 ? (
              <Text className="text-gray-400 text-sm">Tous les documents ont déjà été uploadés</Text>
            ) : (
              <View className="space-y-2">
                {documentTypes.map((type) => (
                  <TouchableOpacity
                    key={type.value}
                    onPress={() => setSelectedType(type.value)}
                    className={`flex-row items-center justify-between p-4 border rounded-2xl ${
                      selectedType === type.value
                        ? 'border-primary-800 bg-primary-50'
                        : 'border-gray-200'
                    }`}
                  >
                    <Text className={`text-sm font-medium ${
                      selectedType === type.value ? 'text-primary-800 font-semibold' : 'text-gray-600 font-regular'
                    }`}>
                      {type.label}
                    </Text>
                    {selectedType === type.value && (
                      <Check size={16} color="#4B2861" />
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        )}

        <View className="mb-8">
          <Text className="text-sm font-semibold text-gray-700 mb-3 font-medium">Fichier</Text>
          <TouchableOpacity
            onPress={pickDocument}
            className="border-2 border-dashed border-gray-200 rounded-2xl p-8 items-center"
          >
            <View className="w-14 h-14 bg-primary-100 rounded-2xl items-center justify-center mb-3">
              <Upload size={22} color="#4B2861" />
            </View>
            <Text className="text-gray-900 font-semibold text-sm mb-1 font-semibold">
              {file ? file.name : 'Sélectionner un fichier'}
            </Text>
            <Text className="text-gray-400 text-xs font-regular">
              {file ? `${(file.size / 1024).toFixed(0)} Ko` : 'PDF ou image, max 10 Mo'}
            </Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          onPress={handleUpload}
          disabled={loading || !selectedType || !file}
          className={`rounded-2xl py-4 items-center ${
            loading || !selectedType || !file ? 'bg-gray-200' : 'bg-primary-800'
          }`}
        >
          {loading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text className="text-white font-semibold text-base font-semibold">Téléverser</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}
