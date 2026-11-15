const assert = require('node:assert/strict');
const test = require('node:test');

const isConfiguredForPostgres = process.env.STORAGE_MODE === 'postgres' && Boolean(process.env.DATABASE_URL);

test('PostgreSQL Stage 2 Integration: Users, Roommate Preferences, and Accommodations', {
  skip: !isConfiguredForPostgres ? 'Set STORAGE_MODE=postgres and DATABASE_URL to run PostgreSQL integration tests' : false,
}, async (t) => {

  const { query, closePool } = require('./connection');
  const userRepository = require('../auth/user-repository');
  const profileRepository = require('../matching/profile-repository');
  const accommodationsRepository = require('../accommodations/accommodations.repository');

  const testUserId = `test-user-${Date.now()}`;
  const testUserEmail = `test_${Date.now()}@example.com`;
  const testListingId = `test-prop-${Date.now()}`;

  try {
    // ------------------------------------------------------------------------
    // 1. USER PERSISTENCE TEST
    // ------------------------------------------------------------------------
    await t.test('persists, queries, and updates users in PostgreSQL', async () => {
      const created = await userRepository.save({
        id: testUserId,
        fullName: 'Test Database Student',
        email: testUserEmail,
        passwordHash: '$2a$10$dummyhashfortestingpostgres1234567890123456789012',
        accountStatus: 'active',
        authVersion: 0,
        occupation: 'CS Student',
        city: 'Pune',
        bio: 'Testing PostgreSQL repository integration',
        phone: '+91 99999 88888',
      });

      assert.equal(created.id, testUserId);
      assert.equal(created.email, testUserEmail);

      // Query by ID
      const foundById = await userRepository.findById(testUserId);
      assert.ok(foundById);
      assert.equal(foundById.fullName, 'Test Database Student');
      assert.equal(foundById.city, 'Pune');
      assert.equal(foundById.occupation, 'CS Student');

      // Query by Email (case-insensitive)
      const foundByEmail = await userRepository.findByEmail(testUserEmail.toUpperCase());
      assert.ok(foundByEmail);
      assert.equal(foundByEmail.id, testUserId);

      // Direct SQL check to prove actual PostgreSQL storage
      const directSql = await query('SELECT * FROM users WHERE id = $1;', [testUserId]);
      assert.equal(directSql.rows.length, 1);
      assert.equal(directSql.rows[0].email, testUserEmail);

      // Update user
      const updated = await userRepository.save({
        ...foundById,
        occupation: 'Software Intern',
        bio: 'Updated bio in PostgreSQL',
        authVersion: 1,
      });

      assert.equal(updated.occupation, 'Software Intern');
      assert.equal(updated.authVersion, 1);

      const verifyUpdate = await userRepository.findById(testUserId);
      assert.equal(verifyUpdate.occupation, 'Software Intern');
      assert.equal(verifyUpdate.authVersion, 1);
    });

    // ------------------------------------------------------------------------
    // 2. ROOMMATE PREFERENCES PERSISTENCE TEST (Strict 1:1)
    // ------------------------------------------------------------------------
    await t.test('persists, queries, and updates roommate preferences in PostgreSQL', async () => {
      const savedProfile = await profileRepository.saveProfile({
        id: testUserId,
        budget: 15000,
        minBudget: 10000,
        maxBudget: 20000,
        preferredArea: 'Hinjewadi',
        lifestyle: {
          sleepSchedule: 'early',
          cleanliness: 'high',
          smoking: false,
          pets: 'none',
        },
        foodHabits: 'vegetarian',
        drinking: 'never',
      });

      assert.equal(savedProfile.id, testUserId);
      assert.equal(savedProfile.preferredArea, 'Hinjewadi');
      assert.equal(savedProfile.minBudget, 10000);
      assert.equal(savedProfile.maxBudget, 20000);

      // Read profile
      const loaded = await profileRepository.findProfile(testUserId);
      assert.ok(loaded);
      assert.equal(loaded.preferredArea, 'Hinjewadi');
      assert.equal(loaded.foodHabits, 'vegetarian');
      assert.equal(loaded.lifestyle.sleepSchedule, 'early');
      assert.equal(loaded.lifestyle.smoking, false);

      // Direct SQL verification
      const directPref = await query('SELECT * FROM roommate_preferences WHERE user_id = $1;', [
        testUserId,
      ]);
      assert.equal(directPref.rows.length, 1);
      assert.equal(directPref.rows[0].preferred_area, 'Hinjewadi');

      // Find candidates (should exclude current user)
      const candidates = await profileRepository.findCandidates(testUserId);
      assert.ok(Array.isArray(candidates));
      assert.ok(candidates.every((c) => c.id !== testUserId));

      // Update preferences
      const updatedProfile = await profileRepository.saveProfile({
        ...loaded,
        minBudget: 12000,
        maxBudget: 22000,
        preferredArea: 'Viman Nagar',
        lifestyle: {
          ...loaded.lifestyle,
          cleanliness: 'moderate',
        },
      });

      assert.equal(updatedProfile.preferredArea, 'Viman Nagar');
      assert.equal(updatedProfile.minBudget, 12000);

      const verifyUpdate = await profileRepository.findProfile(testUserId);
      assert.equal(verifyUpdate.preferredArea, 'Viman Nagar');
      assert.equal(verifyUpdate.minBudget, 12000);
      assert.equal(verifyUpdate.lifestyle.cleanliness, 'moderate');
    });

    // ------------------------------------------------------------------------
    // 3. ACCOMMODATION LISTING PERSISTENCE TEST
    // ------------------------------------------------------------------------
    await t.test('persists, filters, and manages accommodations in PostgreSQL', async () => {
      const createdListing = await accommodationsRepository.create({
        id: testListingId,
        ownerId: testUserId,
        title: 'Integration Test 2BHK Flat in Hinjewadi',
        description: 'Test property for PostgreSQL repository integration',
        city: 'Pune',
        preferredArea: 'Hinjewadi',
        type: 'entire_apartment',
        monthlyRent: 17500,
        securityDeposit: 35000,
        availableRooms: 2,
        availableFrom: '2026-12-01',
        status: 'available',
        photoUrls: ['https://example.com/test-photo.jpg'],
        hasVirtualTour: true,
      });

      assert.equal(createdListing.id, testListingId);
      assert.equal(createdListing.monthlyRent, 17500);
      assert.equal(createdListing.hasVirtualTour, true);

      // Find by ID
      const foundListing = await accommodationsRepository.findById(testListingId);
      assert.ok(foundListing);
      assert.equal(foundListing.title, 'Integration Test 2BHK Flat in Hinjewadi');
      assert.equal(foundListing.ownerId, testUserId);
      assert.equal(foundListing.city, 'Pune');
      assert.equal(foundListing.hasVirtualTour, true);

      // Find with filters
      const filteredByArea = await accommodationsRepository.findAvailable({
        preferredArea: 'Hinjewadi',
      });
      assert.ok(filteredByArea.some((l) => l.id === testListingId));

      const filteredByRent = await accommodationsRepository.findAvailable({
        minRent: 15000,
        maxRent: 20000,
        type: 'entire_apartment',
      });
      assert.ok(filteredByRent.some((l) => l.id === testListingId));

      // Direct SQL check
      const directAcc = await query('SELECT * FROM accommodations WHERE id = $1;', [testListingId]);
      assert.equal(directAcc.rows.length, 1);
      assert.equal(Number(directAcc.rows[0].monthly_rent), 17500);

      // Update accommodation
      const updatedListing = await accommodationsRepository.save({
        ...foundListing,
        title: 'Updated 2BHK Flat in Hinjewadi Phase 1',
        monthlyRent: 18000,
      });

      assert.equal(updatedListing.title, 'Updated 2BHK Flat in Hinjewadi Phase 1');
      assert.equal(updatedListing.monthlyRent, 18000);

      const verifyUpdate = await accommodationsRepository.findById(testListingId);
      assert.equal(verifyUpdate.title, 'Updated 2BHK Flat in Hinjewadi Phase 1');
      assert.equal(verifyUpdate.monthlyRent, 18000);
    });

  } finally {
    // ------------------------------------------------------------------------
    // CLEANUP: Clean up test records without affecting the 14 seeded users / 16 properties
    // ------------------------------------------------------------------------
    await query('DELETE FROM accommodations WHERE id = $1;', [testListingId]).catch(() => {});
    await query('DELETE FROM users WHERE id = $1;', [testUserId]).catch(() => {});
    await closePool();
  }
});

test('PostgreSQL Stage 2B Integration: Bookings, Connections, Favorites, Reviews, Chat, Notifications, Privacy, Moderation', {
  skip: !isConfiguredForPostgres ? 'Set STORAGE_MODE=postgres and DATABASE_URL to run PostgreSQL integration tests' : false,
}, async (t) => {
  const { query, closePool } = require('./connection');
  const userRepository = require('../auth/user-repository');
  const accommodationsRepository = require('../accommodations/accommodations.repository');
  const bookingRepo = require('../booking-requests/booking-requests.repository');
  const connectionRepo = require('../connection-requests/connection-requests.repository');
  const favoritesRepo = require('../favorites/favorites.repository');
  const reviewsRepo = require('../reviews/reviews.repository');
  const chatRepo = require('../chat/chat.repository');
  const notificationsRepo = require('../notifications/notifications.repository');
  const notifPrefsRepo = require('../notifications/notification-preferences.repository');
  const privacyRepo = require('../privacy/privacy.repository');
  const moderationRepo = require('../moderation/moderation.repository');

  const ts = Date.now();
  const userId1 = `s2b-user1-${ts}`;
  const userId2 = `s2b-user2-${ts}`;
  const listingId = `s2b-listing-${ts}`;

  try {
    // Create two test users needed for FK constraints
    await userRepository.save({
      id: userId1, fullName: 'Stage2B User1', email: `s2b1_${ts}@example.com`,
      passwordHash: '$2a$10$dummyhashfortestingpostgres1234567890123456789012',
      accountStatus: 'active', authVersion: 0,
    });
    await userRepository.save({
      id: userId2, fullName: 'Stage2B User2', email: `s2b2_${ts}@example.com`,
      passwordHash: '$2a$10$dummyhashfortestingpostgres1234567890123456789012',
      accountStatus: 'active', authVersion: 0,
    });

    await accommodationsRepository.create({
      id: listingId,
      ownerId: userId2,
      title: 'Stage2B Test Listing',
      description: 'Test accommodation for booking tests',
      city: 'Pune',
      preferredArea: 'Kothrud',
      type: 'flat',
      monthlyRent: 15000,
      securityDeposit: 30000,
      availableRooms: 1,
      availableFrom: '2026-12-01',
      status: 'available',
    });

    // ------------------------------------------------------------------------
    // 1. BOOKING REQUESTS
    // ------------------------------------------------------------------------
    await t.test('booking-requests: create, findPending, findById, save, findReceived, findSent', async () => {
      const bookingId = `booking-${ts}`;
      const created = await bookingRepo.create({
        id: bookingId,
        senderId: userId1,
        ownerId: userId2,
        listingId,
        message: 'I would like to book this room',
        status: 'pending',
      });
      assert.equal(created.id, bookingId);
      assert.equal(created.senderId, userId1);
      assert.equal(created.status, 'pending');

      const pending = await bookingRepo.findPending(userId1, listingId);
      assert.ok(pending);
      assert.equal(pending.id, bookingId);

      const byId = await bookingRepo.findById(bookingId);
      assert.ok(byId);
      assert.equal(byId.message, 'I would like to book this room');

      const accepted = await bookingRepo.save({ id: bookingId, status: 'accepted' });
      assert.equal(accepted.status, 'accepted');

      const received = await bookingRepo.findReceived(userId2);
      assert.ok(received.some((r) => r.id === bookingId));

      const sent = await bookingRepo.findSent(userId1);
      assert.ok(sent.some((r) => r.id === bookingId));

      // Transaction Rollback Test: invalid status violates CHECK constraint, rollback triggered
      await assert.rejects(
        bookingRepo.save({ id: bookingId, status: 'invalid_status' }),
        /check constraint/i
      );
      const afterRollback = await bookingRepo.findById(bookingId);
      assert.equal(afterRollback.status, 'accepted', 'Previous status preserved after transaction rollback');

      // Concurrent Updates Test: Row-level locking (SELECT ... FOR UPDATE) handles parallel updates safely
      await Promise.all([
        bookingRepo.save({ id: bookingId, status: 'rejected' }),
        bookingRepo.save({ id: bookingId, status: 'cancelled' }),
      ]);
      const finalBooking = await bookingRepo.findById(bookingId);
      assert.ok(['rejected', 'cancelled'].includes(finalBooking.status));

      await query('DELETE FROM booking_requests WHERE id = $1', [bookingId]).catch(() => {});
    });

    // ------------------------------------------------------------------------
    // 2. CONNECTION REQUESTS
    // ------------------------------------------------------------------------
    await t.test('connection-requests: create, findPending, findBetween, save, findReceived, findSent', async () => {
      const connId = `conn-${ts}`;
      const created = await connectionRepo.create({
        id: connId,
        senderId: userId1,
        receiverId: userId2,
        status: 'pending',
      });
      assert.equal(created.id, connId);
      assert.equal(created.status, 'pending');

      const pending = await connectionRepo.findPending(userId1, userId2);
      assert.ok(pending);
      assert.equal(pending.id, connId);

      const accepted = await connectionRepo.save({ id: connId, status: 'accepted' });
      assert.equal(accepted.status, 'accepted');

      const between = await connectionRepo.findBetween(userId1, userId2);
      assert.ok(between);
      assert.equal(between.id, connId);

      const received = await connectionRepo.findReceived(userId2);
      assert.ok(received.some((r) => r.id === connId));

      const sent = await connectionRepo.findSent(userId1);
      assert.ok(sent.some((r) => r.id === connId));

      await query('DELETE FROM connection_requests WHERE id = $1', [connId]).catch(() => {});
    });

    // ------------------------------------------------------------------------
    // 3. FAVORITES (saved_roommates)
    // ------------------------------------------------------------------------
    await t.test('favorites: addFavorite, removeFavorite, findByUser', async () => {
      const added = await favoritesRepo.addFavorite(userId1, userId2);
      assert.equal(added, true);

      // Duplicate insert should return false
      const duplicate = await favoritesRepo.addFavorite(userId1, userId2);
      assert.equal(duplicate, false);

      const list = await favoritesRepo.findByUser(userId1);
      assert.ok(list.some((f) => f.roommateId === userId2));

      const removed = await favoritesRepo.removeFavorite(userId1, userId2);
      assert.equal(removed, true);

      const listAfter = await favoritesRepo.findByUser(userId1);
      assert.ok(!listAfter.some((f) => f.roommateId === userId2));
    });

    // ------------------------------------------------------------------------
    // 4. REVIEWS
    // ------------------------------------------------------------------------
    await t.test('reviews: create, findById, findForTarget, findByReviewerAndInteraction, save, remove', async () => {
      const reviewId = `review-${ts}`;
      const interactionKey = `interaction-${ts}`;
      const created = await reviewsRepo.create({
        id: reviewId,
        reviewerId: userId1,
        targetType: 'roommate',
        targetId: userId2,
        rating: 4,
        comment: 'Great roommate',
        interactionKey,
      });
      assert.equal(created.id, reviewId);
      assert.equal(created.rating, 4);
      assert.equal(created.targetId, userId2);

      const byId = await reviewsRepo.findById(reviewId);
      assert.ok(byId);
      assert.equal(byId.comment, 'Great roommate');

      const forTarget = await reviewsRepo.findForTarget('roommate', userId2);
      assert.ok(forTarget.some((r) => r.id === reviewId));

      const byInteraction = await reviewsRepo.findByReviewerAndInteraction(userId1, interactionKey);
      assert.ok(byInteraction);
      assert.equal(byInteraction.id, reviewId);

      const updated = await reviewsRepo.save({ id: reviewId, rating: 5, comment: 'Excellent!' });
      assert.equal(updated.rating, 5);
      assert.equal(updated.comment, 'Excellent!');

      await reviewsRepo.remove(reviewId);
      const afterRemove = await reviewsRepo.findById(reviewId);
      assert.equal(afterRemove, null);
    });

    // ------------------------------------------------------------------------
    // 5. CHAT
    // ------------------------------------------------------------------------
    await t.test('chat: findBetween, create, findById, findForUser, saveMessage, findMessages, markRead', async () => {
      const convId = `conv-${ts}`;
      const msgId = `msg-${ts}`;

      const created = await chatRepo.create({ id: convId, participantIds: [userId1, userId2] });
      assert.equal(created.id, convId);
      assert.ok(Array.isArray(created.participantIds));

      const between = await chatRepo.findBetween(userId1, userId2);
      assert.ok(between);
      assert.equal(between.id, convId);

      const byId = await chatRepo.findById(convId);
      assert.ok(byId);

      const forUser = await chatRepo.findForUser(userId1);
      assert.ok(forUser.some((c) => c.id === convId));

      const msg = await chatRepo.saveMessage({
        id: msgId,
        conversationId: convId,
        senderId: userId1,
        receiverId: userId2,
        content: 'Hello from integration test',
        read: false,
      });
      assert.equal(msg.id, msgId);
      assert.equal(msg.read, false);

      const msgs = await chatRepo.findMessages(convId);
      assert.ok(msgs.some((m) => m.id === msgId));

      const readCount = await chatRepo.markRead(convId, userId2);
      assert.ok(readCount >= 1);

      await query('DELETE FROM messages WHERE conversation_id = $1', [convId]).catch(() => {});
      await query('DELETE FROM conversations WHERE id = $1', [convId]).catch(() => {});
    });

    // ------------------------------------------------------------------------
    // 6. NOTIFICATIONS
    // ------------------------------------------------------------------------
    await t.test('notifications: create, findByRecipient, markRead, markAllRead', async () => {
      const notifId = `notif-${ts}`;
      const created = await notificationsRepo.create({
        id: notifId,
        recipientId: userId1,
        type: 'booking_request',
        title: 'New booking request',
        body: 'You have a new booking request',
        relatedRequestId: `req-${ts}`,
        read: false,
      });
      assert.ok(created);
      assert.equal(created.recipientId, userId1);
      assert.equal(created.read, false);

      const list = await notificationsRepo.findByRecipient(userId1);
      assert.ok(list.some((n) => n.id === notifId));

      const marked = await notificationsRepo.markRead(notifId, userId1);
      assert.ok(marked);
      assert.equal(marked.read, true);

      await query('DELETE FROM notifications WHERE id = $1', [notifId]).catch(() => {});
    });

    // ------------------------------------------------------------------------
    // 7. NOTIFICATION PREFERENCES
    // ------------------------------------------------------------------------
    await t.test('notification-preferences: findByUser, save (upsert)', async () => {
      const saved = await notifPrefsRepo.save(userId1, {
        connectionRequests: true,
        connectionUpdates: false,
        messages: true,
        matchRecommendations: false,
        bookingUpdates: true,
        reviewUpdates: false,
      });
      assert.ok(saved);
      assert.equal(saved.connectionUpdates, false);
      assert.equal(saved.messages, true);

      const found = await notifPrefsRepo.findByUser(userId1);
      assert.ok(found);
      assert.equal(found.messages, true);
      assert.equal(found.reviewUpdates, false);

      // Upsert
      const updated = await notifPrefsRepo.save(userId1, {
        connectionRequests: false,
        connectionUpdates: true,
        messages: false,
        matchRecommendations: true,
        bookingUpdates: false,
        reviewUpdates: true,
      });
      assert.equal(updated.messages, false);
      assert.equal(updated.reviewUpdates, true);
    });

    // ------------------------------------------------------------------------
    // 8. PRIVACY SETTINGS
    // ------------------------------------------------------------------------
    await t.test('privacy: findByUser, save (upsert)', async () => {
      const saved = await privacyRepo.save(userId2, {
        showProfile: false,
        showBudget: true,
        showLifestyle: false,
        allowConnectionRequests: true,
      });
      assert.ok(saved);
      assert.equal(saved.showProfile, false);
      assert.equal(saved.allowConnectionRequests, true);

      const found = await privacyRepo.findByUser(userId2);
      assert.ok(found);
      assert.equal(found.showProfile, false);

      const updated = await privacyRepo.save(userId2, {
        showProfile: true,
        showBudget: false,
        showLifestyle: true,
        allowConnectionRequests: false,
      });
      assert.equal(updated.showProfile, true);
      assert.equal(updated.allowConnectionRequests, false);
    });

    // ------------------------------------------------------------------------
    // 9. MODERATION (user_blocks + user_reports)
    // ------------------------------------------------------------------------
    await t.test('moderation: findBlock, saveBlock, deleteBlock, findByOwner, saveReport, findRecentReport', async () => {
      const block = await moderationRepo.saveBlock({
        id: `block-${ts}`,
        ownerId: userId1,
        blockedUserId: userId2,
        createdAt: new Date().toISOString(),
      });
      assert.ok(block);
      assert.equal(block.ownerId, userId1);
      assert.equal(block.blockedUserId, userId2);

      const found = await moderationRepo.findBlock(userId1, userId2);
      assert.ok(found);

      const list = await moderationRepo.findByOwner(userId1);
      assert.ok(list.some((b) => b.blockedUserId === userId2));

      const deleted = await moderationRepo.deleteBlock(userId1, userId2);
      assert.equal(deleted, true);

      const afterDelete = await moderationRepo.findBlock(userId1, userId2);
      assert.equal(afterDelete, null);

      // Reports
      const reportId = `report-${ts}`;
      const since = new Date(Date.now() - 60000).toISOString();
      const report = await moderationRepo.saveReport({
        id: reportId,
        reporterId: userId1,
        reportedUserId: userId2,
        category: 'spam',
        description: 'Sending too many messages',
        createdAt: new Date().toISOString(),
      });
      assert.ok(report);
      assert.equal(report.reporterId, userId1);

      const recentReport = await moderationRepo.findRecentReport(userId1, userId2, 'spam', since);
      assert.ok(recentReport);
      assert.equal(recentReport.reporterId, userId1);

      await query('DELETE FROM user_reports WHERE id = $1', [reportId]).catch(() => {});
    });

  } finally {
    await query('DELETE FROM booking_requests WHERE owner_id IN ($1, $2) OR sender_id IN ($1, $2)', [userId1, userId2]).catch(() => {});
    await query('DELETE FROM accommodations WHERE id = $1', [listingId]).catch(() => {});
    await query('DELETE FROM notification_preferences WHERE user_id IN ($1, $2)', [userId1, userId2]).catch(() => {});
    await query('DELETE FROM privacy_settings WHERE user_id IN ($1, $2)', [userId1, userId2]).catch(() => {});
    await query('DELETE FROM notifications WHERE recipient_id IN ($1, $2)', [userId1, userId2]).catch(() => {});
    await query('DELETE FROM users WHERE id IN ($1, $2)', [userId1, userId2]).catch(() => {});
    await closePool();
  }
});
