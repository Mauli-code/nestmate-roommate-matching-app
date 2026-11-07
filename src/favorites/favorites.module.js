const { Module } = require('@nestjs/common');
const { AuthModule } = require('../auth/auth.module');
const { FavoritesController } = require('./favorites.controller');
const { FavoritesService } = require('./favorites.service');

const FavoritesModule = class {};

Module({
  imports: [AuthModule],
  controllers: [FavoritesController],
  providers: [FavoritesService],
})(FavoritesModule);

module.exports = { FavoritesModule };
