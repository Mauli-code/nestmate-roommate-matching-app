const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_BASE_URL || 'http://10.0.2.2:3001';

async function request(path, method, token) {
  let response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      method,
      headers: { Authorization: `Bearer ${token}` },
    });
  } catch {
    throw new Error('The backend could not be reached. Check that it is running.');
  }

  const body = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(body?.message || `The request failed (${response.status}).`);
  }
  return body;
}

export function fetchFavorites(token) {
  return request('/api/favorites', 'GET', token);
}

export function addFavorite(roommateId, token) {
  return request(`/api/favorites/${encodeURIComponent(roommateId)}`, 'POST', token);
}

export function removeFavorite(roommateId, token) {
  return request(`/api/favorites/${encodeURIComponent(roommateId)}`, 'DELETE', token);
}
