import { config } from '../constants/config';
import { useAuthStore } from '../stores/authStore';

export interface LoginResponse {
  user: { id: string; email: string; username: string; name: string };
  accessToken: string;
  expiresIn: number;
}

export interface RegisterResponse extends LoginResponse {}

export async function loginWithGoogle(idToken: string): Promise<LoginResponse> {
  const res = await fetch(`${config.apiUrl}/auth/google`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ idToken }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message ?? 'Google login failed');
  return data;
}

export async function loginWithFacebook(
  code: string,
  redirectUri: string
): Promise<LoginResponse> {
  const res = await fetch(`${config.apiUrl}/auth/facebook`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code, redirectUri }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message ?? 'Facebook login failed');
  return data;
}

export async function login(
  email: string,
  password: string
): Promise<LoginResponse> {
  const res = await fetch(`${config.apiUrl}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message ?? 'Login failed');
  return data;
}

export async function register(
  email: string,
  username: string,
  password: string,
  name: string
): Promise<RegisterResponse> {
  const res = await fetch(`${config.apiUrl}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, username, password, name }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message ?? 'Registration failed');
  return data;
}

export async function updateProfile(data: {
  name?: string;
  username?: string;
}): Promise<LoginResponse['user']> {
  const token = useAuthStore.getState().token;
  if (!token) throw new Error('Not authenticated');
  const res = await fetch(`${config.apiUrl}/auth/me`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });
  const responseData = await res.json();
  if (!res.ok) throw new Error(responseData.message ?? 'Update failed');
  return responseData;
}

export async function deleteAccount(): Promise<void> {
  const token = useAuthStore.getState().token;
  if (!token) throw new Error('Not authenticated');
  const res = await fetch(`${config.apiUrl}/auth/me`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message ?? 'Failed to delete account');
}
