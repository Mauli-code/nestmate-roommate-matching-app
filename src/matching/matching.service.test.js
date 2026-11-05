const assert = require('node:assert/strict');
const test = require('node:test');
const { BadRequestException, NotFoundException } = require('@nestjs/common');
const { MatchingService } = require('./matching.service');

test('loads candidate profiles through the repository boundary', async () => {
  const repository = {
    findCandidates: async (profileId) => [
      {
        id: `candidate-for-${profileId}`,
        budget: 1000,
        moveInDate: '2026-12-01',
        preferredArea: 'Central',
        lifestyle: {
          sleepSchedule: 'flexible',
          cleanliness: 'medium',
          smoking: false,
          pets: false,
        },
      },
    ],
  };

  const service = new MatchingService(repository);

  await assert.doesNotReject(() => service.getCandidates('profile-1'));
  assert.equal(
    (await service.getCandidates('profile-1'))[0].id,
    'candidate-for-profile-1',
  );
});

test('rejects an empty profile id', async () => {
  const repository = { findCandidates: async () => [] };

  await assert.rejects(
    () => new MatchingService(repository).getCandidates(' '),
    (error) =>
      error instanceof BadRequestException && /profileId is required/.test(error.message),
  );
});

function profile(id, overrides = {}) {
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

test('returns ranked matches with score breakdowns', async () => {
  const repository = {
    findProfile: async () => profile('user'),
    findCandidates: async () => [
      profile('lower', { preferredArea: 'North' }),
      profile('best'),
    ],
  };

  const result = await new MatchingService(repository).getMatches('user');

  assert.equal(result.profileId, 'user');
  assert.deepEqual(
    result.matches.map(({ candidateId, score }) => [candidateId, score]),
    [
      ['best', 100],
      ['lower', 75],
    ],
  );
  assert.deepEqual(Object.keys(result.matches[0].breakdown), [
    'budget',
    'location',
    'lifestyle',
    'habitsAndPreferences',
  ]);
});

test('returns an empty match list when there are no candidates', async () => {
  const repository = {
    findProfile: async () => profile('user'),
    findCandidates: async () => [],
  };

  assert.deepEqual(await new MatchingService(repository).getMatches('user'), {
    profileId: 'user',
    matches: [],
  });
});

test('rejects a missing profile and an invalid candidate list', async () => {
  await assert.rejects(
    () =>
      new MatchingService({
        findProfile: async () => null,
        findCandidates: async () => [],
      }).getMatches('missing'),
    (error) => error instanceof NotFoundException,
  );
  await assert.rejects(
    () =>
      new MatchingService({
        findProfile: async () => profile('user'),
        findCandidates: async () => null,
      }).getMatches('user'),
    (error) =>
      error instanceof BadRequestException &&
      /invalid candidate list/.test(error.message),
  );
});
