export async function savePreferences(profileId, preferences) {
  const trimmedProfileId = profileId.trim();
  if (!trimmedProfileId) {
    throw new Error('Enter a profile ID before saving preferences.');
  }

  let response;
  try {
    response = await fetch(
      `${process.env.EXPO_PUBLIC_API_BASE_URL || 'http://10.0.2.2:3001'}/api/profiles/${encodeURIComponent(trimmedProfileId)}/preferences`,
      {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(preferences),
      },
    );
  } catch {
    throw new Error('The backend could not be reached. Check that it is running.');
  }

  const body = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(body?.message || `The request failed (${response.status}).`);
  }

  if (!body?.profile || body.profile.id !== trimmedProfileId) {
    throw new Error('The backend returned an invalid saved profile response.');
  }

  return body;
}
