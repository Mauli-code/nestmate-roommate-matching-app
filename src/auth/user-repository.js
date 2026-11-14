const { readStore, writeStore } = require('../store-file');

const usersById = new Map();
const userIdsByEmail = new Map();
for (const user of readStore().users || []) {
  usersById.set(user.id, user);
  userIdsByEmail.set(user.email, user.id);
}

async function findByEmail(email) {
  const userId = userIdsByEmail.get(email);
  return userId ? usersById.get(userId) || null : null;
}

async function findById(id) {
  return usersById.get(id) || null;
}

async function save(user) {
  usersById.set(user.id, { ...user });
  userIdsByEmail.set(user.email, user.id);
  writeStore({
    users: [...usersById.values()],
    profiles: readStore().profiles || [],
  });
  return usersById.get(user.id);
}

function isActive(user) {
  return user?.accountStatus === undefined || user.accountStatus === 'active';
}

module.exports = { findByEmail, findById, save, isActive };
