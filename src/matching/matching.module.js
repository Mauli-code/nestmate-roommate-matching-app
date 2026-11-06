const { Module } = require('@nestjs/common');
const { AuthModule } = require('../auth/auth.module');
const { AuthGuard } = require('../auth/auth.guard');
const {
  MATCHING_PROFILE_REPOSITORY,
  profileRepository,
} = require('./matching.repository');
const { MatchingController } = require('./matching.controller');
const { MatchingService } = require('./matching.service');

const MatchingModule = class {};

Module({
  imports: [AuthModule],
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
