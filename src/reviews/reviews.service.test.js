const test = require('node:test');
const assert = require('node:assert/strict');
const { ConflictException, ForbiddenException } = require('@nestjs/common');
const { ReviewsService } = require('./reviews.service');

function setup() {
  const users = new Map([
    ['alice', { id: 'alice', fullName: 'Alice' }],
    ['bob', { id: 'bob', fullName: 'Bob' }],
    ['mallory', { id: 'mallory', fullName: 'Mallory' }],
  ]);
  const stored = new Map();
  const reviews = {
    create: async (review) => { stored.set(review.id, review); return review; },
    findById: async (id) => stored.get(id) || null,
    findForTarget: async (type, id) => [...stored.values()].filter((review) =>
      review.targetType === type && review.targetId === id),
    findByReviewerAndInteraction: async (reviewerId, key) => [...stored.values()].find(
      (review) => review.reviewerId === reviewerId && review.interactionKey === key,
    ) || null,
    save: async (review) => { stored.set(review.id, review); return review; },
    remove: async (id) => stored.delete(id),
  };
  return new ReviewsService(
    reviews,
    { findById: async (id) => users.get(id) || null },
    { findBetween: async () => ({ id: 'connection-1', status: 'accepted' }) },
    { findSent: async () => [{ id: 'booking-1', listingId: 'listing-1', status: 'accepted' }] },
    { findById: async (id) => id === 'listing-1' ? { id, ownerId: 'bob' } : null },
  );
}

test('creates roommate reviews and calculates average ratings', async () => {
  const service = setup();
  await service.createRoommateReview('alice', 'bob', { rating: 5, comment: 'Great roommate' });
  const result = await service.list('roommate', 'bob');
  assert.equal(result.averageRating, 5);
  assert.equal(result.totalReviews, 1);
  assert.equal(result.reviews[0].reviewer.fullName, 'Alice');
});

test('prevents duplicate reviews for the same interaction', async () => {
  const service = setup();
  await service.createRoommateReview('alice', 'bob', { rating: 4 });
  await assert.rejects(
    () => service.createRoommateReview('alice', 'bob', { rating: 5 }),
    ConflictException,
  );
});

test('creates accommodation reviews only after an accepted booking', async () => {
  const service = setup();
  const result = await service.createAccommodationReview('alice', 'listing-1', { rating: 3 });
  assert.equal(result.review.targetType, 'accommodation');
});

test('rejects unauthorized review creation and management', async () => {
  const service = setup();
  service.connections.findBetween = async () => null;
  await assert.rejects(
    () => service.createRoommateReview('alice', 'mallory', { rating: 5 }),
    ForbiddenException,
  );
  service.connections.findBetween = async () => ({ id: 'connection-1', status: 'accepted' });
  const created = await service.createRoommateReview('alice', 'bob', { rating: 5 });
  await assert.rejects(() => service.update('mallory', created.review.id, { rating: 1 }), ForbiddenException);
});
