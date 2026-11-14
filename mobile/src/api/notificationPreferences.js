const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_BASE_URL || 'http://localhost:3000';

async function request(path, method, token, body) {
  let response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      ...(body ? { body: JSON.stringify(body) } : {}),
    });
  } catch {
    throw new Error('The backend could not be reached. Check that it is running.');
  }
  const result = await response.json().catch(() => null);
  if (!response.ok) throw new Error(result?.message || `The request failed (${response.status}).`);
  return result;
}

export function fetchNotificationPreferences(token) {
  return request('/api/notifications/preferences', 'GET', token);
}

export function saveNotificationPreferences(preferences, token) {
  return request('/api/notifications/preferences', 'PATCH', token, preferences);
}
