import { useEffect } from 'react';
import { Capacitor } from '@capacitor/core';
import { App as CapApp } from '@capacitor/app';
import { StatusBar, Style } from '@capacitor/status-bar';
import { SplashScreen } from '@capacitor/splash-screen';
import { Keyboard, KeyboardResize } from '@capacitor/keyboard';

export interface NativeBackHandlerOptions {
  /** Return true if the back press was handled (e.g. closed a modal). */
  onBack: () => boolean;
}

/**
 * Configure Capacitor StatusBar, SplashScreen, Keyboard on native platforms.
 */
export function useNativePlatformSetup(): void {
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    const setup = async () => {
      try {
        await StatusBar.setStyle({ style: Style.Dark });
        await StatusBar.setBackgroundColor({ color: '#FBF8F5' });
      } catch {
        // StatusBar may be unavailable on some platforms
      }

      try {
        if (Capacitor.getPlatform() === 'android') {
          await Keyboard.setResizeMode({ mode: KeyboardResize.Body });
        }
      } catch {
        // Keyboard plugin optional
      }

      try {
        await SplashScreen.hide();
      } catch {
        // ignore
      }
    };

    void setup();
  }, []);
}

/**
 * Android hardware back button: close modals first, then navigate back, then exit.
 */
export function useAndroidBackButton({ onBack }: NativeBackHandlerOptions): void {
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    const listener = CapApp.addListener('backButton', ({ canGoBack }) => {
      const handled = onBack();
      if (handled) return;

      if (canGoBack) {
        window.history.back();
        return;
      }

      CapApp.exitApp();
    });

    return () => {
      void listener.then(l => l.remove());
    };
  }, [onBack]);
}
