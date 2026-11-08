const preferencesByUser = new Map();

async function findByUser(userId) {
  return preferencesByUser.get(userId) || null;
}

async function save(userId, preferences) {
  const saved = { userId, ...preferences, updatedAt: new Date().toISOString() };
  preferencesByUser.set(userId, saved);
  return saved;
}

module.exports = { findByUser, save };
