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

export function sendBookingRequest(listingId, booking, token) {
  return request(`/api/booking-requests/${encodeURIComponent(listingId)}`, 'POST', token, booking);
}

export function fetchReceivedBookingRequests(token) {
  return request('/api/booking-requests/received', 'GET', token);
}

export function fetchSentBookingRequests(token) {
  return request('/api/booking-requests/sent', 'GET', token);
}

export function acceptBookingRequest(requestId, token) {
  return request(`/api/booking-requests/${encodeURIComponent(requestId)}/accept`, 'PATCH', token);
}

export function rejectBookingRequest(requestId, token) {
  return request(`/api/booking-requests/${encodeURIComponent(requestId)}/reject`, 'PATCH', token);
}

export function cancelBookingRequest(requestId, token) {
  return request(`/api/booking-requests/${encodeURIComponent(requestId)}/cancel`, 'DELETE', token);
}
