const { Controller, Get, Inject, Query } = require('@nestjs/common');
const { MatchingService } = require('./matching.service');

class MatchingController {
  constructor(matchingService) {
    this.matchingService = matchingService;
  }

  async getMatches(profileId) {
    return this.matchingService.getMatches(profileId);
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

module.exports = { MatchingController };
