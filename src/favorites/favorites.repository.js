const { isPostgres, query } = require('../database/connection');

function mapRow(row) {
  return { userId: row.user_id, roommateId: row.roommate_id, createdAt: new Date(row.created_at).toISOString() };
}

const favoritesByUser = new Map();

async function addFavorite(userId, roommateId) {
  if (isPostgres()) {
    const res = await query(
      `INSERT INTO saved_roommates (user_id, roommate_id, created_at)
       VALUES ($1, $2, CURRENT_TIMESTAMP)
       ON CONFLICT (user_id, roommate_id) DO NOTHING`,
      [userId, roommateId],
    );
    return res.rowCount > 0;
  }
  const favorites = favoritesByUser.get(userId) || new Map();
  if (favorites.has(roommateId)) {
    return false;
  }
  favorites.set(roommateId, {
    userId,
    roommateId,
    createdAt: new Date().toISOString(),
  });
  favoritesByUser.set(userId, favorites);
  return true;
}

async function removeFavorite(userId, roommateId) {
  if (isPostgres()) {
    const res = await query(
      `DELETE FROM saved_roommates WHERE user_id=$1 AND roommate_id=$2`,
      [userId, roommateId],
    );
    return res.rowCount > 0;
  }
  const favorites = favoritesByUser.get(userId);
  if (!favorites) {
    return false;
  }
  const removed = favorites.delete(roommateId);
  if (favorites.size === 0) {
    favoritesByUser.delete(userId);
  }
  return removed;
}

async function findByUser(userId) {
  if (isPostgres()) {
    const res = await query(
      `SELECT * FROM saved_roommates WHERE user_id=$1 ORDER BY created_at DESC`,
      [userId],
    );
    return res.rows.map(mapRow);
  }
  return [...(favoritesByUser.get(userId)?.values() || [])];
}

module.exports = {
  addFavorite,
  removeFavorite,
  findByUser,
};
