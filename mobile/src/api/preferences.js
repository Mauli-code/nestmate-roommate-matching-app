export async function savePreferences(profileId, preferences, token) {
  if (!token || typeof token !== 'string' || !token.trim()) {
    throw new Error('Authentication is required. Please log in to save preferences.');
  }

  const trimmedProfileId = typeof profileId === 'string' ? profileId.trim() : '';
  if (!trimmedProfileId) {
    throw new Error('Enter a profile ID before saving preferences.');
  }

  let response;
  try {
    response = await fetch(
      `${process.env.EXPO_PUBLIC_API_BASE_URL || 'http://10.0.2.2:3001'}/api/matches/${encodeURIComponent(trimmedProfileId)}/preferences`,
      {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token.trim()}`,
        },
        body: JSON.stringify(preferences),
      },
    );
  } catch {
    throw new Error('The backend could not be reached. Check that it is running.');
  }

  const body = await response.json().catch(() => null);
  if (!response.ok) {
    if (response.status === 401) {
      throw new Error(body?.message || 'Your session has expired. Please log in again.');
    }
    if (response.status === 403) {
      throw new Error(body?.message || 'You can only update preferences for your own profile.');
    }
    throw new Error(body?.message || `The request failed (${response.status}).`);
  }

  if (!body?.profile || body.profile.id !== trimmedProfileId) {
    throw new Error('The backend returned an invalid saved profile response.');
  }

  return body;
}
