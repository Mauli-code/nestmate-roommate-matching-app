const { isPostgres, query } = require('../database/connection');

// notification_preferences columns:
// user_id, new_requests, messages, status_updates, email_alerts, push_notifications,
// connection_requests, connection_updates, booking_updates, review_updates,
// match_recommendations, updated_at

function mapRow(row) {
  if (!row) return null;
  return {
    userId: row.user_id,
    connectionRequests: Boolean(row.connection_requests),
    connectionUpdates: Boolean(row.connection_updates),
    messages: Boolean(row.messages),
    matchRecommendations: Boolean(row.match_recommendations),
    bookingUpdates: Boolean(row.booking_updates),
    reviewUpdates: Boolean(row.review_updates),
    // legacy fields kept for compatibility
    newRequests: Boolean(row.new_requests),
    statusUpdates: Boolean(row.status_updates),
    emailAlerts: Boolean(row.email_alerts),
    pushNotifications: Boolean(row.push_notifications),
    updatedAt: row.updated_at ? new Date(row.updated_at).toISOString() : undefined,
  };
}

const preferencesByUser = new Map();

async function findByUser(userId) {
  if (isPostgres()) {
    const res = await query(
      `SELECT * FROM notification_preferences WHERE user_id=$1 LIMIT 1`,
      [userId],
    );
    return mapRow(res.rows[0]) || null;
  }
  return preferencesByUser.get(userId) || null;
}

async function save(userId, preferences) {
  if (isPostgres()) {
    const res = await query(
      `INSERT INTO notification_preferences
         (user_id, new_requests, messages, status_updates, email_alerts,
          push_notifications, connection_requests, connection_updates,
          booking_updates, review_updates, match_recommendations, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, CURRENT_TIMESTAMP)
       ON CONFLICT (user_id) DO UPDATE SET
         new_requests          = EXCLUDED.new_requests,
         messages              = EXCLUDED.messages,
         status_updates        = EXCLUDED.status_updates,
         email_alerts          = EXCLUDED.email_alerts,
         push_notifications    = EXCLUDED.push_notifications,
         connection_requests   = EXCLUDED.connection_requests,
         connection_updates    = EXCLUDED.connection_updates,
         booking_updates       = EXCLUDED.booking_updates,
         review_updates        = EXCLUDED.review_updates,
         match_recommendations = EXCLUDED.match_recommendations,
         updated_at            = CURRENT_TIMESTAMP
       RETURNING *`,
      [
        userId,
        preferences.newRequests         ?? preferences.connectionRequests ?? true,
        preferences.messages            ?? true,
        preferences.statusUpdates       ?? preferences.connectionUpdates ?? true,
        preferences.emailAlerts         ?? true,
        preferences.pushNotifications   ?? true,
        preferences.connectionRequests  ?? true,
        preferences.connectionUpdates   ?? true,
        preferences.bookingUpdates      ?? true,
        preferences.reviewUpdates       ?? true,
        preferences.matchRecommendations ?? true,
      ],
    );
    return mapRow(res.rows[0]);
  }
  const saved = { userId, ...preferences, updatedAt: new Date().toISOString() };
  preferencesByUser.set(userId, saved);
  return saved;
}

module.exports = { findByUser, save };
