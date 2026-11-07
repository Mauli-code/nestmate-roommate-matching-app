const listings = new Map();

async function create(listing) {
  listings.set(listing.id, { ...listing });
  return listings.get(listing.id);
}

async function findAvailable(filters = {}) {
  return [...listings.values()].filter((listing) => {
    if (listing.status !== 'available') return false;
    if (filters.preferredArea &&
        listing.preferredArea.toLowerCase() !== filters.preferredArea.toLowerCase()) return false;
    if (filters.type && listing.type !== filters.type) return false;
    if (filters.minRent !== null && listing.monthlyRent < filters.minRent) return false;
    if (filters.maxRent !== null && listing.monthlyRent > filters.maxRent) return false;
    return true;
  });
}

async function findById(id) {
  return listings.get(id) || null;
}

async function save(listing) {
  listings.set(listing.id, { ...listing });
  return listings.get(listing.id);
}

async function remove(id) {
  return listings.delete(id);
}

module.exports = { create, findAvailable, findById, save, remove };
