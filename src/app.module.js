const { Module } = require('@nestjs/common');
const { AuthModule } = require('./auth/auth.module');
const { MatchingModule } = require('./matching/matching.module');
const { FavoritesModule } = require('./favorites/favorites.module');
const { ConnectionRequestsModule } = require('./connection-requests/connection-requests.module');

class AppModule {}

Module({
  imports: [AuthModule, MatchingModule, FavoritesModule, ConnectionRequestsModule],
})(AppModule);

module.exports = { AppModule };
