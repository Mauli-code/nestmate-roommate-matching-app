const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_BASE_URL || 'http://10.0.2.2:3001';

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

export function fetchAccommodations(filters, token) {
  const query = Object.entries(filters || {})
    .filter(([, value]) => value !== '' && value !== null && value !== undefined)
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
    .join('&');
  return request(`/api/accommodations${query ? `?${query}` : ''}`, 'GET', token);
}

export function createAccommodation(listing, token) {
  return request('/api/accommodations', 'POST', token, listing);
}

export function fetchAccommodation(id, token) {
  return request(`/api/accommodations/${encodeURIComponent(id)}`, 'GET', token);
}

export function updateAccommodation(id, listing, token) {
  return request(`/api/accommodations/${encodeURIComponent(id)}`, 'PUT', token, listing);
}

export function deleteAccommodation(id, token) {
  return request(`/api/accommodations/${encodeURIComponent(id)}`, 'DELETE', token);
}
