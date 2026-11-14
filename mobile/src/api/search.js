const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_BASE_URL || 'http://localhost:3000';

export async function searchRoommates(filters, token) {
  const params = Object.entries(filters)
    .filter(([, value]) => value !== '' && value !== null && value !== undefined)
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
    .join('&');

  let response;
  try {
    response = await fetch(`${API_BASE_URL}/api/search${params ? `?${params}` : ''}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
  } catch {
    throw new Error('The backend could not be reached. Check that it is running.');
  }

  const body = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(body?.message || `The search failed (${response.status}).`);
  }
  if (!body || !Array.isArray(body.results)) {
    throw new Error('The backend returned an invalid search response.');
  }
  return body;
}
