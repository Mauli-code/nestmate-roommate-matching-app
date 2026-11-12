const assert = require('node:assert/strict');
const test = require('node:test');
const { BadRequestException } = require('@nestjs/common');
const { MatchingService } = require('./matching.service');

function createService() {
  const profiles = new Map();
  return new MatchingService({
    findProfile: async (id) => profiles.get(id) || null,
    findCandidates: async () => [],
    saveProfile: async (profile) => {
      profiles.set(profile.id, profile);
      return profile;
    },
  });
}

const preferences = {
  minBudget: '500',
  maxBudget: '1000',
  preferredArea: ' Central ',
  sleepSchedule: 'flexible',
  foodHabits: 'vegetarian',
  cleanliness: 'high',
  smoking: 'no',
  drinking: 'occasionally',
};

test('saves valid preferences as a matching profile', async () => {
  const profile = await createService().savePreferences('user-1', preferences);

  assert.equal(profile.id, 'user-1');
  assert.equal(profile.budget, 750);
  assert.equal(profile.preferredArea, 'Central');
  assert.equal(profile.foodHabits, 'vegetarian');
});

test('updates an existing profile when preferences are saved again', async () => {
  const service = createService();
  await service.savePreferences('user-1', preferences);
  const updated = await service.savePreferences('user-1', {
    ...preferences,
    minBudget: '900',
    maxBudget: '1200',
    preferredArea: 'North',
  });

  assert.equal(updated.budget, 1050);
  assert.equal(updated.preferredArea, 'North');
});

test('rejects invalid preference input', async () => {
  await assert.rejects(
    () =>
      createService().savePreferences('user-1', {
        ...preferences,
        minBudget: 'not-a-number',
      }),
    (error) => error instanceof BadRequestException,
  );
});
