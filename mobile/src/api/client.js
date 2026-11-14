export const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_BASE_URL || 'http://localhost:3000';

export async function request(path, { method = 'GET', body, token, headers = {} } = {}) {
  let response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      method,
      headers: {
        ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...headers,
      },
      ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
    });
  } catch {
    const error = new Error('The backend could not be reached. Check that it is running.');
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
