import { request } from './client';

export function fetchNotificationPreferences(token) {
  return request('/api/notifications/preferences', { method: 'GET', token });
}

export function saveNotificationPreferences(preferences, token) {
  return request('/api/notifications/preferences', { method: 'PATCH', token, body: preferences });
}
