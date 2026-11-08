const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_BASE_URL || 'http://10.0.2.2:3001';

export async function fetchDashboard(token) {
  let response;
  try {
    response = await fetch(`${API_BASE_URL}/api/dashboard`, {
      headers: { Authorization: `Bearer ${token}` },
    });
  } catch {
    throw new Error('The backend could not be reached. Check that it is running.');
  }
  const result = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(result?.message || `The request failed (${response.status}).`);
  }
  return result;
}
