export function resolveApiBaseUrl() {
  // ─── 1. Explicit .env override (optional, for production or staging) ───────
  if (process.env.EXPO_PUBLIC_API_BASE_URL) {
    return process.env.EXPO_PUBLIC_API_BASE_URL;
  }
  if (process.env.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL;
  }

  // ─── 2. Auto-detect from Expo Metro host (Expo Go on physical devices) ─────
  //
  // When a teammate scans the QR code, Expo Go knows the IP of the machine
  // running Metro (the laptop that ran `npx expo start`). We reuse that same
  // IP to reach the NestJS backend, which is assumed to also run on that
  // laptop on port 3000. This requires ZERO manual configuration — every
  // teammate just runs `npm start` (backend) + `npx expo start` (mobile) on
  // their own machine and it works automatically.
  try {
    if (typeof navigator !== 'undefined' && navigator.product === 'ReactNative') {
      // eslint-disable-next-line global-require
      const Constants = require('expo-constants');
      const c = Constants?.default || Constants;

      const hostUri =
        c?.expoConfig?.hostUri ||            // Expo SDK 49+
        c?.expoGoConfig?.debuggerHost ||     // Expo Go legacy manifest
        c?.manifest2?.extra?.expoGo?.debuggerHost || // new manifest v2
        c?.manifest?.debuggerHost;           // old manifest v1

      if (hostUri) {
        const ip = hostUri.split(':')[0];
        // hostUri looks like "10.254.204.14:8081"
        if (ip && ip !== 'localhost' && ip !== '127.0.0.1') {
          return `http://${ip}:3000`;
        }
      }
    }
  } catch {
    // Running outside Expo (e.g. Node.js test runner) — safe to ignore
  }

  // ─── 3. Web browser — use the same host that served the page ──────────────
  if (typeof window !== 'undefined' && window.location?.hostname) {
    const hostname = window.location.hostname;
    if (hostname && hostname !== 'localhost' && hostname !== '127.0.0.1') {
      return `http://${hostname}:3000`;
    }
  }

  // ─── 4. Fallback: localhost (Expo web / iOS Simulator / Jest) ─────────────
  return 'http://localhost:3000';
}

// Pre-resolved at module load time (re-resolves dynamically in request() too)
export const API_BASE_URL = resolveApiBaseUrl();

export async function request(path, { method = 'GET', body, token, headers = {} } = {}) {
  // Always re-resolve so the URL reflects the current Expo session
  const baseUrl = resolveApiBaseUrl();
  let response;
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
    const msg = baseUrl.includes('localhost')
      ? 'The backend could not be reached. Run `npm start` in the project root on port 3000.'
      : `The backend could not be reached at ${baseUrl}. Make sure the backend server is running on port 3000 on the same machine as Expo.`;
    const error = new Error(msg);
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
