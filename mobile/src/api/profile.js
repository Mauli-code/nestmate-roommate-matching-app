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

  const responseBody = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(responseBody?.message || `The request failed (${response.status}).`);
  }

  return responseBody;
}

export function fetchProfile(token) {
  return request('/api/auth/profile', 'GET', token);
}

export function updateProfile(token, fullName) {
  return request('/api/auth/profile', 'PUT', token, { fullName });
}
