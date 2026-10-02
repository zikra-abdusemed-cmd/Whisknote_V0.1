import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.whisknote.app',
  appName: 'WhiskNote',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 1500,
      backgroundColor: '#FBF8F5',
      showSpinner: false,
    },
    LocalNotifications: {
      smallIcon: 'ic_stat_whisknote',
      iconColor: '#C26343',
    },
    StatusBar: {
      style: 'LIGHT',
      backgroundColor: '#FBF8F5',
    },
  },
};

export default config;
