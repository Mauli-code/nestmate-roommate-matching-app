import { request } from './client';

export function fetchAccommodations(filters, token) {
  const query = Object.entries(filters || {})
    .filter(([, value]) => value !== '' && value !== null && value !== undefined)
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
    .join('&');
  return request(`/api/accommodations${query ? `?${query}` : ''}`, { method: 'GET', token });
}

export function createAccommodation(listing, token) {
  return request('/api/accommodations', { method: 'POST', token, body: listing });
}

export function fetchAccommodation(id, token) {
  return request(`/api/accommodations/${encodeURIComponent(id)}`, { method: 'GET', token });
}

export function fetchAccommodationRecommendations(token) {
  return request('/api/accommodations/recommendations', { method: 'GET', token });
}

export function updateAccommodation(id, listing, token) {
  return request(`/api/accommodations/${encodeURIComponent(id)}`, { method: 'PUT', token, body: listing });
}

export function deleteAccommodation(id, token) {
  return request(`/api/accommodations/${encodeURIComponent(id)}`, { method: 'DELETE', token });
}
