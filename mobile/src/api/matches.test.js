const assert = require('node:assert/strict');
const test = require('node:test');

test('builds the matching API response contract', () => {
  const response = {
    profileId: 'user-1',
    page: 1,
    limit: 10,
    total: 1,
    totalPages: 1,
    hasNextPage: false,
    hasPreviousPage: false,
    matches: [
      {
        candidateId: 'candidate-1',
        score: 100,
        breakdown: { budget: 1, location: 1 },
        explanations: {
          overall: { status: 'strong match', text: '100% overall compatibility.' },
        },
      },
    ],
  };

  assert.equal(response.matches[0].candidateId, 'candidate-1');
  assert.equal(response.matches[0].score, 100);
  assert.equal(response.matches[0].breakdown.location, 1);
});

test('rejects matching requests without an authentication token', async () => {
  const { fetchMatches } = await import('./matches.js');

  await assert.rejects(
    () => fetchMatches('user-1', ''),
    (error) => error.message === 'Authentication is required. Please log in to view recommendations.',
  );
  await assert.rejects(
    () => fetchMatches('user-1', null),
    (error) => error.message === 'Authentication is required. Please log in to view recommendations.',
  );
});

test('attaches authentication token to matching API request', async () => {
  const { fetchMatches } = await import('./matches.js');
  const originalFetch = globalThis.fetch;
  let capturedHeaders = null;
  let capturedUrl = null;

  globalThis.fetch = async (url, options) => {
    capturedUrl = url;
    capturedHeaders = options.headers;
    return {
      ok: true,
      status: 200,
      json: async () => ({
        profileId: 'user-1',
        page: 1,
        limit: 10,
        total: 1,
        totalPages: 1,
        hasNextPage: false,
        hasPreviousPage: false,
        matches: [{
          candidateId: 'candidate-1',
          score: 95,
          breakdown: { budget: 1, location: 1 },
          explanations: {
            overall: { status: 'strong match', text: 'Strong match' },
          },
        }],
      }),
    };
  };

  try {
    const result = await fetchMatches('user-1', 'valid-test-token', 1, 10);
    assert.equal(capturedHeaders.Authorization, 'Bearer valid-test-token');
    assert.match(capturedUrl, /\/api\/matches\?/);
    assert.equal(result.matches[0].candidateId, 'candidate-1');
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('handles expired or invalid session (401) without crashing', async () => {
  const { fetchMatches } = await import('./matches.js');
  const originalFetch = globalThis.fetch;

  globalThis.fetch = async () => ({
    ok: false,
    status: 401,
    json: async () => ({ message: 'Authentication token is expired or invalid' }),
  });

  try {
    await assert.rejects(
      () => fetchMatches('user-1', 'expired-token'),
      (error) => /expired|invalid/i.test(error.message),
    );
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('handles forbidden access (403) for another users recommendations', async () => {
  const { fetchMatches } = await import('./matches.js');
  const originalFetch = globalThis.fetch;

  globalThis.fetch = async () => ({
    ok: false,
    status: 403,
    json: async () => ({ message: 'You can only access your own profile' }),
  });

  try {
    await assert.rejects(
      () => fetchMatches('other-user', 'valid-token'),
      (error) => /own profile|authorized/i.test(error.message),
    );
  } finally {
    globalThis.fetch = originalFetch;
  }
});
