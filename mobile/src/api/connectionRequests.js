import { request } from './client';

export function sendConnectionRequest(receiverId, token) {
  return request(`/api/connection-requests/${encodeURIComponent(receiverId)}`, { method: 'POST', token });
}

export function fetchReceivedRequests(token) {
  return request('/api/connection-requests/received', { method: 'GET', token });
}

export function fetchSentRequests(token) {
  return request('/api/connection-requests/sent', { method: 'GET', token });
}

export function acceptConnectionRequest(requestId, token) {
  return request(`/api/connection-requests/${encodeURIComponent(requestId)}/accept`, { method: 'PATCH', token });
}

export function rejectConnectionRequest(requestId, token) {
  return request(`/api/connection-requests/${encodeURIComponent(requestId)}/reject`, { method: 'PATCH', token });
}

export function cancelConnectionRequest(requestId, token) {
  return request(`/api/connection-requests/${encodeURIComponent(requestId)}/cancel`, { method: 'DELETE', token });
}
