import { useCallback } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { FileText, ExternalLink } from 'lucide-react-native';

const COLORS = {
  primary: '#4B2861',
  purple: '#7C2DF5',
  border: '#EDEDF0',
  muted: '#8A9099',
};

export default function PdfRenderer({ uri }: { uri: string }) {
  const open = useCallback(() => {
    if (typeof window !== 'undefined' && uri) {
      window.open(uri, '_blank', 'noopener');
    }
  }, [uri]);

  return (
    <View className="flex-1 items-center justify-center px-8 bg-[#F2F2F7]">
      <View className="w-full bg-white rounded-3xl border border-[#EDEDF0] p-8 items-center">
        <View className="w-16 h-16 bg-primary-100 rounded-2xl items-center justify-center mb-5">
          <FileText size={28} color={COLORS.purple} />
        </View>
        <Text className="text-gray-900 font-bold text-lg mb-1.5">Document PDF</Text>
        <Text className="text-[#6C7078] text-sm text-center leading-5 mb-7">
          L'aperçu intégré n'est pas disponible sur le web.
        </Text>
        <TouchableOpacity
          onPress={open}
          activeOpacity={0.85}
          className="w-full flex-row items-center justify-center bg-primary-800 rounded-2xl py-4"
        >
          <ExternalLink size={17} color="white" />
          <Text className="text-white font-semibold text-base ml-2">Ouvrir le PDF</Text>
        </TouchableOpacity>
        <Text className="text-[#8A9099] text-xs mt-3">S'ouvre dans un nouvel onglet</Text>
      </View>
    </View>
  );
}