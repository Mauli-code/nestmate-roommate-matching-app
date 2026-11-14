export function resolveApiBaseUrl() {
  if (process.env.EXPO_PUBLIC_API_BASE_URL) {
    return process.env.EXPO_PUBLIC_API_BASE_URL;
  }
  if (process.env.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL;
  }

  // Detect Metro development server host when running in Expo Go on physical devices
  try {
    if (typeof navigator !== 'undefined' && navigator.product === 'ReactNative') {
      // eslint-disable-next-line global-require
      const Constants = require('expo-constants');
      const constantsObj = Constants?.default || Constants;
      const hostUri =
        constantsObj?.expoConfig?.hostUri ||
        constantsObj?.expoGoConfig?.debuggerHost ||
        constantsObj?.manifest2?.extra?.expoGo?.debuggerHost;

      if (hostUri) {
        const ip = hostUri.split(':')[0];
        if (ip && ip !== 'localhost' && ip !== '127.0.0.1') {
          return `http://${ip}:3000`;
        }
      }
    }
  } catch {
    // Non-Expo or headless environment
  }

  // Detect host in Web browser
  if (typeof window !== 'undefined' && window.location && window.location.hostname) {
    const hostname = window.location.hostname;
    if (hostname && hostname !== 'localhost' && hostname !== '127.0.0.1') {
      return `http://${hostname}:3000`;
    }
  }

  return 'http://localhost:3000';
}

export const API_BASE_URL = resolveApiBaseUrl();

export async function request(path, { method = 'GET', body, token, headers = {} } = {}) {
  let response;
  const baseUrl = resolveApiBaseUrl();
  try {
    response = await fetch(`${baseUrl}${path}`, {
      method,
      headers: {
        ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...headers,
      },
      ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
    });
  } catch {
    const error = new Error(
      `The backend could not be reached at ${baseUrl}. Ensure the backend server is running with \`npm start\` on port 3000.`
    );
    error.status = 0;
    error.errors = {};
    throw error;
  }

  const data = await response.json().catch(() => null);
  if (!response.ok) {
    const error = new Error(data?.message || `The request failed (${response.status}).`);
    error.status = response.status;
    error.errors = data?.errors || {};
    throw error;
  }
  return data;
}
