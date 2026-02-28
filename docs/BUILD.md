# ShopSyncX Build Guide

Commands for building and running the app in development and production.

---

## Development (Expo Dev Server)

Run the app with Expo's development server. Use this for daily development with Expo Go or a development build.

```bash
cd frontend
npx expo start
```

**Options:**

| Command | Use case |
|---------|----------|
| `npx expo start` | Start dev server (scan QR with Expo Go) |
| `npx expo start --tunnel` | Use tunnel (for testing on physical device when not on same network) |
| `npx expo start --android` | Open on Android emulator |
| `npx expo start --ios` | Open on iOS simulator |
| `npx expo start --web` | Open in web browser |

---

## Development Build (EAS)

Build a native development client. Use when you need native modules (e.g. SecureStore, custom native code) that don't work in Expo Go.

### Prerequisites

- [Expo account](https://expo.dev)
- EAS CLI: `npm install -g eas-cli`
- Log in: `eas login`

### Build development APK (Android)

```bash
cd frontend
eas build --platform android --profile development
```

When complete, download the APK from the link or from [expo.dev](https://expo.dev) → your project → Builds. Install on your device, then run:

```bash
npx expo start --dev-client
```

Scan the QR code with your development build (not Expo Go).

### Build development app (iOS)

```bash
cd frontend
eas build --platform ios --profile development
```

---

## Production Build (APK for distribution)

```bash
cd frontend
eas build --platform android --profile production
```

See [DEPLOYMENT.md](../DEPLOYMENT.md) for full deployment steps.

---

## Quick Reference

| Task | Command |
|------|---------|
| Run dev server | `cd frontend && npx expo start` |
| Run with tunnel | `cd frontend && npx expo start --tunnel` |
| Build dev APK | `cd frontend && eas build --platform android --profile development` |
| Build prod APK | `cd frontend && eas build --platform android --profile production` |
| Start with dev client | `cd frontend && npx expo start --dev-client` |
