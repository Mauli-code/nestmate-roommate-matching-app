const assert = require('node:assert/strict');
const test = require('node:test');
const {
  ConflictException,
  NotFoundException,
} = require('@nestjs/common');
const { ConnectionRequestsService } = require('./connection-requests.service');

function setup() {
  const profiles = new Map([
    ['user-1', profile('user-1')],
    ['user-2', profile('user-2')],
  ]);
  const users = new Map([
    ['user-1', { id: 'user-1', fullName: 'First User' }],
    ['user-2', { id: 'user-2', fullName: 'Second User' }],
  ]);
  const requests = new Map();
  return new ConnectionRequestsService({
    create: async (request) => {
      requests.set(request.id, request);
      return request;
    },
    findPending: async (senderId, receiverId) =>
      [...requests.values()].find(
        (request) =>
          request.senderId === senderId &&
          request.receiverId === receiverId &&
          request.status === 'pending',
      ) || null,
    findById: async (id) => requests.get(id) || null,
    save: async (request) => {
      requests.set(request.id, request);
      return request;
    },
    findReceived: async (userId) =>
      [...requests.values()].filter((request) => request.receiverId === userId),
    findSent: async (userId) =>
      [...requests.values()].filter((request) => request.senderId === userId),
  }, {
    findProfile: async (id) => profiles.get(id) || null,
  }, {
    findById: async (id) => users.get(id) || null,
  });
}

function profile(id) {
  return {
    id,
    budget: 1000,
    preferredArea: 'Central',
    lifestyle: {
      sleepSchedule: 'flexible',
      cleanliness: 'medium',
      smoking: false,
      pets: false,
    },
  };
}

test('creates a request and lists it as received and sent', async () => {
  const service = setup();
  const result = await service.send('user-1', 'user-2');

  assert.equal(result.request.status, 'pending');
  assert.equal((await service.sent('user-1')).requests.length, 1);
  assert.equal((await service.received('user-2')).requests[0].sender.fullName, 'First User');
});

test('rejects duplicate pending requests and self-requests', async () => {
  const service = setup();
  await service.send('user-1', 'user-2');
  await assert.rejects(() => service.send('user-1', 'user-2'), ConflictException);
  await assert.rejects(() => service.send('user-1', 'user-1'));
});

test('accepts and rejects received requests only while pending', async () => {
  const service = setup();
  const accepted = await service.send('user-1', 'user-2');
  const acceptedResult = await service.accept('user-2', accepted.request.id);
  assert.equal(acceptedResult.request.status, 'accepted');
  await assert.rejects(
    () => service.accept('user-2', accepted.request.id),
    ConflictException,
  );

  const rejected = await service.send('user-2', 'user-1');
  const rejectedResult = await service.reject('user-1', rejected.request.id);
  assert.equal(rejectedResult.request.status, 'rejected');
});

test('cancels a sent request and prevents another user from managing it', async () => {
  const service = setup();
  const result = await service.send('user-1', 'user-2');
  await assert.rejects(
    () => service.cancel('user-2', result.request.id),
    NotFoundException,
  );
  const cancelled = await service.cancel('user-1', result.request.id);
  assert.equal(cancelled.request.status, 'cancelled');
});
