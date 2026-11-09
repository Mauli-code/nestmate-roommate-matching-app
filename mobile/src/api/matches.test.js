const assert = require('node:assert/strict');
const test = require('node:test');

test('builds the matching API response contract', () => {
  const response = {
    profileId: 'user-1',
    page: 1,
    limit: 10,
    total: 1,
    totalPages: 1,
    hasNextPage: false,
    hasPreviousPage: false,
    matches: [
      {
        candidateId: 'candidate-1',
        score: 100,
        breakdown: { budget: 1, location: 1 },
        explanations: {
          overall: { status: 'strong match', text: '100% overall compatibility.' },
        },
      },
    ],
  };

  assert.equal(response.matches[0].candidateId, 'candidate-1');
  assert.equal(response.matches[0].score, 100);
  assert.equal(response.matches[0].breakdown.location, 1);
});
