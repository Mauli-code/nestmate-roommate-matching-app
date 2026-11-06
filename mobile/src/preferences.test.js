const assert = require('node:assert/strict');
const test = require('node:test');
const { validatePreferences } = require('./preferences');

test('accepts a complete preference form', () => {
  assert.deepEqual(
    validatePreferences({
      minBudget: '500',
      maxBudget: '1000',
      preferredArea: 'Central',
      sleepSchedule: 'flexible',
      foodHabits: 'vegetarian',
      cleanliness: 'medium',
      smoking: 'no',
      drinking: 'occasionally',
    }),
    {},
  );
});

test('reports missing values and an invalid budget range', () => {
  const errors = validatePreferences({
    minBudget: '1200',
    maxBudget: '800',
    preferredArea: '',
    sleepSchedule: '',
    foodHabits: '',
    cleanliness: '',
    smoking: '',
    drinking: '',
  });

  assert.equal(errors.maxBudget, 'Maximum budget must be at least the minimum budget.');
  assert.equal(errors.preferredArea, 'Enter a preferred location.');
  assert.equal(errors.sleepSchedule, 'Choose an option.');
  assert.equal(errors.foodHabits, 'Choose an option.');
});
