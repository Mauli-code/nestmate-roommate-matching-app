const { Module } = require('@nestjs/common');
const { AuthModule } = require('../auth/auth.module');
const { FavoritesController } = require('./favorites.controller');
const { FavoritesService } = require('./favorites.service');
const { PrivacyService } = require('../privacy/privacy.service');
const { PrivacyModule } = require('../privacy/privacy.module');
const { ModerationService } = require('../moderation/moderation.service');
const { ModerationModule } = require('../moderation/moderation.module');

const FavoritesModule = class {};

Module({
  imports: [AuthModule, PrivacyModule, ModerationModule],
  controllers: [FavoritesController],
  providers: [{
    provide: FavoritesService,
    useFactory: (privacy, moderation) =>
      new FavoritesService(undefined, undefined, undefined, privacy, moderation),
    inject: [PrivacyService, ModerationService],
  }],
})(FavoritesModule);

module.exports = { FavoritesModule };
