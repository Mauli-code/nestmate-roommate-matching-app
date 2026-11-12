const { Module } = require('@nestjs/common');
const { AuthModule } = require('../auth/auth.module');
const { AuthGuard } = require('../auth/auth.guard');
const {
  MATCHING_PROFILE_REPOSITORY,
  profileRepository,
} = require('./matching.repository');
const { MatchingController } = require('./matching.controller');
const { MatchingService } = require('./matching.service');
const { PrivacyService } = require('../privacy/privacy.service');
const { PrivacyModule } = require('../privacy/privacy.module');
const { ModerationService } = require('../moderation/moderation.service');
const { ModerationModule } = require('../moderation/moderation.module');
const userRepository = require('../auth/user-repository');

const MatchingModule = class {};

Module({
  imports: [AuthModule, PrivacyModule, ModerationModule],
  controllers: [MatchingController],
  providers: [
    {
      provide: MatchingService,
      useFactory: (profileRepository, privacy, moderation) =>
        new MatchingService(profileRepository, privacy, moderation, userRepository),
      inject: [MATCHING_PROFILE_REPOSITORY, PrivacyService, ModerationService],
    },
    {
      provide: MATCHING_PROFILE_REPOSITORY,
      useValue: profileRepository,
    },
  ],
  exports: [MatchingService],
})(MatchingModule);

module.exports = { MatchingModule };
