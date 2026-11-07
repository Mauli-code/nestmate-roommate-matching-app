const { Module } = require('@nestjs/common');
const { AuthModule } = require('../auth/auth.module');
const { profileRepository, MATCHING_PROFILE_REPOSITORY } = require('../matching/matching.repository');
const { SearchController } = require('./search.controller');
const { SearchService } = require('./search.service');

const SearchModule = class {};

Module({
  imports: [AuthModule],
  controllers: [SearchController],
  providers: [
    {
      provide: SearchService,
      useFactory: (profiles) => new SearchService(profiles),
      inject: [MATCHING_PROFILE_REPOSITORY],
    },
    {
      provide: MATCHING_PROFILE_REPOSITORY,
      useValue: profileRepository,
    },
  ],
})(SearchModule);

module.exports = { SearchModule };
