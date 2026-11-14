const assert = require('node:assert/strict');
const test = require('node:test');
const { mergeMatches } = require('./match-refresh');

test('replaces recommendations after a refresh without duplicates', () => {
  const current = [{ candidateId: 'old', score: 100 }];
  const refreshed = [
    { candidateId: 'new', score: 100 },
    { candidateId: 'old', score: 50 },
  ];

  assert.deepEqual(mergeMatches(current, refreshed, false), refreshed);
});

test('appends only new recommendations while preserving ranked page order', () => {
  const current = [
    { candidateId: 'best', score: 100 },
    { candidateId: 'second', score: 90 },
  ];
  const nextPage = [
    { candidateId: 'second', score: 90 },
    { candidateId: 'third', score: 80 },
  ];

  assert.deepEqual(
    mergeMatches(current, nextPage, true).map((match) => match.candidateId),
    ['best', 'second', 'third'],
  );
});
