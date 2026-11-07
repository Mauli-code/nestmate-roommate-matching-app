const favoritesByUser = new Map();

async function addFavorite(userId, roommateId) {
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
  return [...(favoritesByUser.get(userId)?.values() || [])];
}

module.exports = {
  addFavorite,
  removeFavorite,
  findByUser,
};
