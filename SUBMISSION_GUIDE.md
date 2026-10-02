# WhiskNote App Store & Play Store Submission Guide

This guide covers Supabase setup, native builds, and store submission for **WhiskNote** (`com.whisknote.app`).

---

## Prerequisites

- Node.js 20+
- A [Supabase](https://supabase.com) project
- **Android:** Android Studio (Ladybug or newer) + JDK 21
- **iOS:** a Mac running macOS 14.5+ with **Xcode 16+** (Capacitor 8 uses Swift Package Manager — no CocoaPods needed), and an Apple Developer account ($99/year) for TestFlight/App Store. A free Apple ID is enough to run on your own iPhone.
- Google Play Console developer account ($25 one-time)

---

## 1. Run the Supabase SQL migration

1. Open [Supabase Dashboard](https://supabase.com/dashboard) → your project.
2. Go to **SQL Editor** → **New query**.
3. Paste the full contents of `supabase/migrations/01_init.sql` and click **Run**. Confirm success (profiles, recipes, RLS, `recipe-images` storage bucket).
4. New query → paste `supabase/migrations/02_security_hardening.sql` → **Run**. This blocks users from publishing "sample" recipes to everyone, adds size limits, and stops public listing of the storage bucket. Both files are safe to re-run.
5. **Authentication → Providers** → enable **Email**. Under **Authentication → URL Configuration**, set **Site URL** to where your web app is hosted (the email-confirmation link opens there). Under **Authentication → Settings**, set minimum password length to 8+ and enable leaked-password protection if your plan allows it.
6. Copy **Project URL** and **anon public** key from **Project Settings → API**.
7. Update local env:

```env
VITE_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

Use `.env` for local/native builds (gitignored) and keep `.env.example` as the template.

8. Rebuild the web bundle so Capacitor picks up env values:

```bash
npm run cap:sync
```

> Vite inlines `VITE_*` at build time. Changing `.env` requires a rebuild + `npx cap sync`.

---

## 2. Local native development

```bash
npm install
# After setting .env:
npm run cap:sync          # build web + sync ios & android
npm run cap:android       # sync + open Android Studio
npm run cap:ios           # sync + open Xcode (macOS only)
npm run assets:generate   # regenerate icons/splash from assets/
```

Placeholder brand assets live in `assets/` (`icon-only.png`, `icon-foreground.png`, `icon-background.png`, `splash.png`). Replace them with final 1024×1024 icons and a 2732×2732 splash, then run `npm run assets:generate`.

**SDK notes:** Capacitor 8 requires `minSdkVersion` ≥ 23. This project uses **24** (Play-safe). `targetSdkVersion` / `compileSdkVersion` are set to **36** in `android/variables.gradle` to meet current Play requirements.

---

## 3. Build a signed Android App Bundle (.aab)

### One-time: create a release keystore

1. Open Android Studio → **Build → Generate Signed Bundle / APK**.
2. Choose **Android App Bundle** → **Next**.
3. Click **Create new…** for the keystore.
4. Save the `.jks` / `.keystore` **outside** this repo. Record:
   - Keystore password
   - Key alias
   - Key password
5. Never commit the keystore or passwords.

Optional `android/keystore.properties` (gitignored):

```properties
storeFile=/absolute/path/to/whisknote-release.jks
storePassword=***
keyAlias=whisknote
keyPassword=***
```

### Build the AAB

1. Run `npm run android:sync` so `android/` has the latest web assets.
2. Open the project: `npm run android:open` (or Android Studio → Open `android/`).
3. **Build → Generate Signed Bundle / APK** → **Android App Bundle**.
4. Select your release keystore → **release** build type → **Create**.
5. Output path (typical):

   `android/app/release/app-release.aab`

### Upload to Google Play Console

1. Create the app with package name **`com.whisknote.app`**.
2. Complete **Store listing** (title, short/full description, screenshots, feature graphic, icon).
3. Complete **Content rating**, **Target audience**, **News apps** (N/A), **Data safety**, and **Privacy policy** URL.
4. Create a **Production** (or Internal testing) release → upload the `.aab`.
5. Provide an **account deletion** path (Play policy): e.g. in-app support email or a web form that deletes the Supabase `auth.users` row.

### Version bumps

In `android/app/build.gradle` (`defaultConfig`):

- Increment `versionCode` (integer) for every Play upload.
- Update `versionName` (e.g. `"1.0.1"`) for user-visible version.

---

## 4. Archive and upload iOS (.ipa) via Xcode / TestFlight

### One-time Apple setup

1. [Apple Developer](https://developer.apple.com) → register App ID **`com.whisknote.app`**.
2. App Store Connect → **My Apps** → **+** → create **WhiskNote** with that bundle ID.
3. Xcode → **Settings → Accounts** → add your Apple ID.

### Build & archive

1. On macOS: `npm run cap:ios` (builds web, syncs, opens Xcode).
2. In Xcode, select the **App** target:
   - **Signing & Capabilities** → Team → your team
   - Bundle Identifier: `com.whisknote.app`
   - Display name should read **WhiskNote** (`CFBundleDisplayName` in `Info.plist`)
3. Select a real device or **Any iOS Device (arm64)** (not a simulator).
4. **Product → Archive**.
5. Organizer → **Distribute App** → **App Store Connect** → **Upload**.
6. Wait for processing in App Store Connect → add the build to **TestFlight**, then submit for App Review.

### Info.plist privacy strings

Already configured for photo uploads:

- `NSCameraUsageDescription`
- `NSPhotoLibraryUsageDescription`
- `NSPhotoLibraryAddUsageDescription`

Update copy if your photo UX changes.

---

## 5. Privacy policy & data safety declarations

Publish a privacy policy URL (required by both stores). At minimum disclose:

| Data | Purpose | Collection |
|------|---------|------------|
| Email + auth credentials | Account signup / sign-in via Supabase Auth | Collected |
| Display name / profile | Personalize kitchen profile | Collected |
| Recipe content (ingredients, steps, notes, favorites) | Sync & backup across devices | Collected & stored in Supabase |
| Recipe photos | Optional recipe images in Storage (`recipe-images`) | Collected if user uploads |
| Device identifiers | Not used by WhiskNote beyond platform defaults | Typically not collected by the app |

### Google Play Data safety

- Declare **Email address** (account management).
- Declare **Photos / user-generated content** if image upload is enabled.
- Declare **encrypted in transit** (HTTPS to Supabase).
- Account deletion: provide a working method.

### App Store privacy nutrition labels

- **Contact Info → Email Address** — App Functionality
- **User Content → Photos / Other User Content** — App Functionality (if photos enabled)
- Data linked to identity; not used for tracking (unless you add analytics later).

### Suggested privacy policy language (adapt with legal review)

> WhiskNote uses Supabase to authenticate users with email and password and to store recipes and optional recipe photos so they sync across devices. Data is stored in your Supabase project region. We do not sell personal data. You may request account deletion by contacting [support@yourdomain.com]. Offline copies may remain on device until you clear app data.

---

## 6. Pre-submission QA checklist

- [ ] Sign up / sign in / sign out with real Supabase credentials. Each account has its own on-device notebook: after sign-out, a second account (or demo mode) must not see the first account's recipes
- [ ] Start a 1-minute timer, lock the phone: the "Timer finished" notification arrives on time (allow notifications, and on Android 12+ "Alarms & reminders", when prompted)
- [ ] Export backup / share recipe opens the native share sheet on both platforms
- [ ] Create, edit, favorite, and delete recipes while online → verify rows in Supabase Table Editor
- [ ] Airplane mode: create/edit recipes → go online → confirm sync (last-write-wins on `updated_at`)
- [ ] Baking timer haptics + alert on a physical device
- [ ] Android hardware back closes modals, then recipe detail, then exits
- [ ] Safe-area insets look correct on notched phones
- [ ] Replace placeholder icons/splash with final brand art
- [ ] Privacy policy URL live; Data safety / App Privacy forms match actual collection
- [ ] Support email and account-deletion instructions listed

---

## 7. Useful project paths

| Path | Purpose |
|------|---------|
| `supabase/migrations/01_init.sql` | Schema, RLS, storage |
| `supabase/migrations/02_security_hardening.sql` | RLS tightening, size limits |
| `src/lib/supabase.ts` | Typed Supabase client |
| `src/context/AuthContext.tsx` | Supabase Auth |
| `src/services/storageService.ts` | Offline-first + sync |
| `capacitor.config.ts` | App ID, splash, status bar |
| `android/` | Android Studio project |
| `ios/` | Xcode project |
| `assets/` | Source icons & splash |

---

## Troubleshooting

| Issue | Fix |
|-------|-----|
| Auth always fails / “placeholder” | Set real `VITE_SUPABASE_*` values and rebuild |
| Native app has old UI | `npm run cap:sync` then rebuild in IDE |
| iOS package resolution errors | Xcode → **File → Packages → Reset Package Caches**; make sure `npm install` ran first (packages resolve from `node_modules`) |
| iOS project won't open / build | Requires Xcode 16+; Xcode 14/15 cannot build Capacitor 8 |
| Sync not uploading | Confirm RLS policies ran; user must be signed in (not Demo) |
| Cleartext / network errors | Ensure Supabase URL uses `https://` |
