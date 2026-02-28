const PRODUCTION_API = 'https://shopapi.cehaje.net/api/v1';
const PRODUCTION_SOCKET = 'https://shopapi.cehaje.net';

export const config = {
  apiUrl:
    process.env.EXPO_PUBLIC_API_URL ??
    (__DEV__ ? 'http://localhost:3000/api/v1' : PRODUCTION_API),
  socketUrl:
    process.env.EXPO_PUBLIC_SOCKET_URL ??
    (__DEV__ ? 'http://localhost:3000' : PRODUCTION_SOCKET),
  googleClientId: process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID ?? '',
  facebookAppId: process.env.EXPO_PUBLIC_FACEBOOK_APP_ID ?? '',
} as const;
