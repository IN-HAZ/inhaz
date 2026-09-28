import { useEffect, useState } from 'react';
import * as Location from 'expo-location';
import * as ImagePicker from 'expo-image-picker';
import * as Linking from 'expo-linking';

export interface PermissionStatusSummary {
  location: boolean;
  media: boolean;
}

let bootPermissionsPromise: Promise<PermissionStatusSummary> | null = null;

/**
 * Requests all required mobile application permissions (Location, Media).
 */
export function requestAllAppPermissions(): Promise<PermissionStatusSummary> {
  if (bootPermissionsPromise) {
    return bootPermissionsPromise;
  }

  bootPermissionsPromise = (async (): Promise<PermissionStatusSummary> => {
    const status: PermissionStatusSummary = {
      location: false,
      media: false,
    };

    try {
      // Mobile Foreground Location Permission
      const { status: permissionStatus } = await Location.requestForegroundPermissionsAsync();
      status.location = permissionStatus === 'granted';
      console.log('[App Boot Permissions] Location permission:', permissionStatus);

      status.media = true;
    } catch (error) {
      console.warn('[App Boot Permissions] Unexpected error during permission initialization:', error);
    }

    return status;
  })();

  return bootPermissionsPromise;
}

/**
 * React hook to trigger and monitor permission initialization at app startup.
 */
export function useAppPermissions(enabled = true) {
  const [permissionsGranted, setPermissionsGranted] = useState<boolean | null>(null);

  useEffect(() => {
    if (!enabled) return;

    let active = true;
    requestAllAppPermissions().then((result) => {
      if (active) {
        setPermissionsGranted(result.location);
      }
    });

    return () => {
      active = false;
    };
  }, [enabled]);

  return { permissionsGranted };
}

// ── Camera (feature-time only) ─────────────────────────────────────────────────
// Used by the web: `requestCameraPermission`/`getCameraPermission` wrap the
// expo-image-picker permission APIs. Nothing here runs at app boot — camera
// access is requested from the camera touchpoints (wizard package photos today,
// profile photo capture in onboarding).

/** Asks the OS for camera access. Returns the full PermissionResponse. */
export function requestCameraPermission() {
  return ImagePicker.requestCameraPermissionsAsync();
}

/** Reads the current camera permission without opening any dialog. */
export function getCameraPermission() {
  return ImagePicker.getCameraPermissionsAsync();
}

// ── Media library (feature-time only) ──────────────────────────────────────────
// On modern Android (photo picker) and iOS (PHPicker) the system picker works
// without a permission grant, so these are best-effort helpers: the gallery
// path may skip a blocking check; they are required when the picker must read
// the original asset or on older platforms.

/** Asks the OS for media-library access. Returns the full PermissionResponse. */
export function requestMediaLibraryPermission() {
  return ImagePicker.requestMediaLibraryPermissionsAsync();
}

/** Reads the current media-library permission without opening any dialog. */
export function getMediaLibraryPermission() {
  return ImagePicker.getMediaLibraryPermissionsAsync();
}

// ── Native settings ────────────────────────────────────────────────────────────
/**
 * Opens the native settings screen for this app. Used after a permission has
 * been permanently denied ("blocked") so the user can re-enable it.
 */
export function openAppSettings() {
  return Linking.openSettings();
}
