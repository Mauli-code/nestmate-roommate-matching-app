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

test('recalculates matches from the latest saved profile preferences', async () => {
  const profiles = new Map([
    [
      'user-1',
      {
        id: 'user-1',
        budget: 500,
        preferredArea: 'North',
        lifestyle: {
          sleepSchedule: 'late',
          cleanliness: 'low',
          smoking: true,
          pets: true,
        },
      },
    ],
    [
      'candidate-1',
      {
        id: 'candidate-1',
        budget: 1000,
        preferredArea: 'Central',
        lifestyle: {
          sleepSchedule: 'flexible',
          cleanliness: 'medium',
          smoking: false,
          pets: false,
        },
      },
    ],
    [
      'candidate-2',
      {
        id: 'candidate-2',
        budget: 500,
        preferredArea: 'North',
        lifestyle: {
          sleepSchedule: 'late',
          cleanliness: 'low',
          smoking: true,
          pets: true,
        },
      },
    ],
  ]);
  const repository = {
    findProfile: async (id) => profiles.get(id) || null,
    findCandidates: async (id) => [...profiles.values()].filter((profile) => profile.id !== id),
  };
  const service = new MatchingService(repository);

  const firstResult = await service.getMatches('user-1');
  profiles.set('user-1', {
    ...profiles.get('user-1'),
    budget: 1000,
    preferredArea: 'Central',
    lifestyle: {
      sleepSchedule: 'flexible',
      cleanliness: 'medium',
      smoking: false,
      pets: false,
    },
  });
  const updatedResult = await service.getMatches('user-1');

  assert.equal(firstResult.matches[0].candidateId, 'candidate-2');
  assert.equal(updatedResult.matches[0].candidateId, 'candidate-1');
  assert.notEqual(
    firstResult.matches.find((match) => match.candidateId === 'candidate-1').score,
    updatedResult.matches.find((match) => match.candidateId === 'candidate-1').score,
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
  assert.equal(result.matches[0].explanations.overall.status, 'strong match');
  assert.match(result.matches[0].explanations.location.text, /match/);
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

test('excludes hidden profiles from recommendations', async () => {
  const repository = {
    findProfile: async () => profile('user'),
    findCandidates: async () => [profile('visible'), profile('hidden')],
  };
  const privacy = {
    forUser: async (id) => ({ showProfile: id !== 'hidden' }),
  };

  const result = await new MatchingService(repository, privacy).getMatches('user');

  assert.deepEqual(result.matches.map((match) => match.candidateId), ['visible']);
});

test('removes self, duplicate, and malformed candidates before ranking', async () => {
  const repository = {
    findProfile: async () => profile('user'),
    findCandidates: async () => [
      profile('user'),
      profile('candidate-1'),
      profile('candidate-1', { preferredArea: 'North' }),
      null,
      { budget: 1000 },
      profile('candidate-2', { preferredArea: 'North' }),
    ],
  };

  const result = await new MatchingService(repository).getMatches('user');

  assert.deepEqual(
    result.matches.map((match) => match.candidateId),
    ['candidate-1', 'candidate-2'],
  );
});
