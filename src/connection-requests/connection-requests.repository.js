const requests = new Map();

async function create(request) {
  requests.set(request.id, { ...request });
  return requests.get(request.id);
}

async function findPending(senderId, receiverId) {
  return [...requests.values()].find(
    (request) =>
      request.senderId === senderId &&
      request.receiverId === receiverId &&
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

async function findReceived(userId) {
  return [...requests.values()].filter((request) => request.receiverId === userId);
}

async function findSent(userId) {
  return [...requests.values()].filter((request) => request.senderId === userId);
}

module.exports = {
  create,
  findPending,
  findById,
  save,
  findReceived,
  findSent,
};
