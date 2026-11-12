const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_BASE_URL || 'http://10.0.2.2:3001';

export async function uploadProfilePhoto(token, image) {
  const formData = new FormData();
  formData.append('photo', {
    uri: image.uri,
    name: image.fileName || 'profile-photo.jpg',
    type: image.mimeType || 'image/jpeg',
  });

  let response;
  try {
    response = await fetch(`${API_BASE_URL}/api/auth/profile/photo`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    });
  } catch {
    throw new Error('The backend could not be reached. Check that it is running.');
  }

  const body = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(body?.message || `The upload failed (${response.status}).`);
  }

  return body;
}

export function resolvePhotoUrl(photoUrl) {
  return photoUrl ? `${API_BASE_URL}${photoUrl}` : null;
}
