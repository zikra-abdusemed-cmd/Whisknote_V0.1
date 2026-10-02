# Android Release Checklist

WhiskNote uses Capacitor for native Android/iOS. Full store submission steps (Supabase migration, signed AAB, TestFlight/IPA, privacy) are in **[SUBMISSION_GUIDE.md](./SUBMISSION_GUIDE.md)**.

## Quick local loop

1. Set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in `.env`.
2. Run `supabase/migrations/01_init.sql`, then `02_security_hardening.sql`, in the Supabase SQL Editor.
3. `npm run android:sync` then `npm run android:open`.
4. Application ID: `com.whisknote.app` · versionName `1.0.0` · versionCode `1`.

## Permissions

`INTERNET`, `VIBRATE` (haptics), `WAKE_LOCK` (baking timers) are declared in `AndroidManifest.xml`.
