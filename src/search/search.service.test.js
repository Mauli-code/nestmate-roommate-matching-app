const assert = require('node:assert/strict');
const test = require('node:test');
const { BadRequestException } = require('@nestjs/common');
const { SearchService } = require('./search.service');

function profile(id, overrides = {}) {
  return {
    id,
    budget: 1000,
    preferredArea: 'Central',
    lifestyle: { sleepSchedule: 'flexible', cleanliness: 'medium', smoking: false },
    foodHabits: 'vegetarian',
    drinking: 'no',
    ...overrides,
  };
}

function service() {
  const profiles = new Map([
    ['user-1', profile('user-1')],
    ['roommate-1', profile('roommate-1', { budget: 800, preferredArea: 'North' })],
    ['roommate-2', profile('roommate-2', { budget: 1400, preferredArea: 'Central' })],
  ]);
  return new SearchService({
    findProfile: async (id) => profiles.get(id) || null,
    findCandidates: async (id) => [...profiles.values()].filter((item) => item.id !== id),
  }, {
    findById: async (id) => ({ id, fullName: id === 'user-1' ? 'Current User' : 'Roommate' }),
  });
}

test('filters by budget and location and excludes the current user', async () => {
  const result = await service().search('user-1', {
    minBudget: '700',
    maxBudget: '900',
    preferredArea: 'north',
  });
  assert.deepEqual(result.results.map((item) => item.profile.id), ['roommate-1']);
});

test('filters lifestyle, food, sleeping, smoking, and drinking preferences', async () => {
  const result = await service().search('user-1', {
    lifestyle: 'medium',
    foodHabits: 'vegetarian',
    sleepSchedule: 'flexible',
    smoking: 'no',
    drinking: 'no',
  });
  assert.equal(result.results.length, 2);
});

test('sorts by budget and rejects invalid ranges or sort values', async () => {
  const result = await service().search('user-1', { sort: 'budget' });
  assert.deepEqual(result.results.map((item) => item.profile.budget), [800, 1400]);
  await assert.rejects(
    () => service().search('user-1', { minBudget: 1000, maxBudget: 500 }),
    (error) => error instanceof BadRequestException,
  );
  await assert.rejects(
    () => service().search('user-1', { sort: 'unknown' }),
    (error) => error instanceof BadRequestException,
  );
});

test('rejects an unauthenticated or unknown user search', async () => {
  await assert.rejects(
    () => service().search('missing-user', {}),
    (error) => error instanceof BadRequestException,
  );
});
