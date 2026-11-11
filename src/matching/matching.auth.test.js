const assert = require('node:assert/strict');
const test = require('node:test');
const jwt = require('jsonwebtoken');
const {
  ForbiddenException,
  NotFoundException,
  UnauthorizedException,
} = require('@nestjs/common');
const { AuthGuard } = require('../auth/auth.guard');
const { AuthService } = require('../auth/auth.service');
const { MatchingController } = require('./matching.controller');
const { MatchingService } = require('./matching.service');

const validPreferences = {
  minBudget: '900',
  maxBudget: '1100',
  preferredArea: 'Central',
  sleepSchedule: 'flexible',
  cleanliness: 'high',
  smoking: 'no',
  foodHabits: 'vegetarian',
  drinking: 'occasionally',
};

function createTestEnvironment() {
  const users = new Map();
  const profiles = new Map();
  const candidates = [];

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

  const authService = new AuthService(userRepository);
  const guard = new AuthGuard(authService);
  const matchingService = new MatchingService(
    profileRepository,
    { forUser: async () => ({ showProfile: true }) },
    { isBlockedBetween: async () => false },
    userRepository,
  );
  const controller = new MatchingController(matchingService);

  return {
    authService,
    guard,
    matchingService,
    controller,
    userRepository,
    profileRepository,
    registerUser: async (fullName, email, password) => {
      const reg = await authService.register(fullName, email, password);
      return { id: reg.user.id, email: reg.user.email, accessToken: reg.accessToken };
    },
    savePreferences: async (userId, prefs) => {
      return matchingService.savePreferences(userId, prefs);
    },
    saveCandidate: async (candidateId, profileData) => {
      const candidateUser = {
        id: candidateId,
        fullName: `Candidate ${candidateId}`,
        email: `${candidateId}@example.com`,
        accountStatus: 'active',
        authVersion: 0,
      };
      users.set(candidateId, candidateUser);
      const profile = {
        id: candidateId,
        budget: profileData.budget || 1000,
        preferredArea: profileData.preferredArea || 'Central',
        lifestyle: profileData.lifestyle || {
          sleepSchedule: 'flexible',
          cleanliness: 'high',
          smoking: false,
          pets: false,
        },
        foodHabits: profileData.foodHabits || 'vegetarian',
        drinking: profileData.drinking || 'occasionally',
      };
      candidates.push(profile);
      profiles.set(candidateId, profile);
      return profile;
    },
    authenticate: async (token) => {
      const request = {
        headers: { authorization: `Bearer ${token}` },
      };
      const context = {
        switchToHttp: () => ({
          getRequest: () => request,
        }),
      };
      const activated = await guard.canActivate(context);
      return { request, activated };
    },
  };
}

test('1. successful authenticated matching request', async () => {
  const env = createTestEnvironment();
  const user = await env.registerUser('Alice User', 'alice@example.com', 'password123');
  await env.savePreferences(user.id, validPreferences);
  await env.saveCandidate('bob', {
    budget: 1000,
    preferredArea: 'Central',
    lifestyle: { sleepSchedule: 'flexible', cleanliness: 'high', smoking: false, pets: false },
  });

  const { request, activated } = await env.authenticate(user.accessToken);
  assert.equal(activated, true);
  assert.equal(request.user.sub, user.id);

  const result = await env.controller.getMatches(undefined, 1, 10, request);
  assert.equal(result.profileId, user.id);
  assert.equal(result.matches.length, 1);
  assert.equal(result.matches[0].candidateId, 'bob');
  assert.equal(typeof result.matches[0].score, 'number');
});

test('2. request without an authentication token', async () => {
  const env = createTestEnvironment();
  const context = {
    switchToHttp: () => ({
      getRequest: () => ({ headers: {} }),
    }),
  };

  const activated = await env.guard.canActivate(context);
  assert.equal(activated, false);

  // Directly invoking controller without authenticated request context is also rejected
  await assert.rejects(
    () => env.controller.getMatches('user-1', 1, 10, {}),
    (error) => error instanceof ForbiddenException,
  );
});

test('3. invalid authentication token', async () => {
  const env = createTestEnvironment();
  const context = {
    switchToHttp: () => ({
      getRequest: () => ({ headers: { authorization: 'Bearer invalid.token.payload' } }),
    }),
  };

  await assert.rejects(
    async () => env.guard.canActivate(context),
    (error) => error instanceof UnauthorizedException,
  );
});

test('4. expired authentication token', async () => {
  const env = createTestEnvironment();
  const user = await env.registerUser('Expired User', 'expired@example.com', 'password123');
  const expiredToken = jwt.sign(
    { sub: user.id, email: user.email, authVersion: 0 },
    process.env.JWT_SECRET || 'nestmate-development-secret',
    { expiresIn: -10 },
  );

  const context = {
    switchToHttp: () => ({
      getRequest: () => ({ headers: { authorization: `Bearer ${expiredToken}` } }),
    }),
  };

  await assert.rejects(
    async () => env.guard.canActivate(context),
    (error) => error instanceof UnauthorizedException,
  );
});

test("5. attempt to request another user's recommendations", async () => {
  const env = createTestEnvironment();
  const alice = await env.registerUser('Alice User', 'alice@example.com', 'password123');
  const bob = await env.registerUser('Bob User', 'bob@example.com', 'password123');
  await env.savePreferences(alice.id, validPreferences);
  await env.savePreferences(bob.id, validPreferences);

  const { request } = await env.authenticate(alice.accessToken);

  // Alice tries to request recommendations using Bob's profileId parameter
  await assert.rejects(
    () => env.controller.getMatches(bob.id, 1, 10, request),
    (error) =>
      error instanceof ForbiddenException &&
      error.message === 'You can only access your own profile',
  );
});

test('6. missing user profile', async () => {
  const env = createTestEnvironment();
  const missingUserId = 'non-existent-user-id';
  const request = { user: { sub: missingUserId } };

  await assert.rejects(
    () => env.controller.getMatches(undefined, 1, 10, request),
    (error) =>
      error instanceof NotFoundException &&
      /User profile .* was not found/.test(error.message),
  );
});

test('7. missing preferences', async () => {
  const env = createTestEnvironment();
  const user = await env.registerUser('No Preferences User', 'noprefs@example.com', 'password123');
  const { request } = await env.authenticate(user.accessToken);

  await assert.rejects(
    () => env.controller.getMatches(undefined, 1, 10, request),
    (error) =>
      error instanceof NotFoundException &&
      /Roommate preferences for .* were not found/.test(error.message),
  );
});

test('8. correct authenticated user identification', async () => {
  const env = createTestEnvironment();
  const user = await env.registerUser('Charlie User', 'charlie@example.com', 'password123');
  await env.savePreferences(user.id, validPreferences);
  await env.saveCandidate('candidate-1', {
    budget: 1000,
    preferredArea: 'Central',
    lifestyle: { sleepSchedule: 'flexible', cleanliness: 'high', smoking: false, pets: false },
  });

  const { request } = await env.authenticate(user.accessToken);

  // When profileId is omitted or undefined in query params, identity is derived from verified token
  const result = await env.controller.getMatches(undefined, 1, 10, request);
  assert.equal(result.profileId, user.id);
  assert.equal(result.matches.length, 1);
});

test('9. existing matching functionality after authentication checks', async () => {
  const env = createTestEnvironment();
  const user = await env.registerUser('Test User', 'testuser@example.com', 'password123');
  await env.savePreferences(user.id, {
    minBudget: '900',
    maxBudget: '1100',
    preferredArea: 'Central',
    sleepSchedule: 'flexible',
    cleanliness: 'high',
    smoking: 'no',
    foodHabits: 'vegetarian',
    drinking: 'never',
  });

  await env.saveCandidate('high-match', {
    budget: 1000,
    preferredArea: 'Central',
    lifestyle: { sleepSchedule: 'flexible', cleanliness: 'high', smoking: false, pets: 'not-specified' },
    foodHabits: 'vegetarian',
    drinking: 'never',
  });
  await env.saveCandidate('partial-match', {
    budget: 1000,
    preferredArea: 'North',
    lifestyle: { sleepSchedule: 'flexible', cleanliness: 'medium', smoking: false, pets: 'not-specified' },
    foodHabits: 'vegetarian',
    drinking: 'occasionally',
  });
  await env.saveCandidate('low-match', {
    budget: 200,
    preferredArea: 'South',
    lifestyle: { sleepSchedule: 'early', cleanliness: 'low', smoking: true, pets: true },
    foodHabits: 'non-vegetarian',
    drinking: 'regularly',
  });

  const { request } = await env.authenticate(user.accessToken);
  const result = await env.controller.getMatches(undefined, 1, 10, request);

  assert.equal(result.profileId, user.id);
  assert.equal(result.total, 3);
  assert.equal(result.matches.length, 3);

  // Verifies rankings from highest to lowest score
  assert.equal(result.matches[0].candidateId, 'high-match');
  assert.equal(result.matches[1].candidateId, 'partial-match');
  assert.equal(result.matches[2].candidateId, 'low-match');
  assert.ok(result.matches[0].score > result.matches[1].score);
  assert.ok(result.matches[1].score > result.matches[2].score);

  // Verifies explanations and breakdown are preserved
  assert.equal(typeof result.matches[0].explanations.overall.text, 'string');
  assert.ok(result.matches[0].breakdown.budget > 0);
  assert.ok(result.matches[0].breakdown.location > 0);

  // Verifies pagination works with authentication context
  const page1 = await env.controller.getMatches(undefined, 1, 2, request);
  assert.equal(page1.matches.length, 2);
  assert.equal(page1.hasNextPage, true);

  const page2 = await env.controller.getMatches(undefined, 2, 2, request);
  assert.equal(page2.matches.length, 1);
  assert.equal(page2.matches[0].candidateId, 'low-match');
  assert.equal(page2.hasNextPage, false);
});

