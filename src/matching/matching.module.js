const { Module } = require('@nestjs/common');
const {
  MATCHING_PROFILE_REPOSITORY,
  profileRepository,
} = require('./matching.repository');
const { MatchingController } = require('./matching.controller');
const { MatchingService } = require('./matching.service');

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
      useValue: profileRepository,
    },
  ],
  exports: [MatchingService],
})(MatchingModule);

module.exports = { MatchingModule };
