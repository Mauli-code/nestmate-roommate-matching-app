const { Module } = require('@nestjs/common');
const { AuthModule } = require('../auth/auth.module');
const { AccommodationsController } = require('./accommodations.controller');
const { AccommodationsService } = require('./accommodations.service');
const userRepository = require('../auth/user-repository');
const {
  MATCHING_PROFILE_REPOSITORY,
  profileRepository,
} = require('../matching/matching.repository');

const AccommodationsModule = class {};

Module({
  imports: [AuthModule],
  controllers: [AccommodationsController],
  providers: [
    {
      provide: AccommodationsService,
      useFactory: (profiles) => new AccommodationsService(undefined, profiles, userRepository),
      inject: [MATCHING_PROFILE_REPOSITORY],
    },
    {
      provide: MATCHING_PROFILE_REPOSITORY,
      useValue: profileRepository,
    },
  ],
})(AccommodationsModule);

module.exports = { AccommodationsModule };
