import { useCallback } from 'react';
import * as ImagePicker from 'expo-image-picker';
import { getMediaLibraryPermission, requestMediaLibraryPermission } from '@/lib/permissions';

/** A single picked image, normalized for app-level use. */
export interface PickedImage {
  uri: string;
  fileName: string | null;
}

export interface ImagePickResult {
  canceled: boolean;
  /** Selected assets (empty when canceled or when the picker returned nothing). */
  images: PickedImage[];
}

export interface UseImagePickerOptions {
  /** Allow selecting several images from the gallery. Default false. */
  multiple?: boolean;
  /**
   * Show the crop UI for a single image (profile avatars). Default false.
   * Automatically dropped when `multiple` is on — cropping multiple images
   * is not supported by expo-image-picker (mutually exclusive options).
   */
  allowsEditing?: boolean;
  /** Crop aspect ratio — only meaningful with `allowsEditing` (Android). */
  aspect?: [number, number];
  /** JPEG quality 0..1. Default 0.8. */
  quality?: number;
}

function toPickedImages(assets: ImagePicker.ImagePickerAsset[]): PickedImage[] {
  return assets.map((a) => ({ uri: a.uri, fileName: a.fileName ?? null }));
}

/**
 * Reusable gallery/camera image picking (profile photos, package photos, ...).
 *
 * Central concerns every call site used to hand-roll:
 * - Requests the media-library permission best-effort before opening the
 *   gallery. On Android 13+ without `READ_MEDIA_IMAGES` the fallback content
 *   picker can open with an EMPTY photo list (the system photo picker itself
 *   needs no permission, but not every device ships it).
 * - Recovers via `getPendingResultAsync()` when Android kills MainActivity
 *   while the picker is open (see the expo-image-picker docs), instead of
 *   swallowing the pick.
 * - Enforces the `allowsEditing` / `allowsMultipleSelection` exclusivity.
 *
 * Camera permission UX stays with the caller (the W3 state machine,
 * `useCameraPermission`) — this hook only performs the raw camera launch.
 */
export function useImagePicker(options: UseImagePickerOptions = {}) {
  const { multiple = false, allowsEditing = false, aspect, quality = 0.8 } = options;

  const buildOptions = useCallback(
    (overrides: { multiple?: boolean; allowsEditing?: boolean } = {}): ImagePicker.ImagePickerOptions => {
      const allowMultiple = overrides.multiple ?? multiple;
      const editing = allowMultiple ? false : overrides.allowsEditing ?? allowsEditing;
      const opts: ImagePicker.ImagePickerOptions = {
        mediaTypes: ['images'],
        quality,
        allowsMultipleSelection: allowMultiple,
        allowsEditing: editing,
      };
      if (editing && aspect) opts.aspect = aspect;
      return opts;
    },
    [multiple, allowsEditing, aspect, quality],
  );

  /** Best-effort — modern system pickers work without it, but some devices need it to list photos. */
  const ensureLibraryPermission = useCallback(async (): Promise<void> => {
    try {
      const current = await getMediaLibraryPermission();
      if (current.granted) return;
      if (current.canAskAgain) {
        await requestMediaLibraryPermission();
      }
      // Denied → launch anyway: the system photo picker needs no permission
      // and may still show the library.
    } catch {
      // Permission helpers failing must never block the picker.
    }
  }, []);

  /**
   * Android sometimes kills MainActivity while the picker is open, which
   * rejects/never resolves the launch promise. `getPendingResultAsync()`
   * returns the lost result (or null) so the pick can still succeed.
   */
  const recoverPending = useCallback(async (): Promise<ImagePickResult | null> => {
    try {
      const pending = await ImagePicker.getPendingResultAsync();
      if (!pending) return null;
      if ('canceled' in pending) {
        return pending.canceled
          ? { canceled: true, images: [] }
          : { canceled: false, images: toPickedImages(pending.assets ?? []) };
      }
      return null; // ImagePickerErrorResult — nothing recoverable.
    } catch {
      return null;
    }
  }, []);

  const pickFromLibrary = useCallback(
    async (overrides: { multiple?: boolean } = {}): Promise<ImagePickResult | null> => {
      await ensureLibraryPermission();
      try {
        const result = await ImagePicker.launchImageLibraryAsync(buildOptions(overrides));
        return result.canceled
          ? { canceled: true, images: [] }
          : { canceled: false, images: toPickedImages(result.assets ?? []) };
      } catch {
        return recoverPending();
      }
    },
    [ensureLibraryPermission, buildOptions, recoverPending],
  );

  /** Raw camera launch — callers gate camera access through the W3 permission machine first. */
  const pickFromCamera = useCallback(
    async (overrides: { allowsEditing?: boolean } = {}): Promise<ImagePickResult | null> => {
      try {
        const result = await ImagePicker.launchCameraAsync(buildOptions({ multiple: false, ...overrides }));
        return result.canceled
          ? { canceled: true, images: [] }
          : { canceled: false, images: toPickedImages(result.assets ?? []) };
      } catch {
        return recoverPending();
      }
    },
    [buildOptions, recoverPending],
  );

  return { pickFromLibrary, pickFromCamera };
}
