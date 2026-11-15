import { request } from './client';

export function fetchPrivacySettings(token) {
  return request('/api/privacy/preferences', { method: 'GET', token });
}

export function savePrivacySettings(settings, token) {
  return request('/api/privacy/preferences', { method: 'PATCH', token, body: settings });
}
