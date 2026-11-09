const usersById = new Map();
const userIdsByEmail = new Map();

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
  return usersById.get(user.id);
}

function isActive(user) {
  return user?.accountStatus === undefined || user.accountStatus === 'active';
}

module.exports = { findByEmail, findById, save, isActive };
