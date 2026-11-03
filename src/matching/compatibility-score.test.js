const assert = require('node:assert/strict');
const test = require('node:test');
const { calculateCompatibility } = require('./compatibility-score');

function profile(overrides = {}) {
  return {
    id: 'profile',
    budget: 1000,
    moveInDate: '2026-12-01',
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

test('returns 100 for highly compatible profiles', () => {
  const result = calculateCompatibility(profile(), profile({ id: 'second' }));

  assert.equal(result.score, 100);
  assert.deepEqual(result.breakdown, {
    budget: 1,
    location: 1,
    lifestyle: 1,
    habitsAndPreferences: 1,
  });
});

test('returns a partial score when only some categories match', () => {
  const result = calculateCompatibility(
    profile(),
    profile({
      id: 'second',
      budget: 800,
      preferredArea: 'North',
      lifestyle: {
        sleepSchedule: 'late',
        cleanliness: 'medium',
        smoking: true,
        pets: false,
      },
    }),
  );

  assert.ok(result.score > 0 && result.score < 100);
  assert.equal(result.breakdown.location, 0);
  assert.equal(result.breakdown.lifestyle, 0.5);
  assert.equal(result.breakdown.habitsAndPreferences, 0.5);
});

test('returns zero for incompatible profiles', () => {
  const result = calculateCompatibility(
    profile(),
    profile({
      id: 'second',
      budget: 1000000,
      preferredArea: 'North',
      lifestyle: {
        sleepSchedule: 'late',
        cleanliness: 'high',
        smoking: true,
        pets: true,
      },
    }),
  );

  assert.equal(result.score, 0);
  assert.equal(result.breakdown.location, 0);
  assert.equal(result.breakdown.lifestyle, 0);
  assert.equal(result.breakdown.habitsAndPreferences, 0);
});

test('handles missing and invalid values safely', () => {
  const missingResult = calculateCompatibility(
    profile({ budget: undefined, preferredArea: '' }),
    profile({ lifestyle: undefined }),
  );

  assert.equal(missingResult.score, 0);
  assert.deepEqual(missingResult.breakdown, {
    budget: 0,
    location: 0,
    lifestyle: 0,
    habitsAndPreferences: 0,
  });

  const invalidResult = calculateCompatibility(
    profile({ budget: -10, preferredArea: 42 }),
    profile({ budget: Number.NaN, preferredArea: null }),
  );

  assert.equal(invalidResult.score, 50);
  assert.equal(invalidResult.breakdown.budget, 0);
  assert.equal(invalidResult.breakdown.location, 0);
  assert.equal(invalidResult.breakdown.lifestyle, 1);
  assert.equal(invalidResult.breakdown.habitsAndPreferences, 1);
});
