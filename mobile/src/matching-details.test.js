const assert = require('node:assert/strict');
const test = require('node:test');
const { getCompatibilityDetails } = require('./matching-details');

test('prepares compatibility factors and explanations for the recommendation card', () => {
  const details = getCompatibilityDetails({
    score: 83,
    breakdown: {
      budget: 0.8,
      location: 1,
      lifestyle: 0.5,
      habitsAndPreferences: 1,
    },
    explanations: {
      overall: { status: 'strong match', text: '83% overall compatibility.' },
      budget: { status: 'strong match', text: 'Budgets are closely aligned.' },
      location: { status: 'match', text: 'Preferred locations match.' },
      lifestyle: { status: 'partial match', text: '1 of 2 available lifestyle preferences match.' },
      habitsAndPreferences: { status: 'strong match', text: '2 of 2 available habits preferences match.' },
    },
  });

  assert.equal(details.overall.score, 83);
  assert.deepEqual(details.factors.map((factor) => factor.score), [80, 100, 50, 100]);
  assert.equal(details.factors[2].text, '1 of 2 available lifestyle preferences match.');
});

test('does not invent explanations for missing or invalid scores', () => {
  const details = getCompatibilityDetails({
    score: Number.NaN,
    breakdown: { budget: undefined },
  });

  assert.equal(details.overall.score, 0);
  assert.equal(details.overall.status, 'unavailable');
  assert.match(details.factors[0].text, /Not enough information/);
});
