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

test('explains factor scores without claiming compatibility for missing data', () => {
  const result = calculateCompatibility(
    profile({ budget: undefined, preferredArea: '' }),
    profile({
      lifestyle: {
        sleepSchedule: 'late',
        cleanliness: 'medium',
        smoking: false,
        pets: false,
      },
    }),
  );

  assert.equal(result.explanations.budget.status, 'unavailable');
  assert.match(result.explanations.budget.text, /incomplete/);
  assert.equal(result.explanations.location.status, 'unavailable');
  assert.equal(result.explanations.lifestyle.status, 'partial match');
  assert.match(result.explanations.lifestyle.text, /1 of 2/);
  assert.equal(result.explanations.overall.status, 'partial match');
});

test('explains matching strengths and differences', () => {
  const result = calculateCompatibility(
    profile(),
    profile({
      preferredArea: 'North',
      lifestyle: {
        sleepSchedule: 'late',
        cleanliness: 'medium',
        smoking: true,
        pets: false,
      },
    }),
  );

  assert.equal(result.explanations.budget.status, 'strong match');
  assert.equal(result.explanations.location.status, 'different');
  assert.match(result.explanations.lifestyle.text, /1 of 2/);
  assert.match(result.explanations.habitsAndPreferences.text, /1 of 2/);
});
