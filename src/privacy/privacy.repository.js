const { isPostgres, query } = require('../database/connection');

// privacy_settings columns:
// user_id, show_profile, show_phone, show_email, allow_requests, show_budget,
// show_lifestyle, allow_connection_requests, updated_at

function mapRow(row) {
  if (!row) return null;
  return {
    userId: row.user_id,
    showProfile: Boolean(row.show_profile),
    showPhone: Boolean(row.show_phone),
    showEmail: Boolean(row.show_email),
    allowRequests: Boolean(row.allow_requests),
    showBudget: Boolean(row.show_budget),
    showLifestyle: Boolean(row.show_lifestyle),
    allowConnectionRequests: Boolean(row.allow_connection_requests),
    updatedAt: row.updated_at ? new Date(row.updated_at).toISOString() : undefined,
  };
}

const settingsByUser = new Map();

async function findByUser(userId) {
  if (isPostgres()) {
    const res = await query(
      `SELECT * FROM privacy_settings WHERE user_id=$1 LIMIT 1`,
      [userId],
    );
    return mapRow(res.rows[0]) || null;
  }
  return settingsByUser.get(userId) || null;
}

async function save(userId, settings) {
  if (isPostgres()) {
    const res = await query(
      `INSERT INTO privacy_settings
         (user_id, show_profile, show_phone, show_email, allow_requests,
          show_budget, show_lifestyle, allow_connection_requests, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, CURRENT_TIMESTAMP)
       ON CONFLICT (user_id) DO UPDATE SET
         show_profile               = EXCLUDED.show_profile,
         show_phone                 = EXCLUDED.show_phone,
         show_email                 = EXCLUDED.show_email,
         allow_requests             = EXCLUDED.allow_requests,
         show_budget                = EXCLUDED.show_budget,
         show_lifestyle             = EXCLUDED.show_lifestyle,
         allow_connection_requests  = EXCLUDED.allow_connection_requests,
         updated_at                 = CURRENT_TIMESTAMP
       RETURNING *`,
      [
        userId,
        settings.showProfile  ?? true,
        settings.showPhone    ?? false,
        settings.showEmail    ?? false,
        // allow_requests mirrors allowConnectionRequests for backward compatibility
        settings.allowConnectionRequests ?? settings.allowRequests ?? true,
        settings.showBudget   ?? true,
        settings.showLifestyle ?? true,
        settings.allowConnectionRequests ?? settings.allowRequests ?? true,
      ],
    );
    return mapRow(res.rows[0]);
  }
  const saved = { userId, ...settings, updatedAt: new Date().toISOString() };
  settingsByUser.set(userId, saved);
  return saved;
}

module.exports = { findByUser, save };
