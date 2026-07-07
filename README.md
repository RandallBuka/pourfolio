# Pourfolio

Track what's on your home bar shelf and discover cocktails you can make tonight. Runs in the browser, as an installable PWA, and as native iOS/Android apps.

## Features

- **Home hub** — What's in Stock / Ready to Pour / Almost There
- **Multiple shelves** — home, vacation house, etc.
- **Brand-aware ingredients** with smart substitution matching
- **Recipe browser** — search, categories, saved recipes
- **Offline-first** — all data stored locally on your device

## Quick Start (Web)

```bash
cd C:\Users\Randa\inmybar
npm install
npm run dev
```

Open http://localhost:5173

## Native iOS & Android

See [Capacitor setup](#native-ios--android-capacitor) in this README — same React codebase ships to App Store and Google Play.

```bash
npm run build
npx cap add android
npm run cap:android
```

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server |
| `npm run build` | Production build |
| `npm run fetch-images` | Cache ingredient photos |
| `npm run fetch-drink-images` | Cache recipe/drink photos |
| `npm run fetch-all-images` | Refresh both image caches |

## Barcode scanning

Tap **▦** on **All Ingredients** or **Your Stock** to scan a bottle UPC. Products are looked up via [Open Food Facts](https://world.openfoodfacts.org). On native iOS/Android, the ML Kit camera scanner is used; in the browser, your device camera is used (HTTPS required on mobile).

After `cap add ios` / `cap add android`, run `npm run cap:sync` so the barcode plugin is included. iOS needs `NSCameraUsageDescription` in `Info.plist`; Android needs camera permission (added automatically by the plugin).
| `npm run cap:sync` | Build + sync to native projects |

## Tech Stack

React 19 · TypeScript · Vite · Capacitor 7 · localStorage
