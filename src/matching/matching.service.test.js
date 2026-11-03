const assert = require('node:assert/strict');
const test = require('node:test');
const { MatchingService } = require('./matching.service');

test('loads candidate profiles through the repository boundary', async () => {
  const repository = {
    findCandidates: async (profileId) => [
      {
        id: `candidate-for-${profileId}`,
        budget: 1000,
        moveInDate: '2026-12-01',
        preferredArea: 'Central',
        lifestyle: {
          sleepSchedule: 'flexible',
          cleanliness: 'medium',
          smoking: false,
          pets: false,
        },
      },
    ],
  };

  const service = new MatchingService(repository);

  await assert.doesNotReject(() => service.getCandidates('profile-1'));
  assert.equal(
    (await service.getCandidates('profile-1'))[0].id,
    'candidate-for-profile-1',
  );
});

test('rejects an empty profile id', async () => {
  const repository = { findCandidates: async () => [] };

  await assert.rejects(
    () => new MatchingService(repository).getCandidates(' '),
    /profileId is required/,
  );
});
