const assert = require('node:assert/strict');
const test = require('node:test');
const {
  calculateCompatibility,
  budgetCompatibility,
  locationCompatibility,
  lifestyleCompatibility,
  habitsAndPreferencesCompatibility,
} = require('./compatibility-score');
const { rankMatches } = require('./rank-matches');
const { MatchingService } = require('./matching.service');

function createProfile(id, overrides = {}) {
  return {
    id,
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

// ---------------------------------------------------------------------------
// 1. Incomplete profiles and missing profile fields
// ---------------------------------------------------------------------------
test('handles profiles missing individual preferences without throwing', () => {
  const user = { id: 'user' };
  const candidate = { id: 'candidate', budget: 1000 };

  const result = calculateCompatibility(user, candidate);

  assert.equal(result.score, 0);
  assert.equal(result.breakdown.budget, 0);
  assert.equal(result.breakdown.location, 0);
  assert.equal(result.breakdown.lifestyle, 0);
  assert.equal(result.breakdown.habitsAndPreferences, 0);
  assert.equal(result.explanations.budget.status, 'unavailable');
  assert.equal(result.explanations.location.status, 'unavailable');
  assert.equal(result.explanations.lifestyle.status, 'unavailable');
  assert.equal(result.explanations.habitsAndPreferences.status, 'unavailable');
  assert.equal(result.explanations.overall.status, 'unavailable');
  assert.match(result.explanations.overall.text, /Not enough profile information/);
});

// ---------------------------------------------------------------------------
// 2. Invalid or unexpected budget values
// ---------------------------------------------------------------------------
test('treats negative, zero, NaN, Infinity, and non-numeric budgets as invalid', () => {
  const valid = { budget: 1000 };

  assert.equal(budgetCompatibility({ budget: 0 }, valid), 0);
  assert.equal(budgetCompatibility({ budget: -500 }, valid), 0);
  assert.equal(budgetCompatibility({ budget: Number.NaN }, valid), 0);
  assert.equal(budgetCompatibility({ budget: Number.POSITIVE_INFINITY }, valid), 0);
  assert.equal(budgetCompatibility({ budget: Number.NEGATIVE_INFINITY }, valid), 0);
  assert.equal(budgetCompatibility({ budget: 'not-a-number' }, valid), 0);
  assert.equal(budgetCompatibility({ budget: null }, valid), 0);
  assert.equal(budgetCompatibility({ budget: undefined }, valid), 0);
  assert.equal(budgetCompatibility({ budget: true }, valid), 0);
  assert.equal(budgetCompatibility({ budget: {} }, valid), 0);
  assert.equal(budgetCompatibility({ budget: [] }, valid), 0);
});

test('safely parses valid numeric string budgets', () => {
  const result = budgetCompatibility({ budget: ' 1000 ' }, { budget: 1000 });
  assert.equal(result, 1);
});

// ---------------------------------------------------------------------------
// 3. Missing location or lifestyle information
// ---------------------------------------------------------------------------
test('treats whitespace-only locations as missing', () => {
  assert.equal(locationCompatibility({ preferredArea: '   ' }, { preferredArea: 'Central' }), 0);
  assert.equal(locationCompatibility({ preferredArea: '   ' }, { preferredArea: '   ' }), 0);
  assert.equal(locationCompatibility({ preferredArea: '\t\n' }, { preferredArea: 'Central' }), 0);
});

test('does not award compatibility points for whitespace-only lifestyle values', () => {
  const candidate1 = {
    lifestyle: { sleepSchedule: '   ', cleanliness: '   ' },
  };
  const candidate2 = {
    lifestyle: { sleepSchedule: '   ', cleanliness: '   ' },
  };

  const score = lifestyleCompatibility(candidate1, candidate2);
  assert.equal(score, 0);

  const fullResult = calculateCompatibility(candidate1, candidate2);
  assert.equal(fullResult.breakdown.lifestyle, 0);
  assert.equal(fullResult.explanations.lifestyle.status, 'unavailable');
  assert.deepEqual(fullResult.strengths, []);
});

test('handles case and whitespace differences in lifestyle preferences gracefully', () => {
  const user = {
    lifestyle: { sleepSchedule: 'Flexible', cleanliness: ' High ' },
  };
  const candidate = {
    lifestyle: { sleepSchedule: 'flexible', cleanliness: 'high' },
  };

  const score = lifestyleCompatibility(user, candidate);
  assert.equal(score, 1);

  const fullResult = calculateCompatibility(user, candidate);
  assert.equal(fullResult.breakdown.lifestyle, 1);
  assert.equal(fullResult.explanations.lifestyle.status, 'strong match');
  assert.ok(fullResult.strengths.includes('Similar lifestyle choices.'));
});

test('normalizes boolean-like habit values for smoking and pets', () => {
  const user = {
    lifestyle: { smoking: false, pets: false },
  };
  const candidate = {
    lifestyle: { smoking: 'no', pets: 'false' },
  };

  const score = habitsAndPreferencesCompatibility(user, candidate);
  assert.equal(score, 1);

  const fullResult = calculateCompatibility(user, candidate);
  assert.equal(fullResult.breakdown.habitsAndPreferences, 1);
  assert.ok(fullResult.strengths.includes('Compatible daily habits.'));
});

// ---------------------------------------------------------------------------
// 4. Empty candidate lists
// ---------------------------------------------------------------------------
test('rankMatches safely returns empty array for empty or invalid candidate collections', () => {
  const user = createProfile('user');
  assert.deepEqual(rankMatches(user, []), []);
  assert.deepEqual(rankMatches(user, null), []);
  assert.deepEqual(rankMatches(user, undefined), []);
  assert.deepEqual(rankMatches(user, 'invalid'), []);
  assert.deepEqual(rankMatches(user, [createProfile('c1')], 0), []);
});

test('MatchingService handles empty candidate list from repository correctly', async () => {
  const service = new MatchingService({
    findProfile: async () => createProfile('user'),
    findCandidates: async () => [],
  });

  const response = await service.getMatches('user', 1, 10);
  assert.deepEqual(response.matches, []);
  assert.equal(response.total, 0);
  assert.equal(response.totalPages, 0);
  assert.equal(response.hasNextPage, false);
  assert.equal(response.hasPreviousPage, false);
});

// ---------------------------------------------------------------------------
// 5. Duplicate candidate profiles and malformed IDs
// ---------------------------------------------------------------------------
test('MatchingService removes duplicate candidate IDs and normalizes candidate IDs', async () => {
  const candidates = [
    createProfile(' candidate-1 '),
    createProfile('candidate-1', { budget: 500 }),
    createProfile(102),
    createProfile('102'),
    createProfile(' user '),
  ];

  const service = new MatchingService({
    findProfile: async () => createProfile('user'),
    findCandidates: async () => candidates,
  });

  const response = await service.getMatches('user', 1, 10);
  assert.equal(response.total, 2);
  assert.deepEqual(
    response.matches.map((m) => m.candidateId),
    ['candidate-1', '102'],
  );
});

// ---------------------------------------------------------------------------
// 6. Candidates with identical compatibility scores (stable ordering)
// ---------------------------------------------------------------------------
test('preserves stable original order when multiple candidates have identical scores', () => {
  const user = createProfile('user');
  const candidates = [
    createProfile('tie-1', { budget: 800 }),
    createProfile('tie-2', { budget: 800 }),
    createProfile('tie-3', { budget: 800 }),
    createProfile('tie-4', { budget: 800 }),
  ];

  const results = rankMatches(user, candidates);
  assert.equal(results.length, 4);
  assert.deepEqual(
    results.map((m) => m.candidateId),
    ['tie-1', 'tie-2', 'tie-3', 'tie-4'],
  );
  assert.equal(results[0].score, results[1].score);
  assert.equal(results[1].score, results[2].score);
  assert.equal(results[2].score, results[3].score);
});

// ---------------------------------------------------------------------------
// 7. Null, undefined, or primitive profile inputs
// ---------------------------------------------------------------------------
test('calculateCompatibility handles null, undefined, arrays, and primitive inputs safely', () => {
  const nullResult = calculateCompatibility(null, null);
  assert.equal(nullResult.score, 0);
  assert.equal(nullResult.explanations.overall.status, 'unavailable');

  const undefinedResult = calculateCompatibility(undefined, undefined);
  assert.equal(undefinedResult.score, 0);

  const primitiveResult = calculateCompatibility('user', 123);
  assert.equal(primitiveResult.score, 0);

  const arrayResult = calculateCompatibility([], [createProfile('c')]);
  assert.equal(arrayResult.score, 0);
});

test('rankMatches handles null or invalid candidate elements safely', () => {
  const user = createProfile('user');
  const candidates = [
    null,
    undefined,
    'not-a-profile',
    12345,
    [],
    createProfile('valid'),
  ];

  const results = rankMatches(user, candidates);
  assert.equal(results.length, 6);
  assert.equal(results[0].candidateId, 'valid');
  assert.ok(results[0].score > 0);

  // Invalid candidates should receive score 0 and null candidateId
  for (let i = 1; i < results.length; i++) {
    assert.equal(results[i].score, 0);
    assert.equal(results[i].candidateId, null);
  }
});

// ---------------------------------------------------------------------------
// 8. Profiles with insufficient information to calculate a meaningful score
// ---------------------------------------------------------------------------
test('does not invent explanations or insights when neither profile has data', () => {
  const empty1 = {};
  const empty2 = { id: 'c2' };

  const result = calculateCompatibility(empty1, empty2);
  assert.equal(result.score, 0);
  assert.equal(result.explanations.overall.status, 'unavailable');
  assert.equal(
    result.explanations.overall.text,
    'Not enough profile information to compare compatibility.',
  );
  assert.deepEqual(result.strengths, []);
  assert.deepEqual(result.differences, []);
  assert.deepEqual(result.insights, { strengths: [], differences: [] });
});
