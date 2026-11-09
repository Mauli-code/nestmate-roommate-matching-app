const { Module } = require('@nestjs/common');
const { AuthModule } = require('../auth/auth.module');
const { profileRepository, MATCHING_PROFILE_REPOSITORY } = require('../matching/matching.repository');
const { SearchController } = require('./search.controller');
const { SearchService } = require('./search.service');
const { PrivacyService } = require('../privacy/privacy.service');
const { PrivacyModule } = require('../privacy/privacy.module');
const { ModerationService } = require('../moderation/moderation.service');
const { ModerationModule } = require('../moderation/moderation.module');
const userRepository = require('../auth/user-repository');

const SearchModule = class {};

Module({
  imports: [AuthModule, PrivacyModule, ModerationModule],
  controllers: [SearchController],
  providers: [
    {
      provide: SearchService,
      useFactory: (profiles, privacy, moderation) =>
        new SearchService(profiles, userRepository, privacy, moderation),
      inject: [MATCHING_PROFILE_REPOSITORY, PrivacyService, ModerationService],
    },
    {
      provide: MATCHING_PROFILE_REPOSITORY,
      useValue: profileRepository,
    },
  ],
})(SearchModule);

module.exports = { SearchModule };
