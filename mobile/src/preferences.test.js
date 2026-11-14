const assert = require('node:assert/strict');
const test = require('node:test');
const { validatePreferences, validatePreferenceStep } = require('./preferences');

test('accepts a complete preference form', () => {
  assert.deepEqual(
    validatePreferences({
      occupation: 'student',
      city: 'Pune',
      bio: '',
      minBudget: '500',
      maxBudget: '1000',
      preferredArea: 'Central',
      sleepSchedule: 'flexible',
      foodHabits: 'vegetarian',
      cleanliness: 'medium',
      smoking: 'no',
      drinking: 'occasionally',
      pets: 'no',
    }),
    {},
  );
});

test('reports missing values and an invalid budget range', () => {
  const errors = validatePreferences({
    occupation: 'student',
    city: 'Pune',
    bio: '',
    minBudget: '1200',
    maxBudget: '800',
    preferredArea: '',
    sleepSchedule: '',
    foodHabits: '',
    cleanliness: '',
    smoking: '',
    drinking: '',
    pets: '',
  });

  assert.equal(errors.maxBudget, 'Maximum budget must be at least the minimum budget.');
  assert.equal(errors.preferredArea, 'Enter a preferred area up to 100 characters.');
  assert.equal(errors.sleepSchedule, 'Choose an option.');
  assert.equal(errors.foodHabits, 'Choose an option.');
});

test('validates basics and budget onboarding steps', () => {
  assert.deepEqual(validatePreferenceStep({ occupation: 'student', city: 'Pune', bio: '' }, 0), {});
  assert.equal(validatePreferenceStep({ occupation: 'other', city: ' ', bio: 'x'.repeat(201) }, 0).occupation !== undefined, true);
  assert.deepEqual(validatePreferenceStep({ minBudget: '500', maxBudget: '900', preferredArea: 'Central' }, 1), {});
  assert.equal(validatePreferenceStep({ minBudget: '1000', maxBudget: '500', preferredArea: '' }, 1).maxBudget !== undefined, true);
});

test('validates lifestyle and habit onboarding steps', () => {
  assert.deepEqual(validatePreferenceStep({ sleepSchedule: 'flexible', foodHabits: 'vegetarian', cleanliness: 'medium' }, 2), {});
  assert.deepEqual(validatePreferenceStep({ smoking: 'no', drinking: 'never', pets: 'any' }, 3), {});
  assert.equal(validatePreferenceStep({ sleepSchedule: '', foodHabits: '', cleanliness: '' }, 2).foodHabits, 'Choose an option.');
  assert.equal(validatePreferenceStep({ smoking: '', drinking: '', pets: '' }, 3).pets, 'Choose an option.');
});
