import { useCallback, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, ScrollView, KeyboardAvoidingView, Platform, Image } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { authApi } from '@/lib/api/auth';
import { driverApi, DriverProfileItem } from '@/lib/api/driver';
import { useAuthStore } from '@/lib/store/auth';
import { useToast } from '@/components/ui/ToastProvider';
import { useProfilePhoto } from '@/lib/hooks/useProfilePhoto';
import { getErrorMessage } from '@/lib/api/errors';
import { X, Banknote, Clock, Shield, ChevronRight, FileText, Check, Eye, Camera } from 'lucide-react-native';

/** Onboarding state = the authoritative driver profile shape. */
type DriverData = DriverProfileItem;

const REQUIRED_DOCS = ['CIN', 'REGISTRATION', 'INSURANCE', 'DRIVING_LICENSE'];

/**
 * Driver onboarding (W7 §6.4). Lives in `app/onboarding/` (outside the role
 * groups) so it runs before a `driver_profile` exists. Reuses the real backend
 * apply/profile/vehicle/document endpoints; `color` and the profile photo are
 * Phase B extras sent as extra fields / through the mock seam.
 */
export default function DriverOnboardingScreen() {
  const [loading, setLoading] = useState(false);
  const [initLoading, setInitLoading] = useState(true);
  const [driverData, setDriverData] = useState<DriverData | null>(null);
  const [step, setStep] = useState(0);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [brand, setBrand] = useState('');
  const [model, setModel] = useState('');
  const [color, setColor] = useState('');
  const [registrationNumber, setRegistrationNumber] = useState('');

  const photo = useProfilePhoto('driver-avatar');

  const router = useRouter();
  const { setUser } = useAuthStore();
  const toast = useToast();

  useFocusEffect(
    useCallback(() => {
      loadExistingData();
    }, [])
  );

  const loadExistingData = async () => {
    try {
      const [meUser, profile] = await Promise.all([
        authApi.me(),
        driverApi.getProfile().catch(() => null),
      ]);

      setUser(meUser);
      setName(meUser.customer_profile?.name || meUser.name || '');
      setEmail(meUser.customer_profile?.email || '');

      if (profile) {
        const dp = profile;
        setDriverData(dp);

        if (dp.vehicle) {
          setBrand(dp.vehicle.brand || '');
          setModel(dp.vehicle.model || '');
          setRegistrationNumber(dp.vehicle.registration_number || '');
          setColor(dp.vehicle.color || '');
        }

        const nextIncomplete = findNextIncomplete(dp);
        setStep(nextIncomplete);
      } else {
        setStep(1);
      }
    } catch {
      setStep(1);
    } finally {
      setInitLoading(false);
    }
  };

  const allDocsUploaded = (dp: DriverData): boolean => {
    if (!dp.documents) return false;
    const types = dp.documents.map((d) => d.type);
    return REQUIRED_DOCS.every((t) => types.includes(t));
  };

  const findNextIncomplete = (dp: DriverData): number => {
    if (!dp.vehicle) return 3;
    if (!allDocsUploaded(dp)) return 4;
    return 5;
  };

  const doneSteps = (): Set<number> => {
    const done = new Set<number>();
    done.add(1);
    if (name.trim()) done.add(2);
    if (driverData?.vehicle) done.add(3);
    if (driverData && allDocsUploaded(driverData)) done.add(4);
    return done;
  };

  const totalSteps = 4;
  const completedCount = doneSteps().size;

  const handleApply = async () => {
    setLoading(true);
    try {
      const response = await driverApi.apply();
      const dp = response.driver_profile;
      setDriverData(dp);
      setStep(2);
    } catch (error: any) {
      if (error.response?.status === 422) {
        const dp = error.response.data.driver_profile as DriverProfileItem;
        if (dp) setDriverData(dp);
        setStep(2);
      } else {
        toast.error(getErrorMessage(error));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    if (!name.trim()) {
      toast.error('Veuillez entrer votre nom');
      return;
    }
    setLoading(true);
    try {
      await authApi.updateProfile({ name: name.trim(), email: email.trim() || null });
      toast.success('Profil enregistré');

      // Photo is best-effort until the backend photo endpoint ships (B5).
      if (photo.hasPhoto) {
        const uploaded = await photo.upload();
        if (!uploaded) {
          toast.warning('Photo de profil non synchronisée pour le moment (B5).');
        }
      }

      const done = doneSteps();
      done.add(2);
      const next = findNextStep(done);
      setStep(next);
    } catch (error: any) {
      toast.error(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  const handleSaveVehicle = async () => {
    if (!brand.trim() || !model.trim() || !registrationNumber.trim()) {
      toast.error('Veuillez remplir tous les champs');
      return;
    }
    setLoading(true);
    try {
      const vehicle = await driverApi.saveVehicle({
        brand: brand.trim(),
        model: model.trim(),
        registration_number: registrationNumber.trim(),
        // Extra field — backend `color` column is ticket B6, ignored for now.
        color: color.trim() || undefined,
      });
      setDriverData((prev) => ({
        ...(prev || { status: 'PENDING', vehicle: null, documents: [], id: 0, approved_at: null, rejection_reason: null }),
        vehicle,
      }));
      toast.success('Véhicule enregistré');
      setStep(4);
    } catch (error: any) {
      toast.error(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  // W7 §6.4: after finishing, land on the driver home — the verification
  // banner lives there and explains the manual-review state (§6.5).
  const handleFinish = () => {
    router.replace('/(driver)');
  };

  const findNextStep = (done: Set<number>): number => {
    for (let i = 1; i <= totalSteps; i++) {
      if (!done.has(i)) return i;
    }
    return 5;
  };

  const docsStatus = (type: string) => {
    return driverData?.documents?.find((d) => d.type === type)?.status || null;
  };

  const docsId = (type: string): number | null => {
    return driverData?.documents?.find((d) => d.type === type)?.id ?? null;
  };

  const viewDocument = (docId: number) => {
    router.push(`/documents/${docId}`);
  };

  if (initLoading) {
    return (
      <View className="flex-1 bg-white items-center justify-center">
        <ActivityIndicator size="large" color="#4B2861" />
      </View>
    );
  }

  if (step === 5 || (step === 0 && doneSteps().size === 4)) {
    return (
      <View className="flex-1 bg-white items-center justify-center px-6">
        <View className="w-20 h-20 bg-green-100 rounded-full items-center justify-center mb-6">
          <Check size={40} color="#16a34a" />
        </View>
        <Text className="text-2xl font-bold text-gray-900 mb-2 text-center">Profil complété</Text>
        <Text className="text-gray-500 text-base text-center mb-8">
          Votre dossier est en attente de validation par l'administrateur.
        </Text>
        <TouchableOpacity
          onPress={handleFinish}
          className="bg-primary-800 rounded-2xl py-4 px-12 items-center"
        >
          <Text className="text-white font-semibold text-base">Accéder à mon espace</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const stepLabels = ['Candidature', 'Profil', 'Véhicule', 'Documents'];

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1 bg-white"
    >
      {/* Header */}
      <View className="pt-14 pb-4 px-6 border-b border-gray-100">
        <View className="flex-row items-center justify-between mb-4">
          <Text className="text-sm text-gray-500 font-medium">
            Étape {step} sur {totalSteps}
          </Text>
          <TouchableOpacity onPress={() => router.back()} className="w-8 h-8 bg-gray-100 rounded-full items-center justify-center">
            <X size={16} color="#6B7280" />
          </TouchableOpacity>
        </View>

        <View className="h-1.5 bg-gray-100 rounded-full overflow-hidden mb-4">
          {/* width is a dynamic percentage — Tailwind can't express arbitrary % here */}
          <View
            className="h-full bg-primary-800 rounded-full"
            style={{ width: `${(completedCount / totalSteps) * 100}%` }}
          />
        </View>

        <View className="flex-row justify-between">
          {stepLabels.map((label, i) => {
            const num = i + 1;
            const done = doneSteps().has(num);
            const isCurrent = step === num;
            return (
              <TouchableOpacity
                key={num}
                onPress={() => { if (done) setStep(num); }}
                className="items-center flex-1"
                disabled={!done}
              >
                <View className={`w-7 h-7 rounded-full items-center justify-center mb-1 ${
                  done ? 'bg-green-500' :
                  isCurrent ? 'bg-primary-800' : 'bg-gray-200'
                }`}>
                  {done ? (
                    <Check size={14} color="white" />
                  ) : (
                    <Text className={`text-xs font-bold ${isCurrent ? 'text-white' : 'text-gray-400'}`}>
                      {num}
                    </Text>
                  )}
                </View>
                <Text className={`text-xs ${
                  done ? 'text-green-600 font-semibold' :
                  isCurrent ? 'text-primary-800 font-semibold' : 'text-gray-400'
                }`}>
                  {label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      <ScrollView className="flex-1" contentContainerClassName="flex-grow">

        {/* Step 1: Apply */}
        {step === 1 && (
          <View className="flex-1 px-6 pt-10">
            <View className="mb-8">
              <Text className="text-3xl font-black text-gray-900 mb-2">Devenir chauffeur</Text>
              <Text className="text-gray-500 text-base leading-6">
                Rejoignez notre réseau et commencez à gagner de l'argent.
              </Text>
            </View>

            <View className="space-y-4 mb-10">
              {[
                { icon: <Banknote size={22} color="#4B2861" />, title: 'Revenus flexibles', desc: 'Gagnez jusqu\'à 3000 DH/mois' },
                { icon: <Clock size={22} color="#4B2861" />, title: 'Horaires libres', desc: 'Travaillez quand vous voulez' },
                { icon: <Shield size={22} color="#4B2861" />, title: 'Assurance incluse', desc: 'Couverture pendant vos courses' },
              ].map((item, i) => (
                <View key={i} className="flex-row items-start gap-3">
                  <View className="w-12 h-12 bg-primary-100 rounded-2xl items-center justify-center">
                    {item.icon}
                  </View>
                  <View className="flex-1">
                    <Text className="text-gray-900 font-semibold text-sm">{item.title}</Text>
                    <Text className="text-gray-500 text-sm">{item.desc}</Text>
                  </View>
                </View>
              ))}
            </View>

            <TouchableOpacity
              onPress={handleApply}
              disabled={loading}
              className="bg-primary-800 rounded-2xl py-4 items-center"
            >
              {loading ? <ActivityIndicator color="white" /> : (
                <Text className="text-white font-semibold text-base">Commencer</Text>
              )}
            </TouchableOpacity>
          </View>
        )}

        {/* Step 2: Profile */}
        {step === 2 && (
          <View className="flex-1 px-6 pt-10">
            <View className="mb-8">
              <Text className="text-3xl font-black text-gray-900 mb-2">Vos informations</Text>
              <Text className="text-gray-500 text-base">Complétez votre profil pour continuer.</Text>
            </View>

            {/* Profile photo (optional, preview only until B5) */}
            <View className="items-center mb-6">
              <TouchableOpacity
                onPress={photo.chooseSource}
                activeOpacity={0.85}
                className="w-24 h-24 rounded-full bg-primary-100 items-center justify-center border-4 border-white shadow-sm shadow-primary-800/10"
              >
                {photo.hasPhoto ? (
                  <Image source={{ uri: photo.photo.uri as string }} className="w-full h-full rounded-full" />
                ) : (
                  <Camera size={26} color="#4B2861" />
                )}
              </TouchableOpacity>
              <Text className="text-gray-400 text-xs mt-2">Ajouter une photo (optionnel)</Text>
            </View>

            <View className="space-y-5">
              <View>
                <Text className="text-sm font-semibold text-gray-700 mb-2">Nom complet</Text>
                <TextInput
                  value={name}
                  onChangeText={setName}
                  placeholder="Mohamed Alami"
                  placeholderTextColor="#9CA3AF"
                  className="border border-gray-200 rounded-2xl px-4 py-3.5 text-base text-gray-900 bg-gray-50"
                />
              </View>
              <View>
                <Text className="text-sm font-semibold text-gray-700 mb-2">Email</Text>
                <TextInput
                  value={email}
                  onChangeText={setEmail}
                  placeholder="mohamed@email.com"
                  placeholderTextColor="#9CA3AF"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  className="border border-gray-200 rounded-2xl px-4 py-3.5 text-base text-gray-900 bg-gray-50"
                />
                <Text className="text-gray-400 text-xs mt-1.5">Optionnel</Text>
              </View>
            </View>

            <View className="mt-10">
              <TouchableOpacity
                onPress={handleSaveProfile}
                disabled={loading}
                className="bg-primary-800 rounded-2xl py-4 items-center"
              >
                {loading ? <ActivityIndicator color="white" /> : (
                  <Text className="text-white font-semibold text-base">Enregistrer</Text>
                )}
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setStep(3)} className="py-3 items-center mt-2">
                <Text className="text-gray-400 text-sm">Passer</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Step 3: Vehicle */}
        {step === 3 && (
          <View className="flex-1 px-6 pt-10">
            <View className="mb-8">
              <Text className="text-3xl font-black text-gray-900 mb-2">Votre véhicule</Text>
              <Text className="text-gray-500 text-base">Informations sur le véhicule.</Text>
            </View>

            <View className="space-y-5">
              <View>
                <Text className="text-sm font-semibold text-gray-700 mb-2">Marque</Text>
                <TextInput value={brand} onChangeText={setBrand} placeholder="Toyota" placeholderTextColor="#9CA3AF"
                  className="border border-gray-200 rounded-2xl px-4 py-3.5 text-base text-gray-900 bg-gray-50" />
              </View>
              <View>
                <Text className="text-sm font-semibold text-gray-700 mb-2">Modèle</Text>
                <TextInput value={model} onChangeText={setModel} placeholder="Corolla" placeholderTextColor="#9CA3AF"
                  className="border border-gray-200 rounded-2xl px-4 py-3.5 text-base text-gray-900 bg-gray-50" />
              </View>
              <View>
                <Text className="text-sm font-semibold text-gray-700 mb-2">Couleur</Text>
                <TextInput value={color} onChangeText={setColor} placeholder="Noir" placeholderTextColor="#9CA3AF"
                  className="border border-gray-200 rounded-2xl px-4 py-3.5 text-base text-gray-900 bg-gray-50" />
                <Text className="text-gray-400 text-xs mt-1.5">Optionnel — champ backend en cours (B6)</Text>
              </View>
              <View>
                <Text className="text-sm font-semibold text-gray-700 mb-2">Immatriculation</Text>
                <TextInput value={registrationNumber} onChangeText={setRegistrationNumber} placeholder="12345-A-12"
                  placeholderTextColor="#9CA3AF" autoCapitalize="characters"
                  className="border border-gray-200 rounded-2xl px-4 py-3.5 text-base text-gray-900 bg-gray-50" />
              </View>
            </View>

            <View className="mt-10">
              <TouchableOpacity
                onPress={handleSaveVehicle}
                disabled={loading}
                className="bg-primary-800 rounded-2xl py-4 items-center"
              >
                {loading ? <ActivityIndicator color="white" /> : (
                  <Text className="text-white font-semibold text-base">Enregistrer</Text>
                )}
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setStep(4)} className="py-3 items-center mt-2">
                <Text className="text-gray-400 text-sm">Passer</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Step 4: Documents */}
        {step === 4 && (
          <View className="flex-1 px-6 pt-10">
            <View className="mb-8">
              <Text className="text-3xl font-black text-gray-900 mb-2">Documents requis</Text>
              <Text className="text-gray-500 text-base">Uploadez vos documents pour validation.</Text>
            </View>

            <View className="space-y-3 mb-8">
              {[
                { type: 'CIN', label: 'Carte Nationale d\'Identité' },
                { type: 'REGISTRATION', label: 'Carte grise du véhicule' },
                { type: 'INSURANCE', label: 'Assurance auto' },
                { type: 'DRIVING_LICENSE', label: 'Permis de conduire' },
              ].map((doc) => {
                const status = docsStatus(doc.type);
                const docId = docsId(doc.type);
                const isDone = status === 'APPROVED';
                const isPending = status === 'PENDING';
                const isRejected = status === 'REJECTED';
                const isUploaded = isDone || isPending || isRejected;

                let borderColor = 'border-gray-200';
                let bgColor = '';
                let statusBg = 'bg-primary-100';
                let statusIcon = <FileText size={20} color="#4B2861" />;
                let statusText = 'Appuyez pour téléverser';
                let statusTextColor = 'text-gray-400';

                if (isDone) {
                  borderColor = 'border-green-200';
                  bgColor = 'bg-green-50';
                  statusBg = 'bg-green-100';
                  statusIcon = <Check size={20} color="#16a34a" />;
                  statusText = 'Approuvé';
                  statusTextColor = 'text-green-600';
                } else if (isPending) {
                  borderColor = 'border-amber-200';
                  bgColor = 'bg-amber-50';
                  statusBg = 'bg-amber-100';
                  statusIcon = <Clock size={20} color="#d97706" />;
                  statusText = 'En attente de validation';
                  statusTextColor = 'text-amber-600';
                } else if (isRejected) {
                  borderColor = 'border-red-200';
                  bgColor = 'bg-red-50';
                  statusBg = 'bg-red-100';
                  statusIcon = <X size={20} color="#dc2626" />;
                  statusText = 'Rejeté — re-uploadez';
                  statusTextColor = 'text-red-600';
                }

                return (
                  <TouchableOpacity
                    key={doc.type}
                    onPress={() => {
                      if (isUploaded && docId) {
                        viewDocument(docId);
                      } else {
                        router.push(`/driver/documents/upload?type=${doc.type}`);
                      }
                    }}
                    className={`flex-row items-center p-4 border rounded-2xl ${borderColor} ${bgColor}`}
                  >
                    <View className={`w-12 h-12 rounded-2xl items-center justify-center mr-3 ${statusBg}`}>
                      {statusIcon}
                    </View>
                    <View className="flex-1">
                      <Text className="text-gray-900 font-semibold text-sm">{doc.label}</Text>
                      <Text className={`text-xs ${statusTextColor}`}>{statusText}</Text>
                    </View>
                    {isUploaded ? (
                      <Eye size={18} color="#9CA3AF" />
                    ) : (
                      <ChevronRight size={18} color="#D1D5DB" />
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>

            <TouchableOpacity
              onPress={handleFinish}
              className="bg-primary-800 rounded-2xl py-4 items-center"
            >
              <Text className="text-white font-semibold text-base">Terminer</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={handleFinish} className="py-3 items-center mt-2">
              <Text className="text-gray-400 text-sm">Ajouter plus tard</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}