const settingsByUser = new Map();

async function findByUser(userId) {
  return settingsByUser.get(userId) || null;
}

async function save(userId, settings) {
  const saved = { userId, ...settings, updatedAt: new Date().toISOString() };
  settingsByUser.set(userId, saved);
  return saved;
}

module.exports = { findByUser, save };
