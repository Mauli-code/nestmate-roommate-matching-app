const { Module } = require('@nestjs/common');
const { AuthModule } = require('./auth/auth.module');
const { MatchingModule } = require('./matching/matching.module');
const { FavoritesModule } = require('./favorites/favorites.module');

class AppModule {}

Module({
  imports: [AuthModule, MatchingModule, FavoritesModule],
})(AppModule);

module.exports = { AppModule };
