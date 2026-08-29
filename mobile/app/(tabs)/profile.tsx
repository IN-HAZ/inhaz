import { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  StyleSheet,
} from 'react-native';
import { useRouter } from 'expo-router';
import { apiClient } from '@/lib/api/client';
import { useAuthStore } from '@/lib/store/auth';
import { useToast } from '@/components/ui/ToastProvider';
import { getErrorMessage } from '@/lib/api/errors';
import { User, ChevronRight, LogOut, Car, Store, Mail, Phone, Pencil, Sparkles } from 'lucide-react-native';

const PURPLE = '#4B2861';
const PURPLE_ACCENT = '#7C2DF5';

const sectionLabel = 'text-[13px] text-[#6C7078] font-medium px-4 mt-6 mb-2';

function Divider({ inset = true }: { inset?: boolean }) {
  return <View className={`h-px bg-[#EDEDF0] ${inset ? 'ml-[60px]' : ''}`} />;
}

function Row({
  icon,
  label,
  value,
  hint,
  onPress,
}: {
  icon: React.ReactNode;
  label: string;
  value?: string;
  hint?: string;
  onPress: () => void;
}) {
  const showHint = !value && !!hint;
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      className="flex-row items-center px-4 py-4 bg-white active:bg-[#FAFAFA]"
    >
      <View className="w-8 h-8 rounded-[10px] bg-primary-50 items-center justify-center mr-3">{icon}</View>
      <Text className="text-gray-900 text-[15px] flex-1">{label}</Text>
      {value ? (
        <Text className="text-[#8A9099] text-[15px] mr-1.5" numberOfLines={1}>
          {value}
        </Text>
      ) : showHint ? (
        <Text className="text-primary-700 text-[15px] font-medium mr-1.5">{hint}</Text>
      ) : null}
      <ChevronRight size={18} color="#C7C7CC" />
    </TouchableOpacity>
  );
}

export default function ProfileTabScreen() {
  const router = useRouter();
  const { user, setUser, logout } = useAuthStore();
  const toast = useToast();

  const [name, setName] = useState(user?.customer_profile?.name || user?.name || '');
  const [email, setEmail] = useState(user?.customer_profile?.email || '');
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);

  const isDriver = user?.role === 'driver';
  const incomplete = !name.trim() && !email.trim();
  const displayName = user?.customer_profile?.name || user?.name || 'Client';
  const initial = displayName.charAt(0).toUpperCase();
  const roleLabel = isDriver ? 'Chauffeur' : 'Client';
  const roleDot = isDriver ? 'bg-accent-500' : 'bg-primary-500';

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error('Veuillez entrer votre nom');
      return;
    }
    setSaving(true);
    try {
      const res = await apiClient.put('/me', { name: name.trim(), email: email.trim() || null });
      if (res.data.user) {
        setUser(res.data.user);
        setName(res.data.user.customer_profile?.name || res.data.user.name || '');
        setEmail(res.data.user.customer_profile?.email || '');
      }
      toast.success('Profil enregistré');
      setEditing(false);
      router.replace('/');
    } catch (e: any) {
      toast.error(getErrorMessage(e));
    } finally {
      setSaving(false);
    }
  };

  const toggleEditing = () => {
    setName(user?.customer_profile?.name || user?.name || '');
    setEmail(user?.customer_profile?.email || '');
    setEditing((prev) => !prev);
  };

  const handleLogout = async () => {
    await logout();
    router.replace('/auth/login');
  };

  return (
    <SafeAreaView className="flex-1 bg-[#F2F2F7]">
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
        {/* ===== Header ===== */}
        <View className="items-center pt-8 pb-5 bg-white border-b border-[#EFEFF0]">
          <TouchableOpacity
            onPress={toggleEditing}
            activeOpacity={0.7}
            className="absolute right-4 top-7 w-10 h-10 rounded-full bg-primary-50 border border-primary-100 items-center justify-center"
          >
            <Pencil size={15} color={PURPLE} />
          </TouchableOpacity>

          <View className="w-[88px] h-[88px] rounded-full bg-primary-100 items-center justify-center border-4 border-white" style={headerShadow}>
            <Text className="text-primary-800 text-3xl font-extrabold">{initial}</Text>
          </View>
          <View className="flex-row items-center mt-3.5">
            <Text className="text-gray-900 text-[19px] font-bold">{displayName}</Text>
            <View className="ml-2 flex-row items-center rounded-full bg-primary-50 pl-2 pr-3 py-1">
              <View className={`w-1.5 h-1.5 rounded-full ${roleDot} mr-1.5`} />
              <Text className="text-primary-700 text-[11px] font-semibold">{roleLabel}</Text>
            </View>
          </View>
          <Text className="text-gray-500 text-sm mt-1">{user?.phone}</Text>
        </View>

        {/* ===== First-run note ===== */}
        {incomplete && (
          <View className="mx-4 mt-4 flex-row items-start bg-primary-50 rounded-2xl p-4">
            <View className="w-9 h-9 rounded-[10px] bg-white items-center justify-center mr-3">
              <Sparkles size={15} color={PURPLE} />
            </View>
            <View className="flex-1">
              <Text className="text-primary-900 font-bold text-sm">Bienvenue sur inHaz !</Text>
              <Text className="text-primary-800/80 text-[13px] leading-5 mt-0.5">
                Complétez votre profil pour finaliser votre inscription.
              </Text>
            </View>
          </View>
        )}

        {/* ===== Compte ===== */}
        <Text className={sectionLabel}>Mon compte</Text>
        <View className="mx-4 bg-white rounded-2xl border border-[#EDEDF0] overflow-hidden">
          {editing ? (
            <View className="p-4">
              <Text className="text-[#6C7078] text-xs mb-1.5">Nom</Text>
              <View className="bg-[#F5F5F7] border border-[#E4E4E7] rounded-lg px-3.5 py-3 mb-3.5">
                <TextInput
                  value={name}
                  onChangeText={setName}
                  placeholder="Nom complet"
                  placeholderTextColor="#9CA3AF"
                  className="text-gray-900 text-sm font-medium p-0"
                  autoCapitalize="words"
                />
              </View>
              <Text className="text-[#6C7078] text-xs mb-1.5">Email</Text>
              <View className="bg-[#F5F5F7] border border-[#E4E4E7] rounded-lg px-3.5 py-3 mb-5">
                <TextInput
                  value={email}
                  onChangeText={setEmail}
                  placeholder="Email (optionnel)"
                  placeholderTextColor="#9CA3AF"
                  className="text-gray-900 text-sm font-medium p-0"
                  autoCapitalize="none"
                  keyboardType="email-address"
                />
              </View>
              <View className="flex-row gap-2.5">
                <TouchableOpacity onPress={toggleEditing} activeOpacity={0.7} className="flex-1 bg-[#F2F2F7] rounded-lg py-3.5 items-center">
                  <Text className="text-gray-600 font-semibold text-sm">Annuler</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handleSave}
                  disabled={saving}
                  activeOpacity={0.85}
                  style={{ backgroundColor: PURPLE }}
                  className="flex-1 rounded-lg py-3.5 items-center"
                >
                  <Text className="text-white font-semibold text-sm">
                    {saving ? 'Enregistrement...' : 'Enregistrer'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <View>
              <Row
                icon={<User size={16} color={PURPLE_ACCENT} />}
                label="Profil"
                value={name}
                hint="Compléter"
                onPress={toggleEditing}
              />
              <Divider />
              <Row
                icon={<Mail size={16} color={PURPLE_ACCENT} />}
                label="Email"
                value={email}
                hint="Ajouter"
                onPress={toggleEditing}
              />
              <Divider />
              <Row
                icon={<Phone size={16} color={PURPLE_ACCENT} />}
                label="Téléphone"
                value={user?.phone}
                onPress={toggleEditing}
              />
            </View>
          )}
        </View>

        {/* ===== Chauffeur ===== */}
        <Text className={sectionLabel}>{isDriver ? 'Espace chauffeur' : 'Chauffeur'}</Text>
        <View className="mx-4 bg-white rounded-2xl border border-[#EDEDF0] overflow-hidden">
          {isDriver ? (
            <View>
              <Row
                icon={<Store size={16} color={PURPLE_ACCENT} />}
                label="Espace chauffeur"
                value="Marché"
                onPress={() => router.push('/driver/marketplace')}
              />
              <Divider />
              <Row
                icon={<Car size={16} color={PURPLE_ACCENT} />}
                label="Profil chauffeur"
                value="Documents"
                onPress={() => router.push('/driver/profile')}
              />
            </View>
          ) : (
            <TouchableOpacity
              onPress={() => router.push('/driver/onboarding')}
              activeOpacity={0.85}
              className="flex-row items-center px-4 py-4 bg-primary-50 active:bg-primary-100"
            >
              <View className="w-10 h-10 rounded-xl bg-primary-800 items-center justify-center mr-3">
                <Car size={18} color="white" />
              </View>
              <View className="flex-1">
                <Text className="text-gray-900 font-bold text-[15px]">Devenir chauffeur</Text>
                <Text className="text-[#6C7078] text-[13px] mt-0.5">Livrez et gagnez avec inHaz</Text>
              </View>
              <View className="w-8 h-8 rounded-full bg-primary-800 items-center justify-center">
                <ChevronRight size={15} color="white" />
              </View>
            </TouchableOpacity>
          )}
        </View>

        {/* ===== Déconnexion ===== */}
        <Text className={sectionLabel}>Général</Text>
        <TouchableOpacity
          onPress={handleLogout}
          activeOpacity={0.7}
          className="mx-4 bg-white rounded-2xl border border-[#EDEDF0] py-4 items-center flex-row justify-center active:bg-[#FAFAFA]"
        >
          <LogOut size={16} color="#E5484D" />
          <Text className="text-[#E5484D] font-semibold text-[15px] ml-2">Déconnexion</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const headerShadow = {
  shadowColor: '#4B2861',
  shadowOpacity: 0.15,
  shadowRadius: 10,
  shadowOffset: { width: 0, height: 4 },
  elevation: 3,
};