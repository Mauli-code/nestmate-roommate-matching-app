const assert = require('node:assert/strict');
const test = require('node:test');
const { BadRequestException, NotFoundException } = require('@nestjs/common');
const { ForbiddenException } = require('@nestjs/common');
const { MatchingController } = require('./matching.controller');

test('returns ranked matches for a profile id', async () => {
  const service = {
    getMatches: async (profileId) => ({
      profileId,
      matches: [
        {
          candidateId: 'candidate-1',
          score: 88,
          breakdown: {
            budget: 0.8,
            location: 1,
            lifestyle: 0.5,
            habitsAndPreferences: 1,
          },
        },
      ],
    }),
  };

  const result = await new MatchingController(service).getMatches(
    'profile-1',
    undefined,
    undefined,
    { user: { sub: 'profile-1' } },
  );

  assert.deepEqual(result, {
    profileId: 'profile-1',
    matches: [
      {
        candidateId: 'candidate-1',
        score: 88,
        breakdown: {
          budget: 0.8,
          location: 1,
          lifestyle: 0.5,
          habitsAndPreferences: 1,
        },
      },
    ],
  });
});

test('passes service errors through for invalid and missing profiles', async () => {
  const invalidProfileService = {
    getMatches: async () => {
      throw new BadRequestException('profileId is required');
    },
  };
  const missingProfileService = {
    getMatches: async () => {
      throw new NotFoundException('Profile was not found');
    },
  };

  await assert.rejects(
    () => new MatchingController(invalidProfileService).getMatches('', {
      user: { sub: '' },
    }),
    (error) => error instanceof BadRequestException,
  );
  await assert.rejects(
    () => new MatchingController(missingProfileService).getMatches('missing', {
      user: { sub: 'missing' },
    }),
    (error) => error instanceof NotFoundException,
  );
});

test('rejects access to another user profile', async () => {
  const service = { getMatches: async () => ({}) };

  await assert.rejects(
    () =>
      new MatchingController(service).getMatches('other-user', {
        user: { sub: 'current-user' },
      }),
    (error) => error instanceof ForbiddenException,
  );
});

test('rejects requests without an authenticated user', async () => {
  const service = { getMatches: async () => ({}) };

  await assert.rejects(
    () => new MatchingController(service).getMatches('profile-1', {}),
    (error) => error instanceof ForbiddenException,
  );
});
