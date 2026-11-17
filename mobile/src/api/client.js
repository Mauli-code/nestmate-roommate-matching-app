export function resolveApiBaseUrl() {
  // ─── Production backend (Vercel) ──────────────────────────────────────────
  return 'https://nestmate-roommate-matching-app-eight.vercel.app';
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
