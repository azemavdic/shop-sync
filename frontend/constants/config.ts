export const config = {
  apiUrl: process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000/api/v1',
  socketUrl: process.env.EXPO_PUBLIC_SOCKET_URL ?? 'http://localhost:3000',
  googleClientId: process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID ?? '',
  facebookAppId: process.env.EXPO_PUBLIC_FACEBOOK_APP_ID ?? '',
} as const;
