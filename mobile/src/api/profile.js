import { request } from './client';

export function fetchProfile(token) {
  return request('/api/auth/profile', { token });
}

export function updateProfile(token, profile) {
  return request('/api/auth/profile', { method: 'PATCH', token, body: profile });
}

export function changePassword(token, oldPassword, newPassword) {
  return request('/api/auth/change-password', {
    method: 'POST', token, body: { oldPassword, newPassword },
  });
}
