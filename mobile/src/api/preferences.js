import { request } from './client';

export async function savePreferences(profileId, preferences, token) {
  if (!token || typeof token !== 'string' || !token.trim()) {
    throw new Error('Authentication is required. Please log in to save preferences.');
  }
  const id = typeof profileId === 'string' ? profileId.trim() : '';
  if (!id) throw new Error('Enter a profile ID before saving preferences.');

  const result = await request(`/api/matches/${encodeURIComponent(id)}/preferences`, {
    method: 'PUT', token: token.trim(), body: preferences,
  });
  if (!result?.profile || result.profile.id !== id) {
    throw new Error('The backend returned an invalid saved profile response.');
  }
  return result;
}
