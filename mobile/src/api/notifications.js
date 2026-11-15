import { request } from './client';

export function fetchNotifications(token) {
  return request('/api/notifications', { method: 'GET', token });
}

export function markNotificationRead(notificationId, token) {
  return request(`/api/notifications/${encodeURIComponent(notificationId)}/read`, { method: 'PATCH', token });
}

export function markAllNotificationsRead(token) {
  return request('/api/notifications/read-all', { method: 'PATCH', token });
}
