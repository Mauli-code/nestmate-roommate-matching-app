const assert = require('node:assert/strict');
const test = require('node:test');
const { rankMatches } = require('./rank-matches');

function profile(id, overrides = {}) {
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

test('ranks candidates from highest to lowest compatibility', () => {
  const rankedMatches = rankMatches(profile('user'), [
    profile('lower', { preferredArea: 'North' }),
    profile('highest'),
    profile('middle', { budget: 500 }),
  ]);

  assert.deepEqual(
    rankedMatches.map((match) => [match.candidateId, match.score]),
    [
      ['highest', 100],
      ['middle', 88],
      ['lower', 75],
    ],
  );
  assert.deepEqual(Object.keys(rankedMatches[0]), [
    'candidateId',
    'score',
    'breakdown',
    'explanations',
  ]);
});

test('keeps tied candidates in their original order', () => {
  const rankedMatches = rankMatches(profile('user'), [
    profile('first-tie', { preferredArea: 'North' }),
    profile('second-tie', { preferredArea: 'North' }),
  ]);

  assert.deepEqual(
    rankedMatches.map((match) => match.candidateId),
    ['first-tie', 'second-tie'],
  );
});

test('returns an empty array for an empty or invalid candidate list', () => {
  assert.deepEqual(rankMatches(profile('user'), []), []);
  assert.deepEqual(rankMatches(profile('user'), null), []);
});

test('safely ranks an invalid candidate with a zero score', () => {
  const rankedMatches = rankMatches(profile('user'), [
    null,
    profile('valid'),
  ]);

  assert.equal(rankedMatches[0].candidateId, 'valid');
  assert.equal(rankedMatches[1].candidateId, null);
  assert.equal(rankedMatches[1].score, 0);
});
