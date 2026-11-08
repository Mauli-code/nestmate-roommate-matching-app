const assert = require('node:assert/strict');
const test = require('node:test');
const {
  ConflictException,
  ForbiddenException,
  NotFoundException,
} = require('@nestjs/common');
const { BookingRequestsService } = require('./booking-requests.service');

function setup() {
  const saved = new Map();
  const listings = new Map([[
    'listing-1',
    { id: 'listing-1', ownerId: 'owner-1', status: 'available' },
  ]]);
  return new BookingRequestsService(
    {
      create: async (request) => { saved.set(request.id, request); return request; },
      findPending: async (senderId, listingId) =>
        [...saved.values()].find((request) =>
          request.senderId === senderId &&
          request.listingId === listingId &&
          request.status === 'pending') || null,
      findById: async (id) => saved.get(id) || null,
      save: async (request) => { saved.set(request.id, request); return request; },
      findReceived: async (ownerId) => [...saved.values()].filter((request) => request.ownerId === ownerId),
      findSent: async (senderId) => [...saved.values()].filter((request) => request.senderId === senderId),
    },
    { findById: async (id) => listings.get(id) || null },
    { findById: async (id) => ({ id }) },
    { create: async () => {} },
  );
}

const booking = {
  requestedMoveInDate: '2026-12-01',
  occupants: 2,
  message: 'I am interested in this room.',
};

test('creates and lists a booking request', async () => {
  const service = setup();
  const result = await service.send('user-1', 'listing-1', booking);
  assert.equal(result.request.status, 'pending');
  assert.equal((await service.sent('user-1')).requests.length, 1);
  assert.equal((await service.received('owner-1')).requests.length, 1);
});

test('rejects duplicate and self booking requests', async () => {
  const service = setup();
  await service.send('user-1', 'listing-1', booking);
  await assert.rejects(() => service.send('user-1', 'listing-1', booking), ConflictException);
  await assert.rejects(() => service.send('owner-1', 'listing-1', booking));
});

test('accepts, rejects, and cancels pending requests', async () => {
  const service = setup();
  const accepted = await service.send('user-1', 'listing-1', booking);
  assert.equal((await service.accept('owner-1', accepted.request.id)).request.status, 'accepted');

  const rejected = await service.send('user-2', 'listing-1', booking);
  assert.equal((await service.reject('owner-1', rejected.request.id)).request.status, 'rejected');

  const cancelled = await service.send('user-3', 'listing-1', booking);
  assert.equal((await service.cancel('user-3', cancelled.request.id)).request.status, 'cancelled');
});

test('prevents unauthorized request management and unavailable bookings', async () => {
  const service = setup();
  const request = await service.send('user-1', 'listing-1', booking);
  await assert.rejects(
    () => service.accept('user-1', request.request.id),
    NotFoundException,
  );
  const unavailable = setup();
  unavailable.accommodations = undefined;
  await assert.rejects(
    () => service.send('user-1', 'missing-listing', booking),
    NotFoundException,
  );
});
