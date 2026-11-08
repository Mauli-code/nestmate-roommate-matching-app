const { Module } = require('@nestjs/common');
const { AuthModule } = require('../auth/auth.module');
const { FavoritesController } = require('./favorites.controller');
const { FavoritesService } = require('./favorites.service');
const { PrivacyService } = require('../privacy/privacy.service');
const { PrivacyModule } = require('../privacy/privacy.module');

const FavoritesModule = class {};

Module({
  imports: [AuthModule, PrivacyModule],
  controllers: [FavoritesController],
  providers: [{
    provide: FavoritesService,
    useFactory: (privacy) => new FavoritesService(undefined, undefined, undefined, privacy),
    inject: [PrivacyService],
  }],
})(FavoritesModule);

module.exports = { FavoritesModule };
