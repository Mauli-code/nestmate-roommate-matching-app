const assert = require('node:assert/strict');
const test = require('node:test');

test('registration validation matches the server rules', async () => {
  const { validateRegistration, hasErrors } = await import('./validation.js');
  assert.equal(hasErrors(validateRegistration({
    fullName: 'Mina Rao', email: 'mina@example.com', password: 'nestmate123',
  })), false);
  assert.deepEqual(validateRegistration({ fullName: ' ', email: 'not-an-email', password: 'letters only' }), {
    fullName: 'Enter a name between 2 and 80 characters.',
    email: 'Enter a valid email address.',
    password: 'Use at least 8 characters, including a letter and a number.',
  });
});

test('registration rejects long fields and passwords without both character types', async () => {
  const { validateName, validateEmail, validatePassword } = await import('./validation.js');
  assert.match(validateName('a'.repeat(81)), /2 and 80/);
  assert.match(validateEmail(`${'a'.repeat(250)}@example.com`), /valid email/);
  assert.match(validatePassword('abcdefgh'), /letter and a number/);
  assert.match(validatePassword('12345678'), /letter and a number/);
});
