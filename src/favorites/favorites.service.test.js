const assert = require('node:assert/strict');
const test = require('node:test');
const {
  ConflictException,
  NotFoundException,
} = require('@nestjs/common');
const { AuthGuard } = require('../auth/auth.guard');
const { FavoritesService } = require('./favorites.service');

function createService() {
  const profiles = new Map([
    ['user-1', profile('user-1', { preferredArea: 'Central' })],
    ['roommate-1', profile('roommate-1', { preferredArea: 'Central' })],
  ]);
  const users = new Map([
    ['roommate-1', { id: 'roommate-1', fullName: 'Roommate One', email: 'one@example.com' }],
  ]);
  const saved = new Map();

  return new FavoritesService(
    {
      addFavorite: async (userId, roommateId) => {
        const key = `${userId}:${roommateId}`;
        if (saved.has(key)) return false;
        saved.set(key, { userId, roommateId, createdAt: '2026-11-07T00:00:00.000Z' });
        return true;
      },
      removeFavorite: async (userId, roommateId) => saved.delete(`${userId}:${roommateId}`),
      findByUser: async (userId) => [...saved.values()].filter((favorite) => favorite.userId === userId),
    },
    {
      findProfile: async (id) => profiles.get(id) || null,
    },
    {
      findById: async (id) => users.get(id) || null,
    },
  );
}

function profile(id, overrides = {}) {
  return {
    id,
    budget: 1000,
    preferredArea: 'North',
    lifestyle: {
      sleepSchedule: 'flexible',
      cleanliness: 'medium',
      smoking: false,
      pets: false,
    },
    ...overrides,
  };
}

test('adds and retrieves a favorite with compatibility details', async () => {
  const service = createService();

  await service.addFavorite('user-1', 'roommate-1');
  const result = await service.getFavorites('user-1');

  assert.equal(result.favorites.length, 1);
  assert.equal(result.favorites[0].roommate.id, 'roommate-1');
  assert.equal(result.favorites[0].roommate.fullName, 'Roommate One');
  assert.equal(result.favorites[0].compatibility.score, 100);
});

test('rejects duplicate favorites', async () => {
  const service = createService();
  await service.addFavorite('user-1', 'roommate-1');

  await assert.rejects(
    () => service.addFavorite('user-1', 'roommate-1'),
    (error) => error instanceof ConflictException,
  );
});

test('removes a favorite and rejects removing it twice', async () => {
  const service = createService();
  await service.addFavorite('user-1', 'roommate-1');

  await service.removeFavorite('user-1', 'roommate-1');
  assert.deepEqual(await service.getFavorites('user-1'), { favorites: [] });
  await assert.rejects(
    () => service.removeFavorite('user-1', 'roommate-1'),
    (error) => error instanceof NotFoundException,
  );
});

test('rejects a missing roommate profile', async () => {
  await assert.rejects(
    () => createService().addFavorite('user-1', 'missing-roommate'),
    (error) => error instanceof NotFoundException,
  );
});

test('rejects unauthenticated requests through the auth guard', () => {
  const guard = new AuthGuard({ verifyToken: () => ({ sub: 'user-1' }) });
  const context = {
    switchToHttp: () => ({
      getRequest: () => ({ headers: {} }),
    }),
  };

  assert.equal(guard.canActivate(context), false);
});
