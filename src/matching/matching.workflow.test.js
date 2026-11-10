const assert = require('node:assert/strict');
const test = require('node:test');
const { MatchingService } = require('./matching.service');

function createProfile(id, overrides = {}) {
  return {
    id,
    budget: 1000,
    preferredArea: 'Central',
    lifestyle: {
      sleepSchedule: 'flexible',
      cleanliness: 'medium',
      smoking: false,
      pets: false,
    },
    ...overrides,
  };
}

function createMatchingWorkflow(candidateProfiles = []) {
  const profiles = new Map();
  const users = new Map();

  const repository = {
    findProfile: async (id) => profiles.get(id) || null,
    findCandidates: async () => candidateProfiles,
    saveProfile: async (profile) => {
      profiles.set(profile.id, { ...profile });
      users.set(profile.id, { id: profile.id, accountStatus: 'active' });
      return profile;
    },
  };
  const userRepository = {
    findById: async (id) => users.get(id) || null,
    isActive: (user) => user?.accountStatus === 'active',
  };
  const privacy = {
    forUser: async () => ({ showProfile: true }),
  };
  const moderation = {
    isBlockedBetween: async () => false,
  };
  candidateProfiles.forEach((profile) => {
    if (profile?.id) {
      users.set(profile.id, { id: profile.id, accountStatus: 'active' });
    }
  });

  return {
    service: new MatchingService(repository, privacy, moderation, userRepository),
    repository,
    users,
  };
}

const completePreferences = {
  minBudget: '900',
  maxBudget: '1100',
  preferredArea: 'Central',
  sleepSchedule: 'flexible',
  foodHabits: 'vegetarian',
  cleanliness: 'medium',
  smoking: 'no',
  drinking: 'occasionally',
};

test('completes the preference-to-ranked-recommendation workflow', async () => {
  const workflow = createMatchingWorkflow([
    createProfile('high-match', {
      lifestyle: {
        sleepSchedule: 'flexible',
        cleanliness: 'medium',
        smoking: false,
        pets: 'not-specified',
      },
    }),
    createProfile('medium-match', {
      budget: 700,
      preferredArea: 'North',
    }),
    createProfile('low-match', {
      budget: 100,
      preferredArea: 'South',
      lifestyle: {
        sleepSchedule: 'early',
        cleanliness: 'low',
        smoking: true,
        pets: true,
      },
    }),
  ]);

  await workflow.service.savePreferences('user', completePreferences);
  const response = await workflow.service.getMatches('user', 1, 10);

  assert.equal(response.profileId, 'user');
  assert.deepEqual(
    response.matches.map(({ candidateId }) => candidateId),
    ['high-match', 'medium-match', 'low-match'],
  );
  assert.equal(response.matches[0].score, 100);
  assert.deepEqual(Object.keys(response.matches[0].breakdown), [
    'budget',
    'location',
    'lifestyle',
    'habitsAndPreferences',
  ]);
  assert.equal(typeof response.matches[0].explanations.overall.text, 'string');
});

test('keeps incomplete user preferences safe without claiming a match', async () => {
  const workflow = createMatchingWorkflow([createProfile('candidate')]);
  await workflow.repository.saveProfile({
    id: 'user',
    budget: undefined,
    preferredArea: '',
    lifestyle: undefined,
  });

  const response = await workflow.service.getMatches('user');

  assert.equal(response.matches[0].score, 0);
  assert.equal(response.matches[0].explanations.overall.status, 'unavailable');
});

test('handles invalid candidate data without breaking the workflow', async () => {
  const workflow = createMatchingWorkflow([
    null,
    createProfile('invalid-budget', { budget: -1 }),
    createProfile('valid'),
  ]);
  await workflow.service.savePreferences('user', completePreferences);

  const response = await workflow.service.getMatches('user');

  assert.deepEqual(
    response.matches.map(({ candidateId }) => candidateId),
    ['valid', 'invalid-budget'],
  );
  assert.ok(response.matches[1].score < response.matches[0].score);
  assert.equal(response.matches[1].breakdown.budget, 0);
});

test('removes duplicate and self profiles before returning recommendations', async () => {
  const workflow = createMatchingWorkflow([
    createProfile('user'),
    createProfile('candidate'),
    createProfile('candidate', { preferredArea: 'North' }),
  ]);
  await workflow.service.savePreferences('user', completePreferences);

  const response = await workflow.service.getMatches('user');

  assert.deepEqual(response.matches.map(({ candidateId }) => candidateId), ['candidate']);
  assert.equal(response.total, 1);
});

test('returns an empty API result when no eligible candidates remain', async () => {
  const workflow = createMatchingWorkflow([]);
  await workflow.service.savePreferences('user', completePreferences);

  const response = await workflow.service.getMatches('user');

  assert.deepEqual(response.matches, []);
  assert.equal(response.total, 0);
  assert.equal(response.totalPages, 0);
  assert.equal(response.hasNextPage, false);
});

test('preserves ranking and pagination after privacy filtering', async () => {
  const workflow = createMatchingWorkflow([
    createProfile('best'),
    createProfile('blocked', { budget: 1000 }),
    createProfile('next-best', { budget: 700 }),
  ]);
  workflow.users.set('blocked', { id: 'blocked', accountStatus: 'deactivated' });
  await workflow.service.savePreferences('user', completePreferences);

  const firstPage = await workflow.service.getMatches('user', 1, 1);
  const secondPage = await workflow.service.getMatches('user', 2, 1);

  assert.deepEqual(firstPage.matches.map(({ candidateId }) => candidateId), ['best']);
  assert.deepEqual(secondPage.matches.map(({ candidateId }) => candidateId), ['next-best']);
  assert.equal(firstPage.total, 2);
  assert.equal(firstPage.totalPages, 2);
});
