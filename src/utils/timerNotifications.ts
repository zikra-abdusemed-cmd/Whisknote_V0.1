import { Capacitor } from '@capacitor/core';
import { LocalNotifications } from '@capacitor/local-notifications';

const TIMER_NOTIFICATION_ID = 4201;
const EXACT_ALARM_ASKED_KEY = 'whisknote_exact_alarm_asked_v1';

/**
 * Android 12+ opens the "Alarms & reminders" settings screen whenever an exact alarm is
 * scheduled without that permission. Ask once; if the user declines, fall back to an
 * inexact alarm (may fire a little late) rather than nagging on every timer start.
 */
async function shouldRequestExact(): Promise<boolean> {
  if (Capacitor.getPlatform() !== 'android') return true;
  try {
    const { exact_alarm } = await LocalNotifications.checkExactNotificationSetting();
    if (exact_alarm === 'granted') return true;
    if (localStorage.getItem(EXACT_ALARM_ASKED_KEY)) return false;
    localStorage.setItem(EXACT_ALARM_ASKED_KEY, '1');
    return true;
  } catch {
    return false;
  }
}

/**
 * Schedule a system notification for when the bake timer ends, so the alert still
 * arrives while the phone is locked or the app is closed. No-op on the web.
 */
export async function scheduleTimerNotification(endAt: number, label: string): Promise<void> {
  if (!Capacitor.isNativePlatform() || endAt <= Date.now()) return;
  try {
    await LocalNotifications.cancel({ notifications: [{ id: TIMER_NOTIFICATION_ID }] });
    await LocalNotifications.schedule({
      notifications: [
        {
          id: TIMER_NOTIFICATION_ID,
          title: 'Ding! Timer finished',
          body: `${label} is ready. Check the oven!`,
          schedule: { at: new Date(endAt), allowWhileIdle: true },
          isExactNotification: await shouldRequestExact(),
        },
      ],
    });
  } catch (err) {
    // Permission denied or plugin unavailable: the in-app chime still works while open
    console.warn('Could not schedule timer notification', err);
  }
}

export async function cancelTimerNotification(): Promise<void> {
  if (!Capacitor.isNativePlatform()) return;
  try {
    await LocalNotifications.cancel({ notifications: [{ id: TIMER_NOTIFICATION_ID }] });
  } catch {
    // ignore
  }
}
