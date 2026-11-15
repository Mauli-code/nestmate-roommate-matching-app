import { request } from './client';

export function sendBookingRequest(listingId, booking, token) {
  return request(`/api/booking-requests/${encodeURIComponent(listingId)}`, { method: 'POST', token, body: booking });
}

export function fetchReceivedBookingRequests(token) {
  return request('/api/booking-requests/received', { method: 'GET', token });
}

export function fetchSentBookingRequests(token) {
  return request('/api/booking-requests/sent', { method: 'GET', token });
}

export function acceptBookingRequest(requestId, token) {
  return request(`/api/booking-requests/${encodeURIComponent(requestId)}/accept`, { method: 'PATCH', token });
}

export function rejectBookingRequest(requestId, token) {
  return request(`/api/booking-requests/${encodeURIComponent(requestId)}/reject`, { method: 'PATCH', token });
}

export function cancelBookingRequest(requestId, token) {
  return request(`/api/booking-requests/${encodeURIComponent(requestId)}/cancel`, { method: 'DELETE', token });
}
