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

export function sendConnectionRequest(receiverId, token) {
  return request(`/api/connection-requests/${encodeURIComponent(receiverId)}`, 'POST', token);
}

export function fetchReceivedRequests(token) {
  return request('/api/connection-requests/received', 'GET', token);
}

export function fetchSentRequests(token) {
  return request('/api/connection-requests/sent', 'GET', token);
}

export function acceptConnectionRequest(requestId, token) {
  return request(`/api/connection-requests/${encodeURIComponent(requestId)}/accept`, 'PATCH', token);
}

export function rejectConnectionRequest(requestId, token) {
  return request(`/api/connection-requests/${encodeURIComponent(requestId)}/reject`, 'PATCH', token);
}

export function cancelConnectionRequest(requestId, token) {
  return request(`/api/connection-requests/${encodeURIComponent(requestId)}/cancel`, 'DELETE', token);
}
