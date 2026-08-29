import { useCallback, useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, Image, Platform } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as FileSystem from 'expo-file-system/legacy';
import PdfRenderer from '@/components/DocumentRenderer';
import { API_URL, getAuthToken } from '@/lib/api/client';
import { ArrowLeft, AlertCircle, RefreshCw } from 'lucide-react-native';

const isWeb = Platform.OS === 'web';

export default function DocumentViewerScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const token = getAuthToken();
  const [docUri, setDocUri] = useState<string | null>(null);
  const [isImage, setIsImage] = useState(false);
  const [failed, setFailed] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const download = useCallback(async () => {
    if (!token) {
      setError('Session expirée, reconnectez-vous.');
      setFailed(true);
      setLoading(false);
      return;
    }
    setLoading(true);
    setFailed(false);
    setError(null);
    setDocUri(null);
    try {
      if (isWeb) {
        const resp = await fetch(`${API_URL}/driver/documents/${id}/view`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
        const contentType = resp.headers.get('content-type') || '';
        const url = URL.createObjectURL(await resp.blob());
        setIsImage(contentType.startsWith('image/'));
        setDocUri(url);
      } else {
        const dir = `${FileSystem.cacheDirectory}inhaz-docs/`;
        await FileSystem.makeDirectoryAsync(dir, { intermediates: true });
        const probe = `${dir}doc-${id}.tmp`;
        await FileSystem.deleteAsync(probe, { idempotent: true });

        const result = await FileSystem.downloadAsync(
          `${API_URL}/driver/documents/${id}/view`,
          probe,
          { headers: { Authorization: `Bearer ${token}` } }
        );

        if (result.status < 200 || result.status >= 300) {
          throw new Error(`HTTP ${result.status}`);
        }

        const mime = result.mimeType || result.headers?.['Content-Type'] || '';
        const ext = mime.includes('png') ? '.png' : mime.includes('jpeg') || mime.includes('jpg') ? '.jpg' : mime.includes('gif') ? '.gif' : '.pdf';
        const target = `${dir}doc-${id}${ext}`;
        await FileSystem.deleteAsync(target, { idempotent: true });
        await FileSystem.moveAsync({ from: probe, to: target });

        setIsImage(ext !== '.pdf');
        setDocUri(target);
      }
    } catch (e: any) {
      setFailed(true);
      setError(e?.message || 'Erreur de téléchargement');
    } finally {
      setLoading(false);
    }
  }, [id, token]);

  useEffect(() => {
    download();
  }, [download]);

  return (
    <View className="flex-1 bg-white">
      <View className="flex-row items-center px-4 pt-14 pb-3 border-b border-gray-100 bg-white">
        <TouchableOpacity onPress={() => router.back()} className="w-10 h-10 items-center justify-center">
          <ArrowLeft size={22} color="#1F2937" />
        </TouchableOpacity>
        <Text className="text-lg font-bold text-gray-900 ml-2 flex-1">Document</Text>
        {docUri && !failed && (
          <TouchableOpacity onPress={download} className="w-10 h-10 items-center justify-center">
            <RefreshCw size={18} color="#4B2861" />
          </TouchableOpacity>
        )}
      </View>

      {loading && (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#4B2861" />
          <Text className="text-gray-400 text-xs mt-3">Téléchargement du document...</Text>
        </View>
      )}

      {!loading && failed && (
        <View className="flex-1 items-center justify-center px-6">
          <AlertCircle size={40} color="#D1D5DB" />
          <Text className="text-gray-500 text-sm text-center mt-3">
            Impossible d'afficher ce document.
          </Text>
          {error && (
            <Text className="text-gray-400 text-xs text-center mt-1 px-6">
              {error}
            </Text>
          )}
          <View className="flex-row gap-3 mt-4">
            <TouchableOpacity onPress={() => router.back()} className="bg-gray-100 px-6 py-3 rounded-xl">
              <Text className="text-gray-600 font-semibold text-sm">Retour</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={download} className="bg-primary-800 px-6 py-3 rounded-xl">
              <Text className="text-white font-semibold text-sm">Réessayer</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {!loading && !failed && docUri && (isImage ? (
        <Image source={{ uri: docUri }} className="flex-1 bg-white" resizeMode="contain" />
      ) : (
        <PdfRenderer uri={docUri} onError={() => setFailed(true)} />
      ))}
    </View>
  );
}