const { Module } = require('@nestjs/common');
const { AuthModule } = require('./auth/auth.module');
const { MatchingModule } = require('./matching/matching.module');
const { FavoritesModule } = require('./favorites/favorites.module');
const { ConnectionRequestsModule } = require('./connection-requests/connection-requests.module');
const { NotificationsModule } = require('./notifications/notifications.module');

class AppModule {}

Module({
  imports: [AuthModule, MatchingModule, FavoritesModule, ConnectionRequestsModule, NotificationsModule],
})(AppModule);

module.exports = { AppModule };
