# Android Release Checklist

WhiskNote now uses Capacitor for the Android app. The native project is in `android/` and the application ID is `com.whisknote.app`.

## Local development

1. Install Android Studio and an Android SDK.
2. Create the Supabase project and add its public URL and anon key to the app environment.
3. Implement Supabase authentication and recipe persistence before release. The current local storage account flow is still a prototype.
4. Run `npm run android:sync` after web changes.
5. Run `npm run android:open` to open the project in Android Studio.

## Google Play preparation

1. Replace `com.whisknote.app` if a different permanent application ID is required.
2. Create production launcher icons and a splash screen.
3. Configure a release signing key in Android Studio. Keep the keystore and passwords outside the repository.
4. Set the production version name and version code.
5. Test offline recipes, timers, imports/exports, account flows, and Android back navigation on physical devices.
6. Build a signed Android App Bundle (`.aab`) in Android Studio.
7. Complete the Play Console privacy policy, data safety, content rating, screenshots, support contact, and account deletion requirements.

The Gemini AI feature and its server dependency have been removed. Supabase integration is intentionally not enabled until the project URL, schema, and authentication choices are available.