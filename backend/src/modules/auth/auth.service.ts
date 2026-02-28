import { randomBytes } from 'crypto';
import { hashPassword, verifyPassword } from '../../utils/password.js';
import {
  findUserByEmail,
  findUserByUsername,
  findUserByEmailOrUsername,
  findUserById,
  createUser,
  createUserFromOAuth,
  updateUser,
} from './auth.repository.js';

export async function register(
  email: string,
  username: string,
  password: string,
  name: string
) {
  const [existingEmail, existingUsername] = await Promise.all([
    findUserByEmail(email),
    findUserByUsername(username.toLowerCase()),
  ]);
  if (existingEmail) throw new Error('Email already registered');
  if (existingUsername) throw new Error('Username already taken');
  const hashed = await hashPassword(password);
  const user = await createUser({
    email,
    username: username.toLowerCase(),
    password: hashed,
    name,
  });
  return user;
}

export async function login(identifier: string, password: string) {
  const user = await findUserByEmailOrUsername(identifier);
  if (!user) {
    throw new Error('Invalid email/username or password');
  }
  const valid = await verifyPassword(password, user.password);
  if (!valid) {
    throw new Error('Invalid email/username or password');
  }
  return {
    id: user.id,
    email: user.email,
    username: user.username,
    name: user.name,
  };
}

export async function getUserById(id: string) {
  const user = await findUserById(id);
  return user
    ? { id: user.id, email: user.email, username: user.username, name: user.name }
    : null;
}

export async function updateProfile(
  userId: string,
  data: { name?: string; username?: string }
) {
  if (data.username) {
    const existing = await findUserByUsername(data.username.toLowerCase());
    if (existing && existing.id !== userId) {
      throw new Error('Username already taken');
    }
  }
  const user = await updateUser(userId, data);
  return { id: user.id, email: user.email, username: user.username, name: user.name };
}

function deriveUsername(email: string, name: string): string {
  const base = email.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, '_').slice(0, 20) || 'user';
  return base;
}

async function ensureUniqueUsername(base: string): Promise<string> {
  let username = base;
  let suffix = 0;
  while (await findUserByUsername(username)) {
    username = `${base}_${(suffix++).toString(36).slice(-4)}`;
  }
  return username;
}

export async function googleAuth(idToken: string) {
  const { OAuth2Client } = await import('google-auth-library');
  const clientId = process.env.GOOGLE_CLIENT_ID;
  if (!clientId) {
    throw new Error('Google login is not configured');
  }
  const client = new OAuth2Client();
  const ticket = await client.verifyIdToken({ idToken, audience: clientId });
  const payload = ticket.getPayload();
  if (!payload?.email) throw new Error('Google did not provide email');
  const email = payload.email.toLowerCase();
  const name = payload.name ?? payload.email.split('@')[0];
  let user = await findUserByEmail(email);
  if (!user) {
    const baseUsername = deriveUsername(email, name);
    const username = await ensureUniqueUsername(baseUsername);
    const passwordHash = await hashPassword(randomBytes(32).toString('hex'));
    const created = await createUserFromOAuth({
      email,
      username,
      passwordHash,
      name,
    });
    user = { ...created, password: '' };
  }
  return {
    id: user.id,
    email: user.email,
    username: user.username,
    name: user.name,
  };
}

export async function facebookAuth(code: string, redirectUri: string) {
  const appId = process.env.FACEBOOK_APP_ID;
  const appSecret = process.env.FACEBOOK_APP_SECRET;
  if (!appId || !appSecret) {
    throw new Error('Facebook login is not configured');
  }
  const tokenRes = await fetch(
    `https://graph.facebook.com/v18.0/oauth/access_token?` +
      new URLSearchParams({
        client_id: appId,
        client_secret: appSecret,
        redirect_uri: redirectUri,
        code,
      }),
    { method: 'GET' }
  );
  const tokenData = await tokenRes.json();
  const accessToken = tokenData.access_token;
  if (!accessToken) {
    throw new Error(tokenData.error?.message ?? 'Invalid Facebook response');
  }
  const meRes = await fetch(
    `https://graph.facebook.com/me?fields=id,email,name&access_token=${accessToken}`
  );
  const me = await meRes.json();
  if (!me.email) throw new Error('Facebook did not provide email. Please grant email permission.');
  const email = me.email.toLowerCase();
  const name = me.name ?? me.email.split('@')[0];
  let user = await findUserByEmail(email);
  if (!user) {
    const baseUsername = deriveUsername(email, name);
    const username = await ensureUniqueUsername(baseUsername);
    const passwordHash = await hashPassword(randomBytes(32).toString('hex'));
    const created = await createUserFromOAuth({
      email,
      username,
      passwordHash,
      name,
    });
    user = { ...created, password: '' };
  }
  return {
    id: user.id,
    email: user.email,
    username: user.username,
    name: user.name,
  };
}
