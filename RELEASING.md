# Releasing WhiskNote

Pushing a version tag builds both apps on GitHub's servers:

```bash
git tag v1.0.1
git push origin v1.0.1
```

- **Android:** a signed `WhiskNote-1.0.1.apk` is attached to a new GitHub Release.
- **iOS:** the build is uploaded to App Store Connect. After Apple's processing (about 10–30 minutes) it appears in TestFlight.

Watch progress under the repo's **Actions** tab. You can also run the workflow by hand (**Actions → Release → Run workflow**). A manual run builds and uploads to TestFlight but doesn't create a GitHub Release.

## One-time setup: repository secrets

Add these under **GitHub repo → Settings → Secrets and variables → Actions → New repository secret**.

### Supabase (both platforms)
| Secret | Value |
|---|---|
| `VITE_SUPABASE_URL` | Same as in your local `.env` |
| `VITE_SUPABASE_ANON_KEY` | Same as in your local `.env` |

### Android signing
1. Create the release keystore once and **back it up**. Every future update must be signed with it:
   ```bash
   keytool -genkey -v -keystore ~/whisknote-release.jks -alias whisknote \
     -keyalg RSA -keysize 2048 -validity 10000
   ```
2. Add the secrets:

| Secret | Value |
|---|---|
| `ANDROID_KEYSTORE_BASE64` | Output of `base64 -i ~/whisknote-release.jks` |
| `ANDROID_KEYSTORE_PASSWORD` | The keystore password |
| `ANDROID_KEY_ALIAS` | `whisknote` |
| `ANDROID_KEY_PASSWORD` | The key password (same as the keystore password if you pressed Enter) |

### iOS (App Store Connect)
1. Register the bundle ID and create the app record:
   - developer.apple.com → **Identifiers → +** → App IDs → `com.whisknote.app`
   - appstoreconnect.apple.com → **Apps → +** → New App, using that bundle ID.
2. Create an API key: App Store Connect → **Users and Access → Integrations → App Store Connect API → Team Keys → +**.
   - Use the **Admin** role. Automatic signing needs it to create the distribution certificate and profile.
   - Download the `.p8` file. Apple only lets you download it once.
3. Add the secrets:

| Secret | Value |
|---|---|
| `APP_STORE_CONNECT_API_KEY_P8` | Full contents of the `.p8` file, including the BEGIN/END lines |
| `APP_STORE_CONNECT_KEY_ID` | The key's ID (shown in the keys list) |
| `APP_STORE_CONNECT_ISSUER_ID` | Issuer ID (shown above the keys list) |
| `APPLE_TEAM_ID` | developer.apple.com → **Account → Membership details → Team ID** |

## Getting the app to people

- **Android:** share the GitHub Release link. On the phone, download the `.apk`, open it, and allow "Install unknown apps" when asked.
  - Releases on a **private** repo are only visible to collaborators. For public downloads, make the repo public, or attach the APK somewhere public (e.g. Uptodown).
- **iPhone:** App Store Connect → your app → **TestFlight**.
  - Add testers by email, or create an **External Testing** group with a public link (up to 10,000 people). The first external build needs a short Beta App Review.
  - Testers install Apple's TestFlight app and open your link.
  - For the App Store itself, pick the build under **Distribution** and submit for review.

## Version numbers

- The tag (`v1.0.1`) becomes the visible version on both platforms.
- The build number (Android `versionCode`, iOS build) is the workflow's run number, so it always increases. Don't reuse an older tag.
