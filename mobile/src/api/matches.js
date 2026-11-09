const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_BASE_URL || 'http://10.0.2.2:3001';

export async function fetchMatches(profileId, token) {
  const trimmedProfileId = profileId.trim();
  if (!trimmedProfileId) {
    throw new Error('Enter a profile ID before searching.');
  }

  let response;
  try {
    response = await fetch(
      `${API_BASE_URL}/api/matches?profileId=${encodeURIComponent(trimmedProfileId)}`,
      { headers: { Authorization: `Bearer ${token}` } },
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
    throw new Error(body.message || `The request failed (${response.status}).`);
  }

  if (
    !body ||
    !Array.isArray(body.matches) ||
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
    matches: [...body.matches].sort((first, second) => second.score - first.score),
  };
}
