const assert = require('node:assert/strict');
const test = require('node:test');
const {
  BadRequestException,
  ConflictException,
  UnauthorizedException,
} = require('@nestjs/common');
const { AuthService } = require('./auth.service');
const profileRepository = require('../matching/profile-repository');

function createService() {
  const users = new Map();
  return new AuthService({
    findByEmail: async (email) => [...users.values()].find((user) => user.email === email) || null,
    findById: async (id) => users.get(id) || null,
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

test('retrieves and updates the authenticated user profile', async () => {
  const users = new Map();
  const service = new AuthService({
    findByEmail: async (email) => [...users.values()].find((user) => user.email === email) || null,
    findById: async (id) => users.get(id) || null,
    save: async (user) => {
      users.set(user.id, user);
      return user;
    },
  });
  const { user } = await service.register('Original Name', 'profile@example.com', 'password123');

  const initialProfile = await service.getProfile(user.id);
  const updatedProfile = await service.updateProfile(user.id, { fullName: 'Updated Name' });

  assert.equal(initialProfile.user.fullName, 'Original Name');
  assert.equal(updatedProfile.user.fullName, 'Updated Name');
  assert.equal(updatedProfile.user.email, 'profile@example.com');
});

test('saves profile details and returns phone only in the owner profile', async () => {
  const service = createService();
  const { user } = await service.register('Profile Owner', 'owner@example.com', 'password123');
  const result = await service.updateProfile(user.id, {
    occupation: 'student', city: 'Pune', bio: 'Looking for a quiet flatmate.', phone: '+91 98765 43210',
  });
  assert.equal(result.user.occupation, 'student');
  assert.equal(result.user.city, 'Pune');
  assert.equal(result.user.phone, '+91 98765 43210');
  assert.equal(result.user.passwordHash, undefined);
});

test('profile response includes the saved matching preferences', async () => {
  const service = createService();
  const { user } = await service.register('Preferences Owner', 'prefs-owner@example.com', 'password123');
  const saved = await profileRepository.saveProfile({
    id: user.id, minBudget: 5000, maxBudget: 10000, preferredArea: 'Pune',
  });
  const result = await service.getProfile(user.id);
  assert.deepEqual(result.preferences, saved);
});

test('changing password checks the old password and revokes earlier tokens', async () => {
  const service = createService();
  const registration = await service.register('Password Owner', 'password@example.com', 'password123');
  await assert.rejects(
    () => service.changePassword(registration.user.id, { oldPassword: 'wrong-pass', newPassword: 'newpass123' }),
    (error) => error instanceof UnauthorizedException,
  );
  await service.changePassword(registration.user.id, { oldPassword: 'password123', newPassword: 'newpass123' });
  await assert.rejects(
    () => service.verifyAuthenticatedUser(service.verifyToken(registration.accessToken)),
    (error) => error instanceof UnauthorizedException,
  );
  assert.equal((await service.login('password@example.com', 'newpass123')).user.email, 'password@example.com');
});

test('rejects profile access for an unknown user', async () => {
  await assert.rejects(
    () => createService().getProfile('missing-user'),
    (error) => error instanceof UnauthorizedException,
  );
});

test('deactivates an account, invalidates its token, and supports password reactivation', async () => {
  const service = createService();
  const registration = await service.register('Lifecycle User', 'lifecycle@example.com', 'password123');

  const result = await service.deactivate(registration.user.id, { confirmation: true });
  assert.equal(result.message, 'Your account has been deactivated');
  await assert.rejects(
    () => service.login('lifecycle@example.com', 'password123'),
    (error) => error instanceof UnauthorizedException,
  );
  await assert.rejects(
    () => service.verifyAuthenticatedUser(service.verifyToken(registration.accessToken)),
    (error) => error instanceof UnauthorizedException,
  );

  const reactivated = await service.reactivate('lifecycle@example.com', 'password123');
  assert.equal(reactivated.user.email, 'lifecycle@example.com');
  assert.equal(service.verifyToken(reactivated.accessToken).sub, registration.user.id);
});

test('requires explicit confirmation and password before requesting deletion', async () => {
  const service = createService();
  const registration = await service.register('Delete User', 'delete@example.com', 'password123');

  await assert.rejects(
    () => service.requestDeletion(registration.user.id, { confirmation: 'DELETE', password: 'wrong-password' }),
    (error) => error instanceof UnauthorizedException,
  );
  await assert.rejects(
    () => service.requestDeletion(registration.user.id, { password: 'password123' }),
    (error) => error instanceof BadRequestException,
  );

  const result = await service.requestDeletion(registration.user.id, {
    confirmation: 'DELETE',
    password: 'password123',
  });
  assert.match(result.message, /deletion requested/i);
  await assert.rejects(
    () => service.login('delete@example.com', 'password123'),
    (error) => error instanceof UnauthorizedException,
  );
});
