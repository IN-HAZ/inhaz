import { useCallback, useEffect, useState } from 'react';
import { AppState, type AppStateStatus } from 'react-native';
import {
    getCameraPermission,
    openAppSettings,
    requestCameraPermission,
} from '@/lib/permissions';

/**
 * Camera permission state machine (feature-time only, never at boot).
 *
 * Flow per feature:
 *   undetermined ──request()──▶ granted
 *        │                        ▲
 *        ▼                        │
 *   denied-can-ask ──re-request───┘
 *        │
 *        ▼
 *   blocked (permanently denied) ──▶ openSettings() → recheck() on return
 */
export type CameraPermissionState =
    | 'undetermined' // never asked yet
    | 'granted'
    | 'denied-can-ask' // denied but the OS would allow another prompt
    | 'blocked'; // permanently denied → never re-open the native dialog

type PermissionLike = {
    granted: boolean;
    status: string;
    canAskAgain: boolean;
};

/**
 * Remember permanent denials per feature so a remounted feature never re-opens
 * the native permission dialog after the user has blocked it.
 */
const blockedFeatures = new Set<string>();

function deriveState(res: PermissionLike | null): CameraPermissionState {
    if (!res) return 'undetermined';
    if (res.granted) return 'granted';
    if (res.status === 'denied' && !res.canAskAgain) return 'blocked';
    if (res.status === 'denied') return 'denied-can-ask';
    return 'undetermined';
}

export interface UseCameraPermissionResult {
    state: CameraPermissionState;
    /** True while a native permission dialog may be in flight. */
    requesting: boolean;
    /** True when the feature may use the camera right now. */
    canUseCamera: boolean;
    /**
     * Open the native permission dialog. No-op (returns `'blocked'`) once the
     * user has permanently denied access for this feature — opening Settings is
     * the only path forward then.
     */
    request: () => Promise<CameraPermissionState>;
    /** Re-read the OS permission, e.g. when returning from Settings. */
    recheck: () => Promise<CameraPermissionState>;
    /** Open the native app settings screen. */
    openSettings: () => Promise<void>;
}

export function useCameraPermission(featureKey: string): UseCameraPermissionResult {
    const [state, setState] = useState<CameraPermissionState>(() =>
        blockedFeatures.has(featureKey) ? 'blocked' : 'undetermined',
    );
    const [requesting, setRequesting] = useState(false);

    const apply = useCallback(
        (res: PermissionLike | null) => {
            const next = deriveState(res);
            if (next === 'blocked') blockedFeatures.add(featureKey);
            setState(next);
            return next;
        },
        [featureKey],
    );

    // Passive sync on mount and whenever the app returns to the foreground
    // (covers returning from native Settings). Never opens a dialog.
    useEffect(() => {
        let mounted = true;
        getCameraPermission().then((res) => {
            if (mounted) apply(res);
        });
        const sub = AppState.addEventListener('change', (status: AppStateStatus) => {
            if (status === 'active') {
                getCameraPermission().then((res) => {
                    if (mounted) apply(res);
                });
            }
        });
        return () => {
            mounted = false;
            sub.remove();
        };
    }, [apply]);

    const request = useCallback(async (): Promise<CameraPermissionState> => {
        if (blockedFeatures.has(featureKey)) return 'blocked';
        setRequesting(true);
        try {
            const res = await requestCameraPermission();
            return apply(res);
        } finally {
            setRequesting(false);
        }
    }, [apply]);

    const recheck = useCallback(async (): Promise<CameraPermissionState> => {
        const res = await getCameraPermission();
        return apply(res);
    }, [apply]);

    const openSettings = useCallback(async () => {
        await openAppSettings();
    }, []);

    return {
        state,
        requesting,
        canUseCamera: state === 'granted',
        request,
        recheck,
        openSettings,
    };
}