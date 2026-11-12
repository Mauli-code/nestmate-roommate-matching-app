const assert = require('node:assert/strict');
const test = require('node:test');
const { ForbiddenException, NotFoundException } = require('@nestjs/common');
const { AccommodationsService } = require('./accommodations.service');

function service() {
  const items = new Map();
  const repository = {
    create: async (item) => { items.set(item.id, item); return item; },
    findAvailable: async (filters = {}) => [...items.values()].filter((item) =>
      item.status === 'available' &&
      (!filters.type || item.type === filters.type) &&
      (filters.minRent == null || item.monthlyRent >= filters.minRent) &&
      (filters.maxRent == null || item.monthlyRent <= filters.maxRent)),
    findById: async (id) => items.get(id) || null,
    save: async (item) => { items.set(item.id, item); return item; },
    remove: async (id) => items.delete(id),
  };
  return new AccommodationsService(repository);
}

function listing(overrides = {}) {
  return {
    title: 'Central flat',
    description: 'Sunny shared flat',
    city: 'Ahmedabad',
    preferredArea: 'Central',
    monthlyRent: 12000,
    securityDeposit: 24000,
    availableRooms: 2,
    availableFrom: '2026-12-01',
    type: 'flat',
    ...overrides,
  };
}

test('creates and retrieves an accommodation listing', async () => {
  const accommodationService = service();
  const result = await accommodationService.create('owner-1', listing());
  assert.equal(result.ownerId, 'owner-1');
  assert.equal(result.status, 'available');
  assert.equal((await accommodationService.findAvailable()).listings.length, 1);
  assert.equal((await accommodationService.findOne(result.id)).title, 'Central flat');
});

test('validates listing data', async () => {
  await assert.rejects(() => service().create('owner-1', listing({ monthlyRent: 0 })));
  await assert.rejects(() => service().create('owner-1', listing({ availableFrom: 'not-a-date' })));
  await assert.rejects(() => service().create('owner-1', listing({ type: 'hotel' })));
});

test('updates and deletes only for the owner', async () => {
  const accommodationService = service();
  const created = await accommodationService.create('owner-1', listing());
  await assert.rejects(
    () => accommodationService.update('owner-2', created.id, { title: 'Changed' }),
    (error) => error instanceof ForbiddenException,
  );
  const updated = await accommodationService.update('owner-1', created.id, { title: 'Changed' });
  assert.equal(updated.title, 'Changed');
  await assert.rejects(
    () => accommodationService.remove('owner-2', created.id),
    (error) => error instanceof ForbiddenException,
  );
  await accommodationService.remove('owner-1', created.id);
  await assert.rejects(() => accommodationService.findOne(created.id), NotFoundException);
});

test('filters listings by rent and type', async () => {
  const accommodationService = service();
  await accommodationService.create('owner-1', listing({ type: 'flat', monthlyRent: 12000 }));
  await accommodationService.create('owner-2', listing({ type: 'pg', monthlyRent: 7000 }));
  const result = await accommodationService.findAvailable({ minRent: '10000', type: 'flat' });
  assert.equal(result.listings.length, 1);
  assert.equal(result.listings[0].type, 'flat');
});

test('ranks valid accommodation recommendations by suitability', async () => {
  const accommodationService = service();
  await accommodationService.create('owner-1', listing({
    preferredArea: 'Central',
    monthlyRent: 1000,
    availableFrom: '2026-11-01',
  }));
  await accommodationService.listings.create({
    id: 'invalid-listing',
    status: 'available',
    monthlyRent: 5000,
    preferredArea: 'North',
    availableRooms: 1,
    availableFrom: 'not-a-date',
  });
  const profiles = {
    findProfile: async () => ({
      budget: 1000,
      preferredArea: 'Central',
      moveInDate: '2026-12-01',
    }),
  };
  const recommendationsService = new (require('./accommodations.service').AccommodationsService)(
    accommodationService.listings,
    profiles,
  );
  const result = await recommendationsService.recommendations('user-1');
  assert.equal(result.recommendations.length, 1);
  assert.equal(result.recommendations[0].listing.preferredArea, 'Central');
  assert.equal(result.recommendations[0].score, 93);
});

test('returns no recommendations when listings are unavailable or invalid', async () => {
  const accommodationService = service();
  await accommodationService.create('owner-1', listing());
  const profileRepository = {
    findProfile: async () => ({ budget: 1000, preferredArea: 'Central' }),
  };
  const recommendationService = new (require('./accommodations.service').AccommodationsService)(
    accommodationService.listings,
    profileRepository,
  );
  const savedListings = await accommodationService.listings.findAvailable();
  await accommodationService.listings.save({
    ...savedListings[0],
    status: 'unavailable',
  });
  const result = await recommendationService.recommendations('user-1');
  assert.deepEqual(result.recommendations, []);
});
