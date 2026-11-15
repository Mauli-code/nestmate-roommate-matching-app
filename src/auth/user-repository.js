const { readStore, writeStore } = require('../store-file');
const { isPostgres, query } = require('../database/connection');

// In-memory cache & fallback for STORAGE_MODE=memory
const usersById = new Map();
const userIdsByEmail = new Map();
for (const user of readStore().users || []) {
  usersById.set(user.id, user);
  if (user.email) {
    userIdsByEmail.set(user.email.trim().toLowerCase(), user.id);
  }
}

function mapUserRow(row) {
  if (!row) return null;
  return {
    id: row.id,
    fullName: row.full_name,
    email: row.email,
    passwordHash: row.password_hash,
    accountStatus: row.account_status,
    authVersion: Number(row.auth_version || 0),
    photoPath: row.photo_path || null,
    occupation: row.occupation || '',
    city: row.city || '',
    bio: row.bio || '',
    phone: row.phone || '',
    createdAt: row.created_at ? new Date(row.created_at).toISOString() : undefined,
    updatedAt: row.updated_at ? new Date(row.updated_at).toISOString() : undefined,
  };
}

async function findByEmail(email) {
  if (isPostgres()) {
    const res = await query(
      'SELECT * FROM users WHERE LOWER(email) = LOWER($1) LIMIT 1;',
      [email ? email.trim() : '']
    );
    return mapUserRow(res.rows[0]);
  }

  const normalized = email ? email.trim().toLowerCase() : '';
  const userId = userIdsByEmail.get(normalized);
  return userId ? usersById.get(userId) || null : null;
}

async function findById(id) {
  if (isPostgres()) {
    const res = await query('SELECT * FROM users WHERE id = $1 LIMIT 1;', [id]);
    return mapUserRow(res.rows[0]);
  }

  return usersById.get(id) || null;
}

async function save(user) {
  if (isPostgres()) {
    const res = await query(
      `
      INSERT INTO users (
        id, full_name, email, password_hash, account_status, auth_version,
        photo_path, occupation, city, bio, phone, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, COALESCE($12, CURRENT_TIMESTAMP), CURRENT_TIMESTAMP)
      ON CONFLICT (id) DO UPDATE SET
        full_name = EXCLUDED.full_name,
        email = EXCLUDED.email,
        password_hash = EXCLUDED.password_hash,
        account_status = EXCLUDED.account_status,
        auth_version = EXCLUDED.auth_version,
        photo_path = EXCLUDED.photo_path,
        occupation = EXCLUDED.occupation,
        city = EXCLUDED.city,
        bio = EXCLUDED.bio,
        phone = EXCLUDED.phone,
        updated_at = CURRENT_TIMESTAMP
      RETURNING *;
    `,
      [
        user.id,
        user.fullName,
        user.email,
        user.passwordHash,
        user.accountStatus || 'active',
        user.authVersion || 0,
        user.photoPath || null,
        user.occupation || '',
        user.city || '',
        user.bio || '',
        user.phone || '',
        user.createdAt || null,
      ]
    );
    return mapUserRow(res.rows[0]);
  }

  usersById.set(user.id, { ...user });
  if (user.email) {
    userIdsByEmail.set(user.email.trim().toLowerCase(), user.id);
  }
  writeStore({
    users: [...usersById.values()],
    profiles: readStore().profiles || [],
  });
  return usersById.get(user.id);
}

function isActive(user) {
  return user?.accountStatus === undefined || user.accountStatus === 'active';
}

module.exports = { findByEmail, findById, save, isActive, mapUserRow };
