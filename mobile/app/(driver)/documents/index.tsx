import { useState, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { apiClient } from '@/lib/api/client';
import { ArrowLeft, FileText, Plus, Eye, Check, Clock, X, CheckCircle } from 'lucide-react-native';

interface Document {
  id: number;
  type: string;
  status: string;
  expires_at: string | null;
}

const REQUIRED_DOCS = ['CIN', 'REGISTRATION', 'INSURANCE', 'DRIVING_LICENSE'];

const typeLabels: Record<string, string> = {
  CIN: 'CIN',
  REGISTRATION: 'Carte Grise',
  INSURANCE: 'Assurance',
  DRIVING_LICENSE: 'Permis',
};

export default function DocumentListScreen() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useFocusEffect(
    useCallback(() => {
      fetchDocuments();
    }, [])
  );

  const fetchDocuments = async () => {
    try {
      const response = await apiClient.get('/driver/documents');
      setDocuments(response.data.documents);
    } catch (error) {
      console.error('Error fetching documents:', error);
    } finally {
      setLoading(false);
    }
  };

  const viewDocument = (docId: number) => {
    router.push(`/documents/${docId}`);
  };

  const allUploaded = REQUIRED_DOCS.every((type) =>
    documents.some((d) => d.type === type)
  );

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center bg-white">
        <ActivityIndicator size="large" color="#4B2861" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-white">
      <View className="pt-14 pb-4 px-6 border-b border-gray-100">
        <View className="flex-row items-center justify-between">
          <TouchableOpacity onPress={() => router.back()}>
            <ArrowLeft size={22} color="#111827" />
          </TouchableOpacity>
          <Text className="text-gray-900 font-semibold text-base">Mes Documents</Text>
          <View className="w-6" />
        </View>
      </View>

      <FlatList
        data={documents}
        keyExtractor={(item) => item.id.toString()}
        contentContainerClassName="p-6"
        renderItem={({ item }) => (
          <TouchableOpacity
            onPress={() => viewDocument(item.id)}
            className="flex-row items-center justify-between py-4 border-b border-gray-100"
          >
            <View className="flex-row items-center flex-1">
              <View className={`w-12 h-12 rounded-2xl items-center justify-center mr-3 ${
                item.status === 'APPROVED' ? 'bg-green-100' :
                item.status === 'REJECTED' ? 'bg-red-100' : 'bg-amber-100'
              }`}>
                {item.status === 'APPROVED' ? <Check size={18} color="#16a34a" /> :
                 item.status === 'REJECTED' ? <X size={18} color="#dc2626" /> :
                 <Clock size={18} color="#d97706" />}
              </View>
              <View className="flex-1">
                <Text className="text-gray-900 font-semibold text-sm">
                  {typeLabels[item.type] || item.type}
                </Text>
                {item.expires_at && (
                  <Text className="text-gray-400 text-xs mt-0.5">
                    Expire le {new Date(item.expires_at).toLocaleDateString('fr-FR')}
                  </Text>
                )}
              </View>
            </View>
            <View className="flex-row items-center gap-2">
              <View className={`px-2.5 py-1 rounded-full ${
                item.status === 'APPROVED' ? 'bg-green-50' :
                item.status === 'REJECTED' ? 'bg-red-50' : 'bg-amber-50'
              }`}>
                <Text className={`text-xs font-semibold ${
                  item.status === 'APPROVED' ? 'text-green-700' :
                  item.status === 'REJECTED' ? 'text-red-700' : 'text-amber-700'
                }`}>
                  {item.status === 'PENDING' ? 'En attente' :
                   item.status === 'APPROVED' ? 'Approuvé' : 'Rejeté'}
                </Text>
              </View>
              <Eye size={16} color="#9CA3AF" />
            </View>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <View className="items-center py-12">
            <View className="w-16 h-16 bg-primary-100 rounded-2xl items-center justify-center mb-3">
              <FileText size={24} color="#4B2861" />
            </View>
            <Text className="text-gray-500 text-sm">Aucun document uploadé</Text>
          </View>
        }
      />

      <View className="px-6 pb-8">
        {!allUploaded && (
          <TouchableOpacity
            onPress={() => router.push('/driver/documents/upload')}
            className="flex-row items-center justify-center bg-primary-800 rounded-2xl py-4 mb-3"
          >
            <Plus size={18} color="white" />
            <Text className="text-white font-semibold text-sm ml-2">Ajouter un document</Text>
          </TouchableOpacity>
        )}

        {allUploaded && (
          <TouchableOpacity
            onPress={() => router.replace('/driver/profile')}
            className="flex-row items-center justify-center bg-primary-800 rounded-2xl py-4 mb-3"
          >
            <CheckCircle size={18} color="white" />
            <Text className="text-white font-semibold text-sm ml-2">Terminer</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}
