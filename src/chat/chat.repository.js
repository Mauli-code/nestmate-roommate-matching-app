const conversations = new Map();
const messages = new Map();

async function findBetween(firstUserId, secondUserId) {
  return [...conversations.values()].find(
    (conversation) =>
      conversation.participantIds.includes(firstUserId) &&
      conversation.participantIds.includes(secondUserId),
  ) || null;
}

async function create(conversation) {
  conversations.set(conversation.id, { ...conversation });
  return conversations.get(conversation.id);
}

async function findById(id) {
  return conversations.get(id) || null;
}

async function findForUser(userId) {
  return [...conversations.values()].filter((conversation) =>
    conversation.participantIds.includes(userId),
  );
}

async function saveMessage(message) {
  messages.set(message.id, { ...message });
  return messages.get(message.id);
}

async function findMessages(conversationId) {
  return [...messages.values()]
    .filter((message) => message.conversationId === conversationId)
    .sort((first, second) => first.createdAt.localeCompare(second.createdAt));
}

async function markRead(conversationId, userId) {
  let count = 0;
  for (const [id, message] of messages.entries()) {
    if (message.conversationId === conversationId &&
        message.receiverId === userId &&
        !message.read) {
      messages.set(id, { ...message, read: true });
      count += 1;
    }
  }
  return count;
}

module.exports = {
  findBetween,
  create,
  findById,
  findForUser,
  saveMessage,
  findMessages,
  markRead,
};
