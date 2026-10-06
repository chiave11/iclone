import { CapacitorConfig } from '@capacitor/cli';

// iClone Capacitor configuration.
// To build native iOS/Android apps around the web build:
//   1) yarn add -D @capacitor/cli @capacitor/core
//   2) yarn build (produces build/ folder)
//   3) npx cap init iClone com.iclone.app --web-dir=build
//   4) npx cap add ios   (requires Mac + Xcode)
//   5) npx cap add android  (requires Android Studio)
//   6) npx cap copy && npx cap open ios|android
//
// For development, point `server.url` to your dev server; for production builds,
// remove `server.url` so the app loads the bundled build.

const config: CapacitorConfig = {
  appId: 'com.iclone.app',
  appName: 'iClone',
  webDir: 'build',
  bundledWebRuntime: false,
  backgroundColor: '#FBF7F0',
  ios: {
    contentInset: 'always',
    scheme: 'iClone',
  },
  android: {
    allowMixedContent: false,
    captureInput: true,
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 1500,
      launchAutoHide: true,
      backgroundColor: '#FBF7F0',
      androidSplashResourceName: 'splash',
      showSpinner: false,
    },
    LocalNotifications: {
      smallIcon: 'ic_stat_icon',
      iconColor: '#FF6B6B',
    },
  },
};

export default config;
