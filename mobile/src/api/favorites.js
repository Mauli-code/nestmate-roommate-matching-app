import { request } from './client';

export function fetchFavorites(token) {
  return request('/api/favorites', { method: 'GET', token });
}

export function addFavorite(roommateId, token) {
  return request(`/api/favorites/${encodeURIComponent(roommateId)}`, { method: 'POST', token });
}

export function removeFavorite(roommateId, token) {
  return request(`/api/favorites/${encodeURIComponent(roommateId)}`, { method: 'DELETE', token });
}
