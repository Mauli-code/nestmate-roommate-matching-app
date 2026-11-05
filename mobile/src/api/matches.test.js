const assert = require('node:assert/strict');
const test = require('node:test');

test('builds the matching API response contract', () => {
  const response = {
    profileId: 'user-1',
    matches: [
      {
        candidateId: 'candidate-1',
        score: 100,
        breakdown: { budget: 1, location: 1 },
      },
    ],
  };

  assert.equal(response.matches[0].candidateId, 'candidate-1');
  assert.equal(response.matches[0].score, 100);
  assert.equal(response.matches[0].breakdown.location, 1);
});
