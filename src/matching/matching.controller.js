const {
  Body,
  Controller,
  ForbiddenException,
  Get,
  Inject,
  Param,
  Put,
  Query,
  Req,
  UseGuards,
} = require('@nestjs/common');
const { AuthGuard } = require('../auth/auth.guard');
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

Controller('api/matches')(MatchingController);
UseGuards(AuthGuard)(MatchingController);
Inject(MatchingService)(MatchingController, undefined, 0);
const getMatchesDescriptor = Object.getOwnPropertyDescriptor(
  MatchingController.prototype,
  'getMatches',
);
Get()(MatchingController.prototype, 'getMatches', getMatchesDescriptor);
Query('profileId')(MatchingController.prototype, 'getMatches', 0);
Query('page')(MatchingController.prototype, 'getMatches', 1);
Query('limit')(MatchingController.prototype, 'getMatches', 2);
Req()(MatchingController.prototype, 'getMatches', 3);
const savePreferencesDescriptor = Object.getOwnPropertyDescriptor(
  MatchingController.prototype,
  'savePreferences',
);
Put(':profileId/preferences')(
  MatchingController.prototype,
  'savePreferences',
  savePreferencesDescriptor,
);
Param('profileId')(MatchingController.prototype, 'savePreferences', 0);
Body()(MatchingController.prototype, 'savePreferences', 1);
Req()(MatchingController.prototype, 'savePreferences', 2);

module.exports = { MatchingController };
