import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { MatchingService } from './matching.service';
import { MatchingProfileRepository } from './matching.repository';

describe('MatchingService', () => {
  it('loads candidate profiles through the repository boundary', async () => {
    const repository: MatchingProfileRepository = {
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

    await assert.doesNotReject(async () => service.getCandidates('profile-1'));
    assert.equal((await service.getCandidates('profile-1'))[0]?.id, 'candidate-for-profile-1');
  });

  it('rejects an empty profile id', async () => {
    const repository: MatchingProfileRepository = {
      findCandidates: async () => [],
    };

    await assert.rejects(
      () => new MatchingService(repository).getCandidates(' '),
      /profileId is required/,
    );
  });
});
