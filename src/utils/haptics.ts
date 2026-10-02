import { Capacitor } from '@capacitor/core';
import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';

/**
 * Unified haptics: Capacitor on native, Vibration API on web.
 */
export async function triggerHaptic(
  pattern: number | number[] = 15
): Promise<void> {
  try {
    if (Capacitor.isNativePlatform()) {
      if (Array.isArray(pattern)) {
        await Haptics.notification({ type: NotificationType.Success });
        return;
      }
      if (pattern >= 40) {
        await Haptics.impact({ style: ImpactStyle.Heavy });
      } else if (pattern >= 20) {
        await Haptics.impact({ style: ImpactStyle.Medium });
      } else {
        await Haptics.impact({ style: ImpactStyle.Light });
      }
      return;
    }

    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate(pattern);
    }
  } catch {
    // Haptics unavailable — ignore
  }
}

export async function hapticSuccess(): Promise<void> {
  try {
    if (Capacitor.isNativePlatform()) {
      await Haptics.notification({ type: NotificationType.Success });
      return;
    }
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate([30, 40, 30]);
    }
  } catch {
    // ignore
  }
}

export async function hapticWarning(): Promise<void> {
  try {
    if (Capacitor.isNativePlatform()) {
      await Haptics.notification({ type: NotificationType.Warning });
      return;
    }
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate([80, 40, 80]);
    }
  } catch {
    // ignore
  }
}
