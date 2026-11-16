const express = require('express');
const path = require('node:path');

// Services
const { AuthService } = require('./auth/auth.service');
const { MatchingService } = require('./matching/matching.service');
const { AccommodationsService } = require('./accommodations/accommodations.service');
const { FavoritesService } = require('./favorites/favorites.service');
const { ConnectionRequestsService } = require('./connection-requests/connection-requests.service');
const { BookingRequestsService } = require('./booking-requests/booking-requests.service');
const { ChatService } = require('./chat/chat.service');
const { NotificationsService } = require('./notifications/notifications.service');
const { NotificationPreferencesService } = require('./notifications/notification-preferences.service');
const { ReviewsService } = require('./reviews/reviews.service');
const { DashboardService } = require('./dashboard/dashboard.service');
const { SearchService } = require('./search/search.service');
const { PrivacyService } = require('./privacy/privacy.service');
const { ModerationService } = require('./moderation/moderation.service');

// Repositories
const { profileRepository } = require('./matching/matching.repository');
const userRepository = require('./auth/user-repository');

// Router factories
const { createAuthRouter } = require('./auth/auth.controller');
const { createMatchingRouter } = require('./matching/matching.controller');
const { createAccommodationsRouter } = require('./accommodations/accommodations.controller');
const { createFavoritesRouter } = require('./favorites/favorites.controller');
const { createConnectionRequestsRouter } = require('./connection-requests/connection-requests.controller');
const { createBookingRequestsRouter } = require('./booking-requests/booking-requests.controller');
const { createChatRouter } = require('./chat/chat.controller');
const { createNotificationsRouter } = require('./notifications/notifications.controller');
const { createReviewsRouter } = require('./reviews/reviews.controller');
const { createDashboardRouter } = require('./dashboard/dashboard.controller');
const { createSearchRouter } = require('./search/search.controller');
const { createPrivacyRouter } = require('./privacy/privacy.controller');
const { createModerationRouter } = require('./moderation/moderation.controller');
const { createHealthRouter } = require('./health/health.controller');

// ── Instantiate shared services ───────────────────────────────────────────────
const authService = new AuthService();
const privacyService = new PrivacyService();
const moderationService = new ModerationService();
const notificationsService = new NotificationsService();

const matchingService = new MatchingService(
  profileRepository,
  privacyService,
  moderationService,
  userRepository,
);

const favoritesService = new FavoritesService(
  undefined,
  undefined,
  undefined,
  privacyService,
  moderationService,
);

const connectionRequestsService = new ConnectionRequestsService(
  undefined,
  undefined,
  undefined,
  notificationsService,
  privacyService,
  moderationService,
);

const searchService = new SearchService(
  profileRepository,
  userRepository,
  privacyService,
  moderationService,
);

const accommodationsService = new AccommodationsService();
const bookingRequestsService = new BookingRequestsService();
const chatService = new ChatService();
const notificationPreferencesService = new NotificationPreferencesService();
const reviewsService = new ReviewsService();
const dashboardService = new DashboardService();

// ── Build the Express app ─────────────────────────────────────────────────────
const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// CORS — open to all origins (same behaviour as app.enableCors() in NestJS)
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(204);
  }
  next();
});

// Serve uploaded files
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

// ── Mount routers ─────────────────────────────────────────────────────────────
app.use('/api/health',               createHealthRouter());
app.use('/api/auth',                 createAuthRouter(authService));
app.use('/api/matching',             createMatchingRouter(matchingService, authService));
app.use('/api/accommodations',       createAccommodationsRouter(accommodationsService, authService));
app.use('/api/favorites',            createFavoritesRouter(favoritesService, authService));
app.use('/api/connection-requests',  createConnectionRequestsRouter(connectionRequestsService, authService));
app.use('/api/booking-requests',     createBookingRequestsRouter(bookingRequestsService, authService));
app.use('/api/chat',                 createChatRouter(chatService, authService));
app.use('/api/notifications',        createNotificationsRouter(notificationsService, notificationPreferencesService, authService));
app.use('/api/reviews',              createReviewsRouter(reviewsService, authService));
app.use('/api/dashboard',            createDashboardRouter(dashboardService, authService));
app.use('/api/search',               createSearchRouter(searchService, authService));
app.use('/api/privacy',              createPrivacyRouter(privacyService, authService));
app.use('/api/moderation',           createModerationRouter(moderationService, authService));

// ── Global error handler ──────────────────────────────────────────────────────
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  const status = err.statusCode || err.status || 500;
  const body = typeof err.getResponse === 'function'
    ? err.getResponse()
    : { statusCode: status, message: err.message || 'Internal Server Error' };
  res.status(status).json(body);
});

// ── Export for Vercel (serverless) ───────────────────────────────────────────
module.exports = app;

// ── Start locally when run directly ──────────────────────────────────────────
if (require.main === module) {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`NestMate backend running on http://0.0.0.0:${PORT}`);
  });
}
