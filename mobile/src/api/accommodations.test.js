const assert = require('node:assert/strict');
const test = require('node:test');

test('builds the accommodation recommendation endpoint contract', () => {
  const recommendation = {
    listing: { id: 'listing-1', monthlyRent: 10000 },
    score: 85,
    breakdown: { budget: 1, location: 1 },
  };
  assert.equal(recommendation.listing.id, 'listing-1');
  assert.equal(recommendation.score, 85);
  assert.equal(recommendation.breakdown.location, 1);
});
