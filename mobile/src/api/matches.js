const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_BASE_URL || 'http://10.0.2.2:3001';

export async function fetchMatches(profileId, token, page = 1, limit = 10) {
  if (typeof profileId === 'string' && token === undefined && profileId.split('.').length === 3) {
    token = profileId;
    profileId = undefined;
  }

  if (!token || typeof token !== 'string' || !token.trim()) {
    throw new Error('Authentication is required. Please log in to view recommendations.');
  }

  const cleanToken = token.trim();
  const trimmedProfileId = typeof profileId === 'string' ? profileId.trim() : '';
  const queryParts = [];
  if (trimmedProfileId) {
    queryParts.push(`profileId=${encodeURIComponent(trimmedProfileId)}`);
  }
  queryParts.push(`page=${page}`);
  queryParts.push(`limit=${limit}`);

  let response;
  try {
    response = await fetch(
      `${API_BASE_URL}/api/matches?${queryParts.join('&')}`,
      { headers: { Authorization: `Bearer ${cleanToken}` } },
    );
  } catch {
    throw new Error(
      'The backend could not be reached. Check that it is running and that the API URL is correct.',
    );
  }

  let body;
  try {
    body = await response.json();
  } catch {
    throw new Error('The backend returned an invalid response.');
  }

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error(
        body?.message || 'Your session has expired. Please log in again.',
      );
    }
    if (response.status === 403) {
      throw new Error(
        body?.message || 'You can only view roommate recommendations for your own profile.',
      );
    }
    if (response.status === 404) {
      throw new Error(
        body?.message || 'Roommate preferences were not found. Please save your preferences first.',
      );
    }
    throw new Error(body?.message || `The request failed (${response.status}).`);
  }

  if (
    !body ||
    !Array.isArray(body.matches) ||
    !Number.isInteger(body.page) ||
    !Number.isInteger(body.limit) ||
    !Number.isInteger(body.total) ||
    !Number.isInteger(body.totalPages) ||
    typeof body.hasNextPage !== 'boolean' ||
    typeof body.hasPreviousPage !== 'boolean' ||
    body.matches.some(
      (match) =>
        !match ||
        typeof match.candidateId !== 'string' ||
        typeof match.score !== 'number' ||
        !match.breakdown ||
        typeof match.breakdown !== 'object' ||
        !match.explanations ||
        typeof match.explanations !== 'object' ||
        !match.explanations.overall ||
        typeof match.explanations.overall.text !== 'string',
    )
  ) {
    throw new Error('The backend returned an invalid matches response.');
  }

  return {
    ...body,
    matches: [...body.matches],
  };
}
