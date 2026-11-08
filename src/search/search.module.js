const { Module } = require('@nestjs/common');
const { AuthModule } = require('../auth/auth.module');
const { profileRepository, MATCHING_PROFILE_REPOSITORY } = require('../matching/matching.repository');
const { SearchController } = require('./search.controller');
const { SearchService } = require('./search.service');
const { PrivacyService } = require('../privacy/privacy.service');
const { PrivacyModule } = require('../privacy/privacy.module');

const SearchModule = class {};

Module({
  imports: [AuthModule, PrivacyModule],
  controllers: [SearchController],
  providers: [
    {
      provide: SearchService,
      useFactory: (profiles, privacy) => new SearchService(profiles, undefined, privacy),
      inject: [MATCHING_PROFILE_REPOSITORY, PrivacyService],
    },
    {
      provide: MATCHING_PROFILE_REPOSITORY,
      useValue: profileRepository,
    },
  ],
})(SearchModule);

module.exports = { SearchModule };
