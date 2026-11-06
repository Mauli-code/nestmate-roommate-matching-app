const { Body, Controller, Get, Inject, Param, Put, Query } = require('@nestjs/common');
const { MatchingService } = require('./matching.service');

class MatchingController {
  constructor(matchingService) {
    this.matchingService = matchingService;
  }

  async getMatches(profileId) {
    return this.matchingService.getMatches(profileId);
  }

  async savePreferences(profileId, preferences) {
    return {
      profile: await this.matchingService.savePreferences(profileId, preferences),
      message: 'Preferences saved successfully',
    };
  }
}

Controller('api/matches')(MatchingController);
Inject(MatchingService)(MatchingController, undefined, 0);
const getMatchesDescriptor = Object.getOwnPropertyDescriptor(
  MatchingController.prototype,
  'getMatches',
);
Get()(MatchingController.prototype, 'getMatches', getMatchesDescriptor);
Query('profileId')(MatchingController.prototype, 'getMatches', 0);
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

module.exports = { MatchingController };
