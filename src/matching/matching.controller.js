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

  async getMatches(profileId, request) {
    this.assertOwnProfile(profileId, request);
    return this.matchingService.getMatches(profileId);
  }

  async savePreferences(profileId, preferences, request) {
    this.assertOwnProfile(profileId, request);
    return {
      profile: await this.matchingService.savePreferences(profileId, preferences),
      message: 'Preferences saved successfully',
    };
  }

  assertOwnProfile(profileId, request) {
    if (request.user.sub !== profileId) {
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
Req()(MatchingController.prototype, 'getMatches', 1);
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
