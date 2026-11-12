const assert = require('node:assert/strict');
const test = require('node:test');
const { BadRequestException, UnauthorizedException } = require('@nestjs/common');
const { AuthService } = require('./auth.service');

function serviceWithUser() {
  const user = {
    id: 'user-1',
    fullName: 'Test User',
    email: 'test@example.com',
  };
  return new AuthService({
    findById: async (id) => (id === user.id ? user : null),
    save: async (updatedUser) => updatedUser,
  });
}

test('rejects a missing profile photo', async () => {
  await assert.rejects(
    () => serviceWithUser().uploadPhoto('user-1', null),
    (error) => error instanceof BadRequestException,
  );
});

test('rejects unsupported photo formats', async () => {
  await assert.rejects(
    () =>
      serviceWithUser().uploadPhoto('user-1', {
        mimetype: 'image/gif',
        size: 100,
        path: '/tmp/unsupported-profile-photo',
      }),
    (error) => error instanceof BadRequestException,
  );
});

test('rejects photo uploads for unknown users', async () => {
  await assert.rejects(
    () =>
      serviceWithUser().uploadPhoto('unknown-user', {
        mimetype: 'image/jpeg',
        size: 100,
        path: '/tmp/unknown-profile-photo',
      }),
    (error) => error instanceof UnauthorizedException,
  );
});
