const { Module, ServiceUnavailableException } = require('@nestjs/common');
const {
  MATCHING_PROFILE_REPOSITORY,
} = require('./matching.repository');
const { MatchingController } = require('./matching.controller');
const { MatchingService } = require('./matching.service');

const missingProfileRepository = {
  findProfile: async () => {
    throw new ServiceUnavailableException(
      'MatchingProfileRepository has not been configured',
    );
  },
  findCandidates: async () => {
    throw new ServiceUnavailableException(
      'MatchingProfileRepository has not been configured',
    );
  },
};

const MatchingModule = class {};

Module({
  controllers: [MatchingController],
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
