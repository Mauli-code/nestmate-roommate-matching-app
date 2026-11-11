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

test('renders empty insights without inventing profile data', () => {
  const details = getCompatibilityDetails({
    score: 0,
    breakdown: {},
    explanations: {},
  });

  assert.deepEqual(details.strengths, []);
  assert.deepEqual(details.differences, []);
  assert.equal(details.insights.hasInsights, false);
  assert.match(details.insights.emptyMessage, /No match insights/);
});

// ---------------------------------------------------------------------------
// Match quality insights tests
// ---------------------------------------------------------------------------

test('populates strengths and differences from top-level match fields', () => {
  const details = getCompatibilityDetails({
    score: 90,
    breakdown: { budget: 1, location: 1, lifestyle: 1, habitsAndPreferences: 1 },
    explanations: {
      overall: { status: 'strong match', text: '90% overall compatibility.' },
    },
    strengths: ['Similar budget preferences.', 'Compatible location preferences.'],
    differences: [],
  });

  assert.deepEqual(details.strengths, ['Similar budget preferences.', 'Compatible location preferences.']);
  assert.deepEqual(details.differences, []);
});

test('hasInsights is true when strengths array is non-empty', () => {
  const details = getCompatibilityDetails({
    score: 75,
    breakdown: {},
    strengths: ['Compatible daily habits.'],
    differences: [],
  });

  assert.equal(details.insights.hasInsights, true);
});

test('hasInsights is false when both arrays are empty', () => {
  const details = getCompatibilityDetails({
    score: 50,
    breakdown: {},
    strengths: [],
    differences: [],
  });

  assert.equal(details.insights.hasInsights, false);
  assert.equal(typeof details.insights.emptyMessage, 'string');
  assert.ok(details.insights.emptyMessage.length > 0, 'emptyMessage should not be blank');
});

test('falls back to match.insights.strengths when top-level strengths is absent', () => {
  const details = getCompatibilityDetails({
    score: 60,
    breakdown: {},
    // No top-level strengths — only nested inside insights object.
    insights: {
      strengths: ['Similar budget preferences.'],
      differences: ['Different lifestyle preferences.'],
    },
  });

  assert.deepEqual(details.strengths, ['Similar budget preferences.']);
  assert.deepEqual(details.differences, ['Different lifestyle preferences.']);
  assert.equal(details.insights.hasInsights, true);
});
