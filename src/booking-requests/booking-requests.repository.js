const requests = new Map();

async function create(request) {
  requests.set(request.id, { ...request });
  return requests.get(request.id);
}

async function findPending(userId, listingId) {
  return [...requests.values()].find(
    (request) =>
      request.senderId === userId &&
      request.listingId === listingId &&
      request.status === 'pending',
  ) || null;
}

async function findById(id) {
  return requests.get(id) || null;
}

async function save(request) {
  requests.set(request.id, { ...request });
  return requests.get(request.id);
}

async function findReceived(ownerId) {
  return [...requests.values()].filter((request) => request.ownerId === ownerId);
}

async function findSent(senderId) {
  return [...requests.values()].filter((request) => request.senderId === senderId);
}

module.exports = {
  create,
  findPending,
  findById,
  save,
  findReceived,
  findSent,
};
