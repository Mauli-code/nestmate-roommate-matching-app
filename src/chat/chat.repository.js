const { isPostgres, query } = require('../database/connection');

// Map conversations table: user1_id / user2_id (lexicographic order enforced by CHECK)
function mapConversation(row) {
  if (!row) return null;
  return {
    id: row.id,
    // Reconstruct participantIds array from the two user columns
    participantIds: [row.user1_id, row.user2_id],
    createdAt: row.created_at ? new Date(row.created_at).toISOString() : undefined,
    updatedAt: row.created_at ? new Date(row.created_at).toISOString() : undefined,
  };
}

function mapMessage(row) {
  if (!row) return null;
  return {
    id: row.id,
    conversationId: row.conversation_id,
    senderId: row.sender_id,
    receiverId: row.receiver_id,
    content: row.content,
    read: Boolean(row.is_read),  // DB column is is_read
    createdAt: row.created_at ? new Date(row.created_at).toISOString() : undefined,
  };
}

// Canonical ordering: smaller id goes into user1_id (schema CHECK user1_id < user2_id)
function orderedPair(a, b) {
  return a < b ? [a, b] : [b, a];
}

const conversations = new Map();
const messages = new Map();

async function findBetween(firstUserId, secondUserId) {
  if (isPostgres()) {
    const [u1, u2] = orderedPair(firstUserId, secondUserId);
    const res = await query(
      `SELECT * FROM conversations WHERE user1_id=$1 AND user2_id=$2 LIMIT 1`,
      [u1, u2],
    );
    return mapConversation(res.rows[0]) || null;
  }
  return [...conversations.values()].find(
    (conversation) =>
      conversation.participantIds.includes(firstUserId) &&
      conversation.participantIds.includes(secondUserId),
  ) || null;
}

async function create(conversation) {
  if (isPostgres()) {
    const participants = Array.isArray(conversation.participantIds)
      ? conversation.participantIds
      : [];
    const [u1, u2] = orderedPair(participants[0], participants[1]);
    const res = await query(
      `INSERT INTO conversations (id, user1_id, user2_id, created_at)
       VALUES ($1, $2, $3, CURRENT_TIMESTAMP)
       ON CONFLICT (user1_id, user2_id) DO UPDATE SET id=EXCLUDED.id
       RETURNING *`,
      [conversation.id, u1, u2],
    );
    return mapConversation(res.rows[0]);
  }
  conversations.set(conversation.id, { ...conversation });
  return conversations.get(conversation.id);
}

async function findById(id) {
  if (isPostgres()) {
    const res = await query(`SELECT * FROM conversations WHERE id=$1 LIMIT 1`, [id]);
    return mapConversation(res.rows[0]) || null;
  }
  return conversations.get(id) || null;
}

async function findForUser(userId) {
  if (isPostgres()) {
    const res = await query(
      `SELECT * FROM conversations WHERE user1_id=$1 OR user2_id=$1 ORDER BY created_at DESC`,
      [userId],
    );
    return res.rows.map(mapConversation);
  }
  return [...conversations.values()].filter((conversation) =>
    conversation.participantIds.includes(userId),
  );
}

async function saveMessage(message) {
  if (isPostgres()) {
    const res = await query(
      `INSERT INTO messages (id, conversation_id, sender_id, receiver_id, content, is_read, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP)
       RETURNING *`,
      [message.id, message.conversationId, message.senderId, message.receiverId, message.content, message.read || false],
    );
    return mapMessage(res.rows[0]);
  }
  messages.set(message.id, { ...message });
  return messages.get(message.id);
}

async function findMessages(conversationId) {
  if (isPostgres()) {
    const res = await query(
      `SELECT * FROM messages WHERE conversation_id=$1 ORDER BY created_at ASC`,
      [conversationId],
    );
    return res.rows.map(mapMessage);
  }
  return [...messages.values()]
    .filter((message) => message.conversationId === conversationId)
    .sort((first, second) => first.createdAt.localeCompare(second.createdAt));
}

async function markRead(conversationId, userId) {
  if (isPostgres()) {
    const res = await query(
      `UPDATE messages SET is_read=true WHERE conversation_id=$1 AND receiver_id=$2 AND is_read=false`,
      [conversationId, userId],
    );
    return res.rowCount;
  }
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
