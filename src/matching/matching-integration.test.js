const assert = require('node:assert/strict');
const test = require('node:test');
const jwt = require('jsonwebtoken');
const {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
  UnauthorizedException,
} = require('@nestjs/common');
const { AuthGuard } = require('../auth/auth.guard');
const { AuthService } = require('../auth/auth.service');
const { MatchingController } = require('./matching.controller');
const { MatchingService } = require('./matching.service');
const { getCompatibilityDetails } = require('../../mobile/src/matching-details');

const JWT_SECRET = process.env.JWT_SECRET || 'nestmate-development-secret';

function createFullIntegrationEnvironment() {
  const users = new Map();
  const profiles = new Map();
  const candidates = [];
  const blockedPairs = new Set();
  const privacySettings = new Map();

  const userRepository = {
    findById: async (id) => users.get(id) || null,
    findByEmail: async (email) =>
      [...users.values()].find((user) => user.email === email) || null,
    save: async (user) => {
      users.set(user.id, { ...user });
      return users.get(user.id);
    },
    isActive: (user) => user?.accountStatus === 'active',
  };

  const profileRepository = {
    findProfile: async (id) => profiles.get(id) || null,
    findCandidates: async (id) =>
      candidates.filter((candidate) => candidate.id !== id),
    saveProfile: async (profile) => {
      profiles.set(profile.id, { ...profile });
      return profiles.get(profile.id);
    },
  };

  const privacy = {
    forUser: async (id) => privacySettings.get(id) || { showProfile: true },
  };

  const moderation = {
    isBlockedBetween: async (firstId, secondId) =>
      blockedPairs.has(`${firstId}:${secondId}`) ||
      blockedPairs.has(`${secondId}:${firstId}`),
  };

  const authService = new AuthService(userRepository);
  const guard = new AuthGuard(authService);
  const matchingService = new MatchingService(
    profileRepository,
    privacy,
    moderation,
    userRepository,
  );
  const controller = new MatchingController(matchingService);

  async function registerAndSaveProfile(id, name, email, preferences, overrides = {}) {
    const user = {
      id,
      fullName: name,
      email,
      passwordHash: 'hashed_password',
      accountStatus: overrides.accountStatus || 'active',
      authVersion: 0,
    };
    users.set(id, user);

    if (preferences) {
      const savedProfile = matchingService.validatePreferences(id, preferences);
      profiles.set(id, savedProfile);
      candidates.push(savedProfile);
    }

    if (overrides.showProfile !== undefined) {
      privacySettings.set(id, { showProfile: overrides.showProfile });
    }

    const token = jwt.sign(
      { sub: id, email, authVersion: 0 },
      JWT_SECRET,
      { expiresIn: '1h' },
    );

    return { id, email, token };
  }

  // Create a simulated HTTP dispatcher matching what mobile fetchMatches calls
  async function dispatchMobileApi(url, headers = {}) {
    const parsedUrl = new URL(url, 'http://10.0.2.2:3001');
    const authHeader = headers.Authorization || headers.authorization || '';
    const match = authHeader.match(/^Bearer\s+(.*)$/i);
    const token = match ? match[1].trim() : null;

    const request = {
      headers: { authorization: authHeader },
      query: Object.fromEntries(parsedUrl.searchParams),
    };

    const context = {
      switchToHttp: () => ({ getRequest: () => request }),
    };

    try {
      const canActivate = await guard.canActivate(context);
      if (!canActivate) {
        return {
          ok: false,
          status: 401,
          json: async () => ({ message: 'Authentication required' }),
        };
      }
    } catch (err) {
      const status = err instanceof UnauthorizedException ? 401 : 403;
      return {
        ok: false,
        status,
        json: async () => ({ message: err.message }),
      };
    }

    const queryProfileId = parsedUrl.searchParams.get('profileId') || undefined;
    const queryPage = parsedUrl.searchParams.get('page') || undefined;
    const queryLimit = parsedUrl.searchParams.get('limit') || undefined;

    try {
      const body = await controller.getMatches(
        queryProfileId,
        queryPage,
        queryLimit,
        request,
      );
      return {
        ok: true,
        status: 200,
        json: async () => JSON.parse(JSON.stringify(body)),
      };
    } catch (err) {
      let status = 500;
      if (err instanceof BadRequestException) status = 400;
      if (err instanceof UnauthorizedException) status = 401;
      if (err instanceof ForbiddenException) status = 403;
      if (err instanceof NotFoundException) status = 404;
      return {
        ok: false,
        status,
        json: async () => ({ message: err.message, status }),
      };
    }
  }

  return {
    controller,
    matchingService,
    users,
    profiles,
    candidates,
    blockedPairs,
    privacySettings,
    registerAndSaveProfile,
    dispatchMobileApi,
    blockUsers: (firstId, secondId) => blockedPairs.add(`${firstId}:${secondId}`),
  };
}

const standardPreferences = {
  minBudget: '900',
  maxBudget: '1100',
  preferredArea: 'Central',
  sleepSchedule: 'flexible',
  cleanliness: 'high',
  foodHabits: 'vegetarian',
  smoking: 'no',
  drinking: 'never',
};

// ---------------------------------------------------------------------------
// 1. Complete End-to-End Workflow & Mobile Consumption
// ---------------------------------------------------------------------------
test('complete workflow: registers user, ranks candidates, and feeds mobile client', async () => {
  const env = createFullIntegrationEnvironment();
  const { fetchMatches } = await import('../../mobile/src/api/matches.js');

  const user = await env.registerAndSaveProfile('alice', 'Alice', 'alice@test.com', standardPreferences);
  await env.registerAndSaveProfile('bob', 'Bob', 'bob@test.com', {
    ...standardPreferences,
    preferredArea: 'Central',
  });
  await env.registerAndSaveProfile('charlie', 'Charlie', 'charlie@test.com', {
    ...standardPreferences,
    minBudget: '500',
    maxBudget: '700',
    preferredArea: 'North',
  });

  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (url, options) => env.dispatchMobileApi(url, options.headers);

  try {
    const apiResult = await fetchMatches('alice', user.token, 1, 10);

    assert.equal(apiResult.profileId, 'alice');
    assert.equal(apiResult.total, 2);
    assert.equal(apiResult.matches.length, 2);

    // Highest compatibility ranked first
    assert.equal(apiResult.matches[0].candidateId, 'bob');
    assert.equal(apiResult.matches[0].score, 100);
    assert.equal(apiResult.matches[1].candidateId, 'charlie');
    assert.ok(apiResult.matches[0].score > apiResult.matches[1].score);

    // Mobile presentation details via getCompatibilityDetails
    const bobCard = getCompatibilityDetails(apiResult.matches[0]);
    assert.equal(bobCard.overall.score, 100);
    assert.equal(bobCard.overall.status, 'strong match');
    assert.ok(bobCard.strengths.includes('Similar budget preferences.'));
    assert.ok(bobCard.strengths.includes('Compatible location preferences.'));
    assert.equal(bobCard.insights.hasInsights, true);

    const charlieCard = getCompatibilityDetails(apiResult.matches[1]);
    assert.ok(charlieCard.overall.score < 100);
    assert.ok(charlieCard.differences.includes('Different budget expectations.'));
    assert.ok(charlieCard.differences.includes('Location preference differences.'));
  } finally {
    globalThis.fetch = originalFetch;
  }
});

// ---------------------------------------------------------------------------
// 2. No Compatible Candidates / Empty Candidate List
// ---------------------------------------------------------------------------
test('returns clean empty matches response when no candidates exist', async () => {
  const env = createFullIntegrationEnvironment();
  const { fetchMatches } = await import('../../mobile/src/api/matches.js');

  const user = await env.registerAndSaveProfile('alice', 'Alice', 'alice@test.com', standardPreferences);

  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (url, options) => env.dispatchMobileApi(url, options.headers);

  try {
    const apiResult = await fetchMatches('alice', user.token, 1, 10);
    assert.deepEqual(apiResult.matches, []);
    assert.equal(apiResult.total, 0);
    assert.equal(apiResult.totalPages, 0);
    assert.equal(apiResult.hasNextPage, false);
    assert.equal(apiResult.hasPreviousPage, false);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

// ---------------------------------------------------------------------------
// 3. Missing or Incomplete User Preferences
// ---------------------------------------------------------------------------
test('handles missing preferences with informative 404 message for mobile', async () => {
  const env = createFullIntegrationEnvironment();
  const { fetchMatches } = await import('../../mobile/src/api/matches.js');

  // Alice registered without setting preferences
  const user = await env.registerAndSaveProfile('alice', 'Alice', 'alice@test.com', null);

  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (url, options) => env.dispatchMobileApi(url, options.headers);

  try {
    await assert.rejects(
      () => fetchMatches('alice', user.token, 1, 10),
      (err) => /preferences.*were not found/i.test(err.message),
    );
  } finally {
    globalThis.fetch = originalFetch;
  }
});

// ---------------------------------------------------------------------------
// 4. Invalid Request Data (400 Bad Request)
// ---------------------------------------------------------------------------
test('rejects invalid pagination parameters with 400 status', async () => {
  const env = createFullIntegrationEnvironment();
  const { fetchMatches } = await import('../../mobile/src/api/matches.js');

  const user = await env.registerAndSaveProfile('alice', 'Alice', 'alice@test.com', standardPreferences);

  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (url, options) => env.dispatchMobileApi(url, options.headers);

  try {
    await assert.rejects(
      () => fetchMatches('alice', user.token, 0, 10),
      (err) => /page must be a positive whole number/i.test(err.message),
    );
    await assert.rejects(
      () => fetchMatches('alice', user.token, -1, 10),
      (err) => /page must be a positive whole number/i.test(err.message),
    );
    await assert.rejects(
      () => fetchMatches('alice', user.token, 1, 0),
      (err) => /limit must be a positive whole number/i.test(err.message),
    );
  } finally {
    globalThis.fetch = originalFetch;
  }
});

// ---------------------------------------------------------------------------
// 5. Equal Compatibility Scores (Stable Ordering)
// ---------------------------------------------------------------------------
test('preserves deterministic ranking order for candidates with identical scores', async () => {
  const env = createFullIntegrationEnvironment();
  const { fetchMatches } = await import('../../mobile/src/api/matches.js');

  const user = await env.registerAndSaveProfile('alice', 'Alice', 'alice@test.com', standardPreferences);
  await env.registerAndSaveProfile('cand-1', 'Cand 1', 'c1@test.com', standardPreferences);
  await env.registerAndSaveProfile('cand-2', 'Cand 2', 'c2@test.com', standardPreferences);
  await env.registerAndSaveProfile('cand-3', 'Cand 3', 'c3@test.com', standardPreferences);

  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (url, options) => env.dispatchMobileApi(url, options.headers);

  try {
    const result = await fetchMatches('alice', user.token, 1, 10);
    assert.equal(result.total, 3);
    assert.deepEqual(
      result.matches.map((m) => m.candidateId),
      ['cand-1', 'cand-2', 'cand-3'],
    );
    assert.equal(result.matches[0].score, result.matches[1].score);
    assert.equal(result.matches[1].score, result.matches[2].score);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

// ---------------------------------------------------------------------------
// 6. Blocked and Deactivated Users Filtering
// ---------------------------------------------------------------------------
test('filters out blocked users in either direction and deactivated accounts', async () => {
  const env = createFullIntegrationEnvironment();
  const { fetchMatches } = await import('../../mobile/src/api/matches.js');

  const user = await env.registerAndSaveProfile('alice', 'Alice', 'alice@test.com', standardPreferences);
  await env.registerAndSaveProfile('active-cand', 'Active', 'active@test.com', standardPreferences);
  await env.registerAndSaveProfile('deactivated-cand', 'Deactivated', 'deact@test.com', standardPreferences, {
    accountStatus: 'deactivated',
  });
  await env.registerAndSaveProfile('blocked-cand', 'Blocked', 'blocked@test.com', standardPreferences);
  env.blockUsers('alice', 'blocked-cand');

  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (url, options) => env.dispatchMobileApi(url, options.headers);

  try {
    const result = await fetchMatches('alice', user.token, 1, 10);
    assert.equal(result.total, 1);
    assert.deepEqual(
      result.matches.map((m) => m.candidateId),
      ['active-cand'],
    );
  } finally {
    globalThis.fetch = originalFetch;
  }
});

// ---------------------------------------------------------------------------
// 7. Private Profiles Filtering
// ---------------------------------------------------------------------------
test('excludes candidate profiles marked as private', async () => {
  const env = createFullIntegrationEnvironment();
  const { fetchMatches } = await import('../../mobile/src/api/matches.js');

  const user = await env.registerAndSaveProfile('alice', 'Alice', 'alice@test.com', standardPreferences);
  await env.registerAndSaveProfile('public-cand', 'Public', 'public@test.com', standardPreferences);
  await env.registerAndSaveProfile('private-cand', 'Private', 'private@test.com', standardPreferences, {
    showProfile: false,
  });

  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (url, options) => env.dispatchMobileApi(url, options.headers);

  try {
    const result = await fetchMatches('alice', user.token, 1, 10);
    assert.equal(result.total, 1);
    assert.equal(result.matches[0].candidateId, 'public-cand');
  } finally {
    globalThis.fetch = originalFetch;
  }
});

// ---------------------------------------------------------------------------
// 8. Pagination Across Multiple Pages
// ---------------------------------------------------------------------------
test('correctly paginates across multiple pages with consistent metadata', async () => {
  const env = createFullIntegrationEnvironment();
  const { fetchMatches } = await import('../../mobile/src/api/matches.js');

  const user = await env.registerAndSaveProfile('alice', 'Alice', 'alice@test.com', standardPreferences);
  for (let i = 1; i <= 5; i++) {
    await env.registerAndSaveProfile(`cand-${i}`, `Cand ${i}`, `c${i}@test.com`, {
      ...standardPreferences,
      minBudget: String(900 - i * 50),
      maxBudget: String(1100 - i * 50),
    });
  }

  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (url, options) => env.dispatchMobileApi(url, options.headers);

  try {
    const p1 = await fetchMatches('alice', user.token, 1, 2);
    assert.equal(p1.page, 1);
    assert.equal(p1.limit, 2);
    assert.equal(p1.total, 5);
    assert.equal(p1.totalPages, 3);
    assert.equal(p1.hasNextPage, true);
    assert.equal(p1.hasPreviousPage, false);
    assert.equal(p1.matches.length, 2);
    assert.equal(p1.matches[0].candidateId, 'cand-1');

    const p2 = await fetchMatches('alice', user.token, 2, 2);
    assert.equal(p2.page, 2);
    assert.equal(p2.hasNextPage, true);
    assert.equal(p2.hasPreviousPage, true);
    assert.equal(p2.matches.length, 2);
    assert.equal(p2.matches[0].candidateId, 'cand-3');

    const p3 = await fetchMatches('alice', user.token, 3, 2);
    assert.equal(p3.page, 3);
    assert.equal(p3.hasNextPage, false);
    assert.equal(p3.hasPreviousPage, true);
    assert.equal(p3.matches.length, 1);
    assert.equal(p3.matches[0].candidateId, 'cand-5');

    const p4 = await fetchMatches('alice', user.token, 4, 2);
    assert.equal(p4.matches.length, 0);
    assert.equal(p4.hasNextPage, false);
    assert.equal(p4.hasPreviousPage, true);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

// ---------------------------------------------------------------------------
// 9. API Security & Error Handling (401, 403, 500, network error)
// ---------------------------------------------------------------------------
test('mobile API gracefully handles expired tokens (401) and forbidden access (403)', async () => {
  const env = createFullIntegrationEnvironment();
  const { fetchMatches } = await import('../../mobile/src/api/matches.js');

  const alice = await env.registerAndSaveProfile('alice', 'Alice', 'alice@test.com', standardPreferences);
  const bob = await env.registerAndSaveProfile('bob', 'Bob', 'bob@test.com', standardPreferences);

  const expiredToken = jwt.sign(
    { sub: 'alice', email: 'alice@test.com', authVersion: 0 },
    JWT_SECRET,
    { expiresIn: -10 },
  );

  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (url, options) => env.dispatchMobileApi(url, options.headers);

  try {
    // Expired token -> 401
    await assert.rejects(
      () => fetchMatches('alice', expiredToken, 1, 10),
      (err) => /expired|invalid/i.test(err.message),
    );

    // Cross-account access -> 403
    await assert.rejects(
      () => fetchMatches('bob', alice.token, 1, 10),
      (err) => /own profile|authorized/i.test(err.message),
    );
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('mobile API gracefully handles network failure and 500 server error', async () => {
  const { fetchMatches } = await import('../../mobile/src/api/matches.js');
  const originalFetch = globalThis.fetch;

  try {
    // Simulated network outage
    globalThis.fetch = async () => {
      throw new TypeError('Network request failed');
    };
    await assert.rejects(
      () => fetchMatches('alice', 'valid-token', 1, 10),
      (err) => /backend could not be reached/i.test(err.message),
    );

    // Simulated 500 internal server error
    globalThis.fetch = async () => ({
      ok: false,
      status: 500,
      json: async () => ({ message: 'Internal server error' }),
    });
    await assert.rejects(
      () => fetchMatches('alice', 'valid-token', 1, 10),
      (err) => /Internal server error|request failed \(500\)/i.test(err.message),
    );
  } finally {
    globalThis.fetch = originalFetch;
  }
});
