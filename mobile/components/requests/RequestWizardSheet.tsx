import { useCallback, useEffect, useRef } from 'react';
import {
  Animated,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Keyboard,
  PanResponder,
  Dimensions,
  Platform,
} from 'react-native';
import type { ReactNode } from 'react';

export const REQUEST_WIZARD_SCREEN_HEIGHT = Dimensions.get('window').height;

// ── Snap points (distance from top of screen where the sheet starts) ──────────
export const REQUEST_WIZARD_SNAP_PEEK = Math.round(REQUEST_WIZARD_SCREEN_HEIGHT * 0.52); // ~52% from top → map takes top 52%
const SNAP_MID  = Math.round(REQUEST_WIZARD_SCREEN_HEIGHT * 0.34); // ~34% from top
const SNAP_FULL = Math.round(REQUEST_WIZARD_SCREEN_HEIGHT * 0.08); // ~8% from top  → almost full form
const SNAP_POINTS = [REQUEST_WIZARD_SNAP_PEEK, SNAP_MID, SNAP_FULL];

const STEP_TITLES = [
  '1. Adresses & Trajet',
  '2. Colis & Photos',
  '3. Type de Véhicule',
  '4. Budget & Prix proposé',
  '5. Récapitulatif & Publication',
];

export interface RequestWizardSheetProps {
  step: number;
  /** Active step content (presentational Step* components). */
  children: ReactNode;
  /** Show the "Retour" nav button (steps 2–4). */
  showBack: boolean;
  isNextDisabled: boolean;
  isSaving: boolean;
  onNext: () => void;
  onBack: () => void;
  /**
   * Called whenever the sheet settles at a new top offset (px from screen top).
   * The wizard uses it to keep the map's `bottomPadding` in sync.
   */
  onSheetTopChange?: (top: number) => void;
}

/**
 * RequestWizardSheet (W8) — the draggable bottom sheet of the request wizard.
 *
 * Extracted from the old create screen: it owns the snap points, the pan
 * gesture, and the keyboard handling. Step content and nav buttons arrive as
 * props/children, so the sheet stays presentational. The map itself lives on
 * the home screen (never remounts); sheet position is reported up through
 * `onSheetTopChange`.
 */
export function RequestWizardSheet({
  step,
  children,
  showBack,
  isNextDisabled,
  isSaving,
  onNext,
  onBack,
  onSheetTopChange,
}: RequestWizardSheetProps) {
  const sheetTopAnim  = useRef(new Animated.Value(REQUEST_WIZARD_SNAP_PEEK)).current;
  const sheetTopRef   = useRef(REQUEST_WIZARD_SNAP_PEEK); // live value for pan math
  const dragBaseRef   = useRef(REQUEST_WIZARD_SNAP_PEEK); // value at the moment touch starts

  // Keep the latest callback reachable from stable closures (pan responder).
  const onSheetTopChangeRef = useRef(onSheetTopChange);
  useEffect(() => {
    onSheetTopChangeRef.current = onSheetTopChange;
  });

  // Report the initial snap so the map padding starts correct.
  useEffect(() => {
    onSheetTopChangeRef.current?.(REQUEST_WIZARD_SNAP_PEEK);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Keep sheetTopRef in sync with the animated value
  useEffect(() => {
    const id = sheetTopAnim.addListener(({ value }) => { sheetTopRef.current = value; });
    return () => sheetTopAnim.removeListener(id);
  }, [sheetTopAnim]);

  const snapSheet = useCallback((target: number) => {
    const clamped = Math.max(SNAP_FULL, Math.min(REQUEST_WIZARD_SNAP_PEEK, target));
    Animated.spring(sheetTopAnim, { toValue: clamped, useNativeDriver: false, tension: 80, friction: 12 }).start();
    onSheetTopChangeRef.current?.(clamped);
  }, [sheetTopAnim]);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder:  () => true,
      onMoveShouldSetPanResponder:   (_, gs) => Math.abs(gs.dy) > 4,
      onPanResponderGrant: () => {
        dragBaseRef.current = sheetTopRef.current;
      },
      onPanResponderMove: (_, gs) => {
        const next    = dragBaseRef.current + gs.dy;
        const clamped = Math.max(SNAP_FULL - 30, Math.min(REQUEST_WIZARD_SNAP_PEEK + 30, next));
        sheetTopAnim.setValue(clamped);
      },
      onPanResponderRelease: (_, gs) => {
        const current = sheetTopRef.current;
        let target: number;

        if (gs.vy > 0.6) {
          // Fast swipe down → next lower snap (bigger number = lower on screen)
          target = SNAP_POINTS.find((p) => p > current + 10) ?? REQUEST_WIZARD_SNAP_PEEK;
        } else if (gs.vy < -0.6) {
          // Fast swipe up → next higher snap (smaller number = higher on screen)
          target = [...SNAP_POINTS].reverse().find((p) => p < current - 10) ?? SNAP_FULL;
        } else {
          // Nearest snap point
          target = SNAP_POINTS.reduce((best, p) =>
            Math.abs(p - current) < Math.abs(best - current) ? p : best,
          );
        }

        snapSheet(target);
      },
    }),
  ).current;

  // Keyboard: expand sheet so inputs stay visible
  useEffect(() => {
    const show = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      () => {
        // Expand to SNAP_FULL so keyboard doesn't cover the form
        snapSheet(SNAP_FULL);
      },
    );
    const hide = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => {
        // Don't auto-collapse — let user decide sheet position
      },
    );
    return () => { show.remove(); hide.remove(); };
  }, [snapSheet]);

  return (
    <Animated.View
      className="absolute left-0 right-0 bottom-0 bg-white rounded-t-3xl shadow-2xl z-10"
      style={{ top: sheetTopAnim }}
    >
      {/* Drag handle — responds to pan gestures */}
      <View className="pt-2.5 pb-2 px-5 border-b border-gray-100" {...panResponder.panHandlers}>
        <View className="sheet-drag-handle mb-2.5" />
        <View className="flex-row items-center justify-between">
          <Text className="text-sm font-bold text-gray-900 flex-1">
            {STEP_TITLES[Math.max(0, Math.min(STEP_TITLES.length - 1, step - 1))]}
          </Text>
          <View className="flex-row gap-[5px]">
            {[1, 2, 3, 4, 5].map((s) => (
              <View
                key={s}
                className={`h-[7px] rounded ${
                  s === step
                    ? 'w-[18px] bg-inhaz-purple'
                    : s < step
                      ? 'w-[7px] bg-purple-300'
                      : 'w-[7px] bg-gray-200'
                }`}
              />
            ))}
          </View>
        </View>
      </View>

      {/* Scrollable form */}
      <ScrollView
        className="flex-1"
        contentContainerClassName="px-5 pt-3 pb-6"
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        onScrollBeginDrag={() => snapSheet(SNAP_FULL)}
      >
        {children}
      </ScrollView>

      {/* Nav buttons */}
      {step < 5 && (
        <View className={`flex-row items-center justify-between px-5 pt-3 border-t border-gray-100 ${Platform.OS === 'ios' ? 'pb-7' : 'pb-4'}`}>
          {showBack ? (
            <TouchableOpacity onPress={onBack} className="px-5 py-3 rounded-xl border border-gray-300">
              <Text className="text-gray-700 text-xs font-bold">Retour</Text>
            </TouchableOpacity>
          ) : <View />}
          <TouchableOpacity
            onPress={onNext}
            disabled={isNextDisabled}
            className={`px-7 py-3 rounded-xl ${isNextDisabled ? 'bg-purple-300' : 'bg-inhaz-purple'}`}
          >
            {isSaving ? <ActivityIndicator color="#fff" size="small" /> : <Text className="text-white text-xs font-bold">Suivant →</Text>}
          </TouchableOpacity>
        </View>
      )}
    </Animated.View>
  );
}