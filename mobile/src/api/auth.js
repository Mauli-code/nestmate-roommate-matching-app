import { request } from './client';
import { getItem, removeItem, setItem } from '../storage';

const TOKEN_KEY = 'nestmate_access_token';
const USER_KEY = 'nestmate_user';

export async function register(fullName, email, password) {
  return saveSession(await request('/api/auth/register', {
    method: 'POST', body: { fullName, email, password },
  }));
}

export async function login(email, password) {
  return saveSession(await request('/api/auth/login', {
    method: 'POST', body: { email, password },
  }));
}

export async function reactivate(email, password) {
  return saveSession(await request('/api/auth/reactivate', {
    method: 'POST', body: { email, password },
  }));
}

export function deactivateAccount(token) {
  return request('/api/auth/deactivate', { method: 'POST', body: { confirmation: true }, token });
}

export function requestAccountDeletion(token, password) {
  return request('/api/auth/deletion-request', {
    method: 'POST', body: { confirmation: 'DELETE', password }, token,
  });
}

export async function logout(token) {
  if (token) await request('/api/auth/logout', { method: 'POST', token }).catch(() => {});
  await Promise.all([removeItem(TOKEN_KEY), removeItem(USER_KEY)]);
}

export async function readSession() {
  const [token, userJson] = await Promise.all([getItem(TOKEN_KEY), getItem(USER_KEY)]);
  if (!token || !userJson) return null;
  try {
    return { token, user: JSON.parse(userJson) };
  } catch {
    await Promise.all([removeItem(TOKEN_KEY), removeItem(USER_KEY)]);
    return null;
  }
}

async function saveSession(result) {
  await Promise.all([
    setItem(TOKEN_KEY, result.accessToken),
    setItem(USER_KEY, JSON.stringify(result.user)),
  ]);
  return result;
}
