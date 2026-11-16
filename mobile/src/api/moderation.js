import { request } from './client';

export function fetchBlockedUsers(token) {
  return request('/api/moderation/blocks', { method: 'GET', token });
}

export function blockUser(userId, token) {
  return request(`/api/moderation/blocks/${encodeURIComponent(userId)}`, { method: 'POST', token });
}

export function unblockUser(userId, token) {
  return request(`/api/moderation/blocks/${encodeURIComponent(userId)}`, { method: 'DELETE', token });
}

export function reportUser(userId, report, token) {
  return request(`/api/moderation/reports/${encodeURIComponent(userId)}`, { method: 'POST', token, body: report });
}
