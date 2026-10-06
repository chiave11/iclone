# iClone – Guida all'app nativa (iOS + Android)

iClone è già utilizzabile come **PWA installabile** da iPhone, Android e desktop. Questo file spiega come generare le versioni native per App Store e Play Store usando Capacitor.

## 1. PWA (già attiva)

L'app è installabile dal browser:
- **Android/Chrome**: compare il banner "Installa iClone" (o Menu → Installa app)
- **iPhone/Safari**: tocca Condividi → Aggiungi a Home
- **Desktop (Chrome/Edge)**: icona di installazione nella barra URL

## 2. App nativa con Capacitor

### Prerequisiti
- Node 18+ e Yarn (già nel progetto)
- **Per iOS**: macOS con Xcode 15+ e un account Apple Developer
- **Per Android**: Android Studio e JDK 17

### Setup iniziale (una tantum)

```bash
cd /app/frontend
yarn add -D @capacitor/cli
yarn add @capacitor/core @capacitor/ios @capacitor/android \
          @capacitor/splash-screen @capacitor/local-notifications \
          @capacitor/status-bar @capacitor/app
yarn build
npx cap init iClone com.iclone.app --web-dir=build
npx cap add ios
npx cap add android
```

Il file `capacitor.config.ts` è già presente nel progetto.

### Ogni volta che modifichi il codice web

```bash
yarn build
npx cap copy
```

### Aprire e firmare l'app

```bash
npx cap open ios      # Apre Xcode
npx cap open android  # Apre Android Studio
```

In Xcode: scegli il tuo Team, configura Bundle ID (`com.iclone.app`), Archive → Distribuisci su App Store.

In Android Studio: Build → Generate Signed Bundle/APK, carica l'AAB su Google Play Console.

### Note importanti

- **Backend URL**: l'app nativa punta allo stesso backend via HTTPS. Assicurati che `REACT_APP_BACKEND_URL` in `frontend/.env` sia l'URL pubblico HTTPS prima di `yarn build`.
- **Notifiche push**: per push remote serve configurare APNs (Apple) e FCM (Firebase). La libreria `@capacitor/local-notifications` abilita i promemoria locali offline.
- **Icone native**: metti le icone in `ios/App/App/Assets.xcassets/AppIcon.appiconset/` e `android/app/src/main/res/mipmap-*/`. Puoi generarle da `public/icon-512.png` con tool come `pwa-asset-generator`.
- **Permessi**: Capacitor gestisce automaticamente i permessi notifiche al primo utilizzo.

### Costi di pubblicazione
- **Apple Developer**: 99$/anno
- **Google Play**: 25$ una tantum

### Troubleshooting rapido
- `yarn build` fallisce con "out of memory": `export NODE_OPTIONS=--max-old-space-size=4096`
- Pod install errors (iOS): `cd ios/App && pod install --repo-update`
- Android gradle sync: usa JDK 17 in Android Studio settings
