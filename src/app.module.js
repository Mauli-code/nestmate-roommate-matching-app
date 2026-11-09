const { Module } = require('@nestjs/common');
const { AuthModule } = require('./auth/auth.module');
const { MatchingModule } = require('./matching/matching.module');
const { FavoritesModule } = require('./favorites/favorites.module');
const { ConnectionRequestsModule } = require('./connection-requests/connection-requests.module');
const { NotificationsModule } = require('./notifications/notifications.module');
const { SearchModule } = require('./search/search.module');
const { AccommodationsModule } = require('./accommodations/accommodations.module');
const { BookingRequestsModule } = require('./booking-requests/booking-requests.module');
const { ChatModule } = require('./chat/chat.module');
const { ReviewsModule } = require('./reviews/reviews.module');
const { DashboardModule } = require('./dashboard/dashboard.module');
const { PrivacyModule } = require('./privacy/privacy.module');
const { ModerationModule } = require('./moderation/moderation.module');

class AppModule {}

Module({
  imports: [AuthModule, MatchingModule, FavoritesModule, ConnectionRequestsModule, NotificationsModule, SearchModule, AccommodationsModule, BookingRequestsModule, ChatModule, ReviewsModule, DashboardModule, PrivacyModule, ModerationModule],
})(AppModule);

module.exports = { AppModule };
