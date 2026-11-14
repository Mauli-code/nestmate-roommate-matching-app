const assert = require('node:assert/strict');
const test = require('node:test');
const { BadRequestException } = require('@nestjs/common');
const {
  validateRegistration, validateNewPassword, validateProfile, validatePreferences,
} = require('./validators');

function fieldErrors(action) {
  try {
    action();
  } catch (error) {
    return error.getResponse().errors;
  }
  assert.fail('Expected validation to fail');
}

test('registration accepts valid details and reports each invalid field', () => {
  assert.equal(validateRegistration('Sam Lee', 'sam@example.com', 'hello1234').email, 'sam@example.com');
  assert.deepEqual(fieldErrors(() => validateRegistration(' ', 'bad-email', 'password')), {
    fullName: 'Enter a name between 2 and 80 characters.',
    email: 'Enter a valid email address.',
    password: 'Use at least 8 characters, including a letter and a number.',
  });
});

test('password requires a letter and a number', () => {
  assert.equal(validateNewPassword('newpass123'), 'newpass123');
  assert.equal(fieldErrors(() => validateNewPassword('onlyletters')).newPassword !== undefined, true);
  assert.equal(fieldErrors(() => validateNewPassword('12345678')).newPassword !== undefined, true);
});

test('profile validates occupation, city, bio and private phone', () => {
  assert.deepEqual(validateProfile({ occupation: 'working', city: 'Pune', bio: 'Hello', phone: '' }), {
    occupation: 'working', city: 'Pune', bio: 'Hello', phone: '',
  });
  const errors = fieldErrors(() => validateProfile({ occupation: 'other', city: ' ', bio: 'x'.repeat(201), phone: 'bad' }));
  assert.deepEqual(Object.keys(errors).sort(), ['bio', 'city', 'occupation', 'phone']);
});

test('preferences errors identify budget and lifestyle fields', () => {
  const errors = fieldErrors(() => validatePreferences({
    minBudget: '10000', maxBudget: '5000', preferredArea: '', sleepSchedule: '',
    foodHabits: '', cleanliness: '', smoking: '', drinking: '',
  }));
  assert.deepEqual(Object.keys(errors).sort(), ['cleanliness', 'drinking', 'foodHabits', 'maxBudget', 'preferredArea', 'sleepSchedule', 'smoking']);
  assert.equal(fieldErrors(() => validatePreferences({ minBudget: true })).minBudget !== undefined, true);
  assert.throws(() => validateRegistration(null, null, null), BadRequestException);
});
