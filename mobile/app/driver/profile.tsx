import { useEffect, useState } from 'react';
import { View, Text, ScrollView, ActivityIndicator, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { apiClient, API_HOST } from '../../lib/api/client';
import { useAuthStore } from '../../lib/store/auth';
import { useToast } from '../../components/ui/ToastProvider';
import { getErrorMessage } from '../../lib/api/errors';
import { ArrowLeft, LogOut, ChevronRight, FileText, Car, Check, Clock, X as XIcon, Eye } from 'lucide-react-native';

interface DriverProfile {
  id: number;
  status: string;
  approved_at: string | null;
  rejection_reason: string | null;
  vehicle: { brand: string; model: string; registration_number: string } | null;
  documents: { id: number; type: string; status: string }[];
}

const docLabels: Record<string, string> = {
  CIN: 'CIN',
  REGISTRATION: 'Carte Grise',
  INSURANCE: 'Assurance',
  DRIVING_LICENSE: 'Permis',
};

export default function DriverProfileScreen() {
  const [profile, setProfile] = useState<DriverProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const { user, logout, setUser } = useAuthStore();
  const toast = useToast();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [meRes, profileRes] = await Promise.all([
        apiClient.get('/me'),
        apiClient.get('/driver/profile').catch(() => null),
      ]);
      if (meRes.data.user) {
        setUser(meRes.data.user);
      }
      if (profileRes?.data?.driver_profile) {
        setProfile(profileRes.data.driver_profile);
      }
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  const viewDocument = async (docId: number) => {
    const url = `${API_HOST}/documents/${docId}/view`;
    await WebBrowser.openBrowserAsync(url);
  };

  const handleLogout = async () => {
    await logout();
    router.replace('/auth/login');
  };

  const displayName = user?.customer_profile?.name || user?.name || 'Non défini';

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center bg-white">
        <ActivityIndicator size="large" color="#4B2861" />
      </View>
    );
  }

  return (
    <ScrollView className="flex-1 bg-white">
      {/* Header */}
      <View className="pt-14 pb-6 px-6 border-b border-gray-100">
        <View className="flex-row items-center justify-between mb-4">
          <TouchableOpacity onPress={() => router.back()}>
            <ArrowLeft size={22} color="#111827" />
          </TouchableOpacity>
          <Text className="text-gray-900 font-semibold text-base">Profil</Text>
          <View className="w-6" />
        </View>

        <View className="items-center">
          <View className="w-20 h-20 bg-primary-100 rounded-full items-center justify-center mb-3">
            <Text className="text-primary-800 text-2xl font-black">
              {displayName.charAt(0).toUpperCase()}
            </Text>
          </View>
          <Text className="text-gray-900 text-xl font-bold">{displayName}</Text>
          <Text className="text-gray-500 text-sm mt-1">{user?.phone}</Text>
        </View>
      </View>

      {/* Status */}
      {profile && (
        <View className="px-6 py-5 border-b border-gray-100">
          <Text className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
            Statut du compte
          </Text>
          <View className="flex-row items-center">
            <View className={`w-2.5 h-2.5 rounded-full mr-2 ${
              profile.status === 'APPROVED' ? 'bg-green-500' :
              profile.status === 'REJECTED' ? 'bg-red-500' : 'bg-amber-500'
            }`} />
            <Text className="text-gray-900 font-medium text-sm">
              {profile.status === 'PENDING' ? 'En attente de validation' :
               profile.status === 'APPROVED' ? 'Compte approuvé' : 'Compte rejeté'}
            </Text>
          </View>
        </View>
      )}

      {/* Documents */}
      {profile && (
        <View className="px-6 py-5 border-b border-gray-100">
          <Text className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
            Documents
          </Text>
          {profile.documents.length === 0 ? (
            <Text className="text-gray-400 text-sm">Aucun document uploadé</Text>
          ) : (
            profile.documents.map((doc) => (
              <TouchableOpacity
                key={doc.id}
                onPress={() => viewDocument(doc.id)}
                className="flex-row items-center justify-between py-3 border-b border-gray-50"
              >
                <View className="flex-row items-center flex-1">
                  <View className={`w-8 h-8 rounded-lg items-center justify-center mr-2 ${
                    doc.status === 'APPROVED' ? 'bg-green-100' :
                    doc.status === 'REJECTED' ? 'bg-red-100' : 'bg-amber-100'
                  }`}>
                    {doc.status === 'APPROVED' ? <Check size={14} color="#16a34a" /> :
                     doc.status === 'REJECTED' ? <XIcon size={14} color="#dc2626" /> :
                     <Clock size={14} color="#d97706" />}
                  </View>
                  <Text className="text-gray-900 text-sm font-medium">{docLabels[doc.type] || doc.type}</Text>
                </View>
                <View className="flex-row items-center gap-2">
                  <View className={`px-2.5 py-1 rounded-full ${
                    doc.status === 'APPROVED' ? 'bg-green-50' :
                    doc.status === 'REJECTED' ? 'bg-red-50' : 'bg-gray-100'
                  }`}>
                    <Text className={`text-xs font-semibold ${
                      doc.status === 'APPROVED' ? 'text-green-700' :
                      doc.status === 'REJECTED' ? 'text-red-700' : 'text-gray-500'
                    }`}>
                      {doc.status === 'PENDING' ? 'En attente' :
                       doc.status === 'APPROVED' ? 'Approuvé' : 'Rejeté'}
                    </Text>
                  </View>
                  <Eye size={16} color="#9CA3AF" />
                </View>
              </TouchableOpacity>
            ))
          )}
        </View>
      )}

      {/* Vehicle */}
      {profile?.vehicle && (
        <View className="px-6 py-5 border-b border-gray-100">
          <Text className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
            Véhicule
          </Text>
          <View className="flex-row items-center">
            <View className="w-8 h-8 bg-gray-100 rounded-lg items-center justify-center mr-2">
              <Car size={14} color="#6B7280" />
            </View>
            <View>
              <Text className="text-gray-900 font-medium text-sm">
                {profile.vehicle.brand} {profile.vehicle.model}
              </Text>
              <Text className="text-gray-500 text-sm">{profile.vehicle.registration_number}</Text>
            </View>
          </View>
        </View>
      )}

      {/* Actions */}
      <View className="px-6 py-6">
        {!profile && (
          <TouchableOpacity
            onPress={() => router.push('/driver/onboarding')}
            className="bg-primary-800 rounded-2xl py-4 items-center mb-3"
          >
            <Text className="text-white font-semibold text-sm">Devenir chauffeur</Text>
          </TouchableOpacity>
        )}

        {profile && (
          <TouchableOpacity
            onPress={() => router.push('/driver/onboarding')}
            className="flex-row items-center justify-between border border-gray-200 rounded-2xl py-4 px-4 mb-3"
          >
            <Text className="text-gray-900 font-medium text-sm">Compléter le profil</Text>
            <ChevronRight size={18} color="#9CA3AF" />
          </TouchableOpacity>
        )}

        <TouchableOpacity
          onPress={handleLogout}
          className="flex-row items-center justify-center py-3.5"
        >
          <LogOut size={18} color="#EF4444" />
          <Text className="text-red-500 font-medium text-sm ml-2">Déconnexion</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}
