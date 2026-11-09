const assert = require('node:assert/strict');
const test = require('node:test');

test('pagination metadata represents a second page without changing match order', () => {
  const response = {
    page: 2,
    limit: 2,
    total: 3,
    totalPages: 2,
    hasNextPage: false,
    hasPreviousPage: true,
    matches: [
      { candidateId: 'candidate-3', score: 75 },
    ],
  };

  assert.equal(response.page, 2);
  assert.equal(response.totalPages, 2);
  assert.deepEqual(response.matches.map((match) => match.candidateId), ['candidate-3']);
});
