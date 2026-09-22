import { useCallback, useState } from 'react';
import { Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useCameraPermission } from '@/lib/hooks/useCameraPermission';
import { uploadsApi, type UploadFileInput } from '@/lib/api/uploads';

export interface ProfilePhotoState {
  uri: string | null;
  fileName: string | null;
}

const PICKER_OPTIONS: ImagePicker.ImagePickerOptions = {
  mediaTypes: ['images'],
  quality: 0.7,
  allowsEditing: true,
  aspect: [1, 1],
};

export interface UseProfilePhotoResult {
  photo: ProfilePhotoState;
  hasPhoto: boolean;
  /** Show the source chooser (Galerie / Caméra). Camera is permission-gated (W3). */
  chooseSource: () => void;
  /** Best-effort upload through `uploadsApi.uploadProfilePhoto` — mock seam until backend B5. Returns null on failure. */
  upload: () => Promise<{ url: string } | null>;
}

/**
 * Profile-photo capture for onboarding (W7 §6.3/§6.4). Camera access is still
 * gated by the W3 state machine (`useCameraPermission`) — permanently denied
 * users only get the Settings path, never a re-opened native dialog. Upload
 * goes through the mock seam until backend ticket B5 ships the real endpoint.
 */
export function useProfilePhoto(featureKey: string): UseProfilePhotoResult {
  const [photo, setPhoto] = useState<ProfilePhotoState>({ uri: null, fileName: null });
  const camera = useCameraPermission(featureKey);

  const pick = useCallback(async (useCamera: boolean): Promise<void> => {
    try {
      const source = useCamera
        ? ImagePicker.launchCameraAsync(PICKER_OPTIONS)
        : ImagePicker.launchImageLibraryAsync(PICKER_OPTIONS);
      const result = await source;
      if (!result.canceled && result.assets?.length) {
        const asset = result.assets[0];
        setPhoto({
          uri: asset.uri,
          fileName: asset.fileName || `avatar_${Date.now()}.jpg`,
        });
      }
    } catch {
      Alert.alert('Erreur', 'Impossible de sélectionner la photo');
    }
  }, []);

  const pickFromCamera = useCallback(() => {
    void pick(true);
  }, [pick]);

  const pickFromLibrary = useCallback(() => {
    void pick(false);
  }, [pick]);

  /** Returns true when the camera is usable; otherwise shows the W3 UX for the current state. */
  const ensureCameraAccess = useCallback(async (): Promise<boolean> => {
    if (camera.canUseCamera) return true;
    if (camera.state === 'blocked') {
      // Permanently denied → message + Settings only, never re-open the dialog.
      Alert.alert(
        'Caméra inaccessible',
        "L'accès à la caméra a été bloqué. Ouvrez les réglages de l'app pour l'autoriser.",
        [
          { text: 'Annuler', style: 'cancel' },
          { text: 'Ouvrir les réglages', onPress: () => camera.openSettings() },
        ],
      );
      return false;
    }
    const next = await camera.request();
    if (next === 'granted') return true;
    if (next === 'blocked') {
      Alert.alert(
        'Caméra inaccessible',
        "L'accès à la caméra a été bloqué. Ouvrez les réglages de l'app pour l'autoriser.",
        [
          { text: 'Annuler', style: 'cancel' },
          { text: 'Ouvrir les réglages', onPress: () => camera.openSettings() },
        ],
      );
      return false;
    }
    Alert.alert(
      'Caméra requise',
      "L'accès à la caméra est nécessaire pour prendre votre photo de profil.",
      [
        { text: 'Annuler', style: 'cancel' },
        { text: 'Réessayer', onPress: pickFromCamera },
      ],
    );
    return false;
  }, [camera, pickFromCamera]);

  const chooseSource = useCallback(() => {
    Alert.alert('Photo de profil', 'Choisissez la source de votre photo.', [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Galerie', onPress: pickFromLibrary },
      { text: 'Caméra', onPress: () => void ensureCameraAccess() },
    ]);
  }, [pickFromLibrary, ensureCameraAccess]);

  const upload = useCallback(async (): Promise<{ url: string } | null> => {
    if (!photo.uri || !photo.fileName) return null;
    const file: UploadFileInput = {
      uri: photo.uri,
      name: photo.fileName,
      type: 'image/jpeg',
    };
    try {
      return await uploadsApi.uploadProfilePhoto(file);
    } catch {
      // Real branch not shipped yet (ticket B5); the callers surface a warning.
      return null;
    }
  }, [photo]);

  return { photo, hasPhoto: !!photo.uri, chooseSource, upload };
}