import { useEffect, useState } from 'react';
import * as Location from 'expo-location';

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
