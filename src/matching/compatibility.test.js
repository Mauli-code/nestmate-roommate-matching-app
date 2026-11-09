const assert = require('node:assert/strict');
const test = require('node:test');
const {
  budgetCompatibility,
  locationCompatibility,
} = require('./compatibility');

test('gives equal budgets a perfect score', () => {
  assert.equal(budgetCompatibility({ budget: 1000 }, { budget: 1000 }), 1);
});

test('gives partially different budgets a proportional score', () => {
  assert.equal(budgetCompatibility({ budget: 1000 }, { budget: 900 }), 0.9);
});

test('returns zero when a budget is missing', () => {
  assert.equal(budgetCompatibility({ budget: 1000 }, {}), 0);
});

test('returns zero for invalid budgets', () => {
  assert.equal(budgetCompatibility({ budget: -100 }, { budget: 1000 }), 0);
});

test('matches locations without considering case or surrounding spaces', () => {
  assert.equal(
    locationCompatibility(
      { preferredArea: ' Central ' },
      { preferredArea: 'central' },
    ),
    1,
  );
});

test('returns zero for different or missing locations', () => {
  assert.equal(
    locationCompatibility({ preferredArea: 'Central' }, { preferredArea: 'North' }),
    0,
  );
  assert.equal(locationCompatibility({}, { preferredArea: 'Central' }), 0);
});

test('returns zero for a non-string location', () => {
  assert.equal(locationCompatibility({ preferredArea: 42 }, { preferredArea: 'Central' }), 0);
});
