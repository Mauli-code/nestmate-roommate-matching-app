import * as SecureStore from 'expo-secure-store';

const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_BASE_URL || 'http://10.0.2.2:3001';
const TOKEN_KEY = 'nestmate_access_token';
const USER_KEY = 'nestmate_user';

async function request(path, method, body, token) {
  let response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      method,
      headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      ...(body ? { body: JSON.stringify(body) } : {}),
    });
  } catch {
    throw new Error('The backend could not be reached. Check that it is running.');
  }

  const responseBody = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(responseBody?.message || `The request failed (${response.status}).`);
  }
  return responseBody;
}

export async function register(fullName, email, password) {
  const result = await request('/api/auth/register', 'POST', { fullName, email, password });
  await saveSession(result);
  return result;
}

export async function login(email, password) {
  const result = await request('/api/auth/login', 'POST', { email, password });
  await saveSession(result);
  return result;
}

export async function reactivate(email, password) {
  const result = await request('/api/auth/reactivate', 'POST', { email, password });
  await saveSession(result);
  return result;
}

export function deactivateAccount(token) {
  return request('/api/auth/deactivate', 'POST', { confirmation: true }, token);
}

export function requestAccountDeletion(token, password) {
  return request(
    '/api/auth/deletion-request',
    'POST',
    { confirmation: 'DELETE', password },
    token,
  );
}

export async function logout(token) {
  if (token) {
    await request('/api/auth/logout', 'POST', undefined, token).catch(() => {});
  }
  await SecureStore.deleteItemAsync(TOKEN_KEY);
  await SecureStore.deleteItemAsync(USER_KEY);
}

export async function readSession() {
  const [token, userJson] = await Promise.all([
    SecureStore.getItemAsync(TOKEN_KEY),
    SecureStore.getItemAsync(USER_KEY),
  ]);
  return token && userJson ? { token, user: JSON.parse(userJson) } : null;
}

async function saveSession(result) {
  await SecureStore.setItemAsync(TOKEN_KEY, result.accessToken);
  await SecureStore.setItemAsync(USER_KEY, JSON.stringify(result.user));
}
