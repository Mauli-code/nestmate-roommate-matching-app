const assert = require('node:assert/strict');
const test = require('node:test');
const { ConflictException, UnauthorizedException } = require('@nestjs/common');
const { AuthService } = require('./auth.service');

function createService() {
  const users = new Map();
  return new AuthService({
    findByEmail: async (email) => [...users.values()].find((user) => user.email === email) || null,
    save: async (user) => {
      users.set(user.id, user);
      return user;
    },
  });
}

test('registers a user without exposing the password hash', async () => {
  const result = await createService().register('Mauli User', 'MAULI@example.com', 'password123');

  assert.equal(result.user.email, 'mauli@example.com');
  assert.equal(result.user.fullName, 'Mauli User');
  assert.equal(typeof result.accessToken, 'string');
  assert.equal(result.user.passwordHash, undefined);
});

test('rejects duplicate email addresses', async () => {
  const service = createService();
  await service.register('First User', 'same@example.com', 'password123');

  await assert.rejects(
    () => service.register('Second User', 'SAME@example.com', 'password123'),
    (error) => error instanceof ConflictException,
  );
});

test('logs in with a correct password and rejects an incorrect one', async () => {
  const service = createService();
  await service.register('Test User', 'test@example.com', 'password123');

  const result = await service.login('test@example.com', 'password123');
  assert.equal(result.user.email, 'test@example.com');

  await assert.rejects(
    () => service.login('test@example.com', 'wrong-password'),
    (error) => error instanceof UnauthorizedException,
  );
});

test('revokes a token during logout', async () => {
  const service = createService();
  const { accessToken } = await service.register('Test User', 'logout@example.com', 'password123');

  assert.equal(service.verifyToken(accessToken).email, 'logout@example.com');
  service.revokeToken(accessToken);
  assert.throws(() => service.verifyToken(accessToken), UnauthorizedException);
});
