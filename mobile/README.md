# AccessFlow Mobile

Accessible fintech prototype built with Expo, React Native and TypeScript. The app uses the live AccessFlow backend only; it contains no simulated balances, transactions or transfer responses.

## Prerequisites

- Node.js 20 or newer
- Expo CLI (installed locally as `@expo/cli`)
- Running AccessFlow backend at `/api/v1`
- MongoDB replica set `rs0` for backend transaction support

## Setup

From `C:\Users\HOP\Desktop\accessflow\mobile`:

```bash
npm install
cp .env.example .env
```

Set `EXPO_PUBLIC_API_URL` in `.env`:

```env
EXPO_PUBLIC_API_URL=http://localhost:5000
```

Use `localhost` only for an Android emulator on Windows or when the backend and host resolve the same way. For a physical phone or iOS simulator, use the machine's LAN address:

```env
EXPO_PUBLIC_API_URL=http://192.168.1.10:5000
```

Ensure phone and computer are on the same Wi-Fi network and that Windows Firewall allows port `5000`.

## Backend preparation

From `C:\Users\HOP\Desktop\accessflow`:

```bash
npm run seed
npm run dev
```

Demo accounts:

```text
demo.user1@accessflow.local
demo.user2@accessflow.local
Password: Demo@12345
```

The admin account exists for backend administration only and is not exposed as a customer flow in the mobile app.

## Run

```bash
npm start
```

Then open the app with Expo Go or an Android/iOS emulator. Platform scripts:

```bash
npm run android
npm run ios
```

## Features

- Secure token storage on native with optional "remember me"; browser fallback storage on web for demo use.
- Session expiry handling.
- Live account, balance, transaction list and transaction detail screens.
- Two-step transfer workflow: review, confirm and cancel using backend APIs with an idempotency key.
- Accessibility Centre backed by the API's preference endpoints.
- Voice guidance, haptics, native screen-reader labels, privacy mode, high contrast, text scaling and light/dark themes.
- User-facing MAM dimension information from the backend reference endpoint.
- Loading, empty, error, offline and session-expired states.

Accessibility settings are API-backed except light/dark theme choice, which is stored on the device through Expo SecureStore/AsyncStorage.

## Verification

```bash
npm run typecheck
npm run lint
npx expo export --platform ios
```

## Notes

- Password recovery is intentionally absent because the backend does not provide that endpoint.
- Amounts are stored as kobo in the backend; the app formats naira for display and sends reviewed transfer amounts as fixed two-decimal strings.
- Expo Speech supplements TalkBack/VoiceOver and is not a replacement for native screen readers.
