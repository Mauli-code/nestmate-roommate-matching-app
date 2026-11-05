const test = require('node:test');
const assert = require('node:assert/strict');
const { MOCK_RECOMMENDED_ROOMMATES } = require('../src/data/mockData');

test('Compatibility breakdown categories sum up to total score', () => {
  for (const roommate of MOCK_RECOMMENDED_ROOMMATES) {
    const { score, breakdown } = roommate;
    const sum =
      breakdown.budget +
      breakdown.location +
      breakdown.lifestyle +
      breakdown.habitsAndPreferences;

    assert.equal(
      sum,
      score,
      `Roommate ${roommate.name} breakdown (${sum}) does not match score (${score})`,
    );
  }
});

test('Filtering roommates by location and max budget works correctly', () => {
  const centralOnly = MOCK_RECOMMENDED_ROOMMATES.filter(
    (r) => r.preferredArea === 'Central',
  );
  assert.ok(centralOnly.length >= 3);
  for (const r of centralOnly) {
    assert.equal(r.preferredArea, 'Central');
  }

  const budgetUnder1200 = MOCK_RECOMMENDED_ROOMMATES.filter(
    (r) => r.budget <= 1100,
  );
  assert.ok(budgetUnder1200.length >= 2);
  for (const r of budgetUnder1200) {
    assert.ok(r.budget <= 1100);
  }
});

test('Sorting roommates by compatibility and budget produces expected order', () => {
  // Sort by compatibility descending
  const sortedByScore = [...MOCK_RECOMMENDED_ROOMMATES].sort(
    (a, b) => b.score - a.score,
  );
  for (let i = 0; i < sortedByScore.length - 1; i++) {
    assert.ok(sortedByScore[i].score >= sortedByScore[i + 1].score);
  }

  // Sort by budget ascending
  const sortedByBudget = [...MOCK_RECOMMENDED_ROOMMATES].sort(
    (a, b) => a.budget - b.budget,
  );
  for (let i = 0; i < sortedByBudget.length - 1; i++) {
    assert.ok(sortedByBudget[i].budget <= sortedByBudget[i + 1].budget);
  }
});
