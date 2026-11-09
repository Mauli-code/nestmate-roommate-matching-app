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

export function fetchBlockedUsers(token) {
  return request('/api/blocks', 'GET', token);
}

export function blockUser(userId, token) {
  return request(`/api/blocks/${encodeURIComponent(userId)}`, 'POST', token);
}

export function unblockUser(userId, token) {
  return request(`/api/blocks/${encodeURIComponent(userId)}`, 'DELETE', token);
}

export function reportUser(userId, report, token) {
  return request(`/api/reports/${encodeURIComponent(userId)}`, 'POST', token, report);
}
