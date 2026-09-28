import { useCallback, useState } from 'react';
import { Alert } from 'react-native';
import { useCameraPermission } from '@/lib/hooks/useCameraPermission';
import { uploadsApi, type UploadFileInput } from '@/lib/api/uploads';
import { useImagePicker } from '@/lib/hooks/useImagePicker';

export interface ProfilePhotoState {
  uri: string | null;
  fileName: string | null;
}

export interface UseProfilePhotoResult {
  photo: ProfilePhotoState;
  hasPhoto: boolean;
  /** Show the source chooser (Galerie / Caméra). Camera is permission-gated (W3). */
  chooseSource: () => void;
  /** Best-effort upload through `uploadsApi.uploadProfilePhoto` — mock seam until backend B5. Returns null on failure. */
  upload: () => Promise<{ url: string } | null>;
}

/**
 * Profile-photo capture for onboarding (W7 §6.3/§6.4). Picking is delegated to
 * the shared `useImagePicker` hook (which requests the media-library permission
 * before the gallery opens and recovers Android MainActivity kills). Camera
 * access stays gated by the W3 state machine (`useCameraPermission`) —
 * permanently denied users only get the Settings path, never a re-opened
 * native dialog. Upload goes through the mock seam until backend ticket B5
 * ships the real endpoint.
 */
export function useProfilePhoto(featureKey: string): UseProfilePhotoResult {
  const [photo, setPhoto] = useState<ProfilePhotoState>({ uri: null, fileName: null });
  const camera = useCameraPermission(featureKey);

  // Avatar: single image, cropped to a square, modest compression.
  const { pickFromLibrary, pickFromCamera } = useImagePicker({
    allowsEditing: true,
    aspect: [1, 1],
    quality: 0.7,
  });

  const applyPick = useCallback(
    (result: Awaited<ReturnType<typeof pickFromLibrary>>) => {
      if (result && !result.canceled && result.images.length > 0) {
        const asset = result.images[0];
        setPhoto({
          uri: asset.uri,
          fileName: asset.fileName || `avatar_${Date.now()}.jpg`,
        });
      }
    },
    [],
  );

  const keepPhoto = useCallback(async () => {
    applyPick(await pickFromLibrary());
  }, [applyPick, pickFromLibrary]);

  const takePhoto = useCallback(async () => {
    applyPick(await pickFromCamera());
  }, [applyPick, pickFromCamera]);

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
        { text: 'Réessayer', onPress: () => void takePhoto() },
      ],
    );
    return false;
  }, [camera, takePhoto]);

  const chooseSource = useCallback(() => {
    Alert.alert('Photo de profil', 'Choisissez la source de votre photo.', [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Galerie', onPress: () => void keepPhoto() },
      { text: 'Caméra', onPress: () => void ensureCameraAccess().then((ok) => { if (ok) void takePhoto(); }) },
    ]);
  }, [keepPhoto, ensureCameraAccess, takePhoto]);

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