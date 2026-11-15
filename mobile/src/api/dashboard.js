import { request } from './client';

export function fetchDashboard(token) {
  return request('/api/dashboard', { method: 'GET', token });
}
