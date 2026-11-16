const express = require('express');
const { ForbiddenException } = require('../common/exceptions');
const { createAuthMiddleware } = require('../auth/auth.guard');
const { MatchingService } = require('./matching.service');

class MatchingController {
  constructor(matchingService) {
    this.matchingService = matchingService;
  }

  async getMatches(profileId, page, limit, request) {
    if (profileId && typeof profileId === 'object' && page === undefined && request === undefined) {
      request = profileId;
      profileId = undefined;
    } else if (page && typeof page === 'object' && request === undefined) {
      request = page;
      page = undefined;
      limit = undefined;
    } else if (limit && typeof limit === 'object' && request === undefined) {
      request = limit;
      limit = undefined;
    }
    this.assertOwnProfile(profileId, request);
    const authenticatedUserId = request.user.sub;
    return this.matchingService.getMatches(authenticatedUserId, page, limit);
  }

  async savePreferences(profileId, preferences, request) {
    if (profileId && typeof profileId === 'object' && preferences && typeof preferences === 'object' && request === undefined) {
      request = preferences;
      preferences = profileId;
      profileId = undefined;
    }
    this.assertOwnProfile(profileId, request);
    const authenticatedUserId = request.user.sub;
    return {
      profile: await this.matchingService.savePreferences(authenticatedUserId, preferences),
      message: 'Preferences saved successfully',
    };
  }

  assertOwnProfile(profileId, request) {
    if (!request?.user || request.user.sub === undefined || request.user.sub === null) {
      throw new ForbiddenException('You can only access your own profile');
    }
    if (
      profileId !== undefined &&
      profileId !== null &&
      profileId !== '' &&
      profileId !== request.user.sub
    ) {
      throw new ForbiddenException('You can only access your own profile');
    }
  }
}

function createMatchingRouter(matchingService, authService) {
  const router = express.Router();
  const controller = new MatchingController(matchingService);
  const requireAuth = createAuthMiddleware(authService);

  router.use(requireAuth);

  router.get('/', async (req, res, next) => {
    try {
      const { profileId, page, limit } = req.query;
      const result = await controller.getMatches(profileId, page, limit, req);
      res.json(result);
    } catch (err) {
      next(err);
    }
  });

  router.put('/:profileId/preferences', async (req, res, next) => {
    try {
      const { profileId } = req.params;
      const result = await controller.savePreferences(profileId, req.body, req);
      res.json(result);
    } catch (err) {
      next(err);
    }
  });

  return router;
}

module.exports = { MatchingController, createMatchingRouter };
