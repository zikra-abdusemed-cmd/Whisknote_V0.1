# Installing WhiskNote on iPhone

WhiskNote isn't on the App Store yet. You can still install it with a free sideloading tool and your own Apple ID.

**What you need**
- An iPhone or iPad
- A Mac or Windows computer and a USB cable (for the first install)
- An Apple ID. Your normal one works. Some people prefer a separate, spare Apple ID for sideloading.

**Know before you start**
- With a free Apple ID, sideloaded apps **expire after 7 days**. After that the app won't open until you refresh it. **Your recipes are not lost when this happens:** they stay on the phone and in your cloud account.
- A free Apple ID can have **3 sideloaded apps** on a device at a time.

---

## 1. Download the app file

On your computer, open the [latest release](../../releases/latest) and download **`WhiskNote-<version>-unsigned.ipa`**.

## 2. Install it

Pick **one** of these tools.

### Option A: Sideloadly (simplest)
1. Install [Sideloadly](https://sideloadly.io) on your computer.
   - **On Windows,** also install iTunes and iCloud from Apple's website (not the Microsoft Store versions). Sideloadly's site explains this.
2. Plug in your iPhone, unlock it, and tap **Trust** if asked.
3. Open Sideloadly and drag the `.ipa` file onto it.
4. Enter your Apple ID email and click **Start**. Sign in with your password and 2-factor code when asked.
5. Wait for "Done".

**To refresh every 7 days:** run Sideloadly again with the same file.

### Option B: AltStore (refreshes automatically)
1. Follow the setup at [altstore.io](https://altstore.io) to install AltServer on your computer and the AltStore app on your iPhone.
2. Copy the `.ipa` to your iPhone, e.g. with AirDrop or the Files app.
3. In AltStore, go to **My Apps → +** and choose the `.ipa`.

**Refreshing:** AltStore refreshes WhiskNote in the background whenever your phone and computer are on the same Wi-Fi with AltServer running.

### Option C: SideStore (refreshes on the phone, no computer after setup)
Follow the guide at [sidestore.io](https://sidestore.io). The first setup takes longer, but after that you can refresh with no computer.

## 3. First launch: allow the app on your iPhone

1. **Trust the developer.** Go to **Settings → General → VPN & Device Management**, tap your Apple ID under "Developer App", then **Trust**.
2. **Turn on Developer Mode** (iOS 16 and later). If iOS asks:
   - Go to **Settings → Privacy & Security → Developer Mode**, turn it on, and restart.
   - After the restart, confirm **Turn On**.
3. Open **WhiskNote**. Allow notifications when asked, so the bake timer can alert you while the phone is locked.

---

## Updating to a new version

Download the new `.ipa` from Releases and install it the same way. It replaces the old version, and your recipes are kept.

## Troubleshooting

| Problem | Fix |
|---|---|
| "Untrusted Developer" | Do step 3.1 |
| "Unable to verify app" / app won't open after a week | The 7 days are up. Refresh with your tool |
| "Maximum number of apps" error | Remove another sideloaded app; free Apple IDs allow 3 |
| Sideloadly login fails | Double-check 2-factor code; on Windows make sure iTunes/iCloud are the website versions |
