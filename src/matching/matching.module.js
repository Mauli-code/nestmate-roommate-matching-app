const { Module } = require('@nestjs/common');
const {
  MATCHING_PROFILE_REPOSITORY,
} = require('./matching.repository');
const { MatchingService } = require('./matching.service');

const missingProfileRepository = {
  findCandidates: async () => {
    throw new Error('MatchingProfileRepository has not been configured');
  },
};

const MatchingModule = class {};

Module({
  providers: [
    {
      provide: MatchingService,
      useFactory: (profileRepository) => new MatchingService(profileRepository),
      inject: [MATCHING_PROFILE_REPOSITORY],
    },
    {
      provide: MATCHING_PROFILE_REPOSITORY,
      useValue: missingProfileRepository,
    },
  ],
  exports: [MatchingService],
})(MatchingModule);

module.exports = { MatchingModule };
