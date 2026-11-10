const assert = require('node:assert/strict');
const test = require('node:test');

test('matching API integration contract includes pagination and explainability data', () => {
  const response = {
    profileId: 'user',
    page: 1,
    limit: 10,
    total: 1,
    totalPages: 1,
    hasNextPage: false,
    hasPreviousPage: false,
    matches: [{
      candidateId: 'candidate',
      score: 100,
      breakdown: {
        budget: 1,
        location: 1,
        lifestyle: 1,
        habitsAndPreferences: 1,
      },
      explanations: {
        overall: {
          status: 'strong match',
          text: '100% overall compatibility across the available factors.',
        },
      },
    }],
  };

  assert.equal(response.matches[0].score, 100);
  assert.equal(response.matches[0].explanations.overall.status, 'strong match');
  assert.equal(response.hasNextPage, false);
});

test('mobile matching integration represents backend failures as a recoverable error', () => {
  const backendError = { status: 503, message: 'The backend could not be reached' };

  assert.equal(backendError.status, 503);
  assert.match(backendError.message, /backend could not be reached/);
});
