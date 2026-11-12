const test = require('node:test');
const assert = require('node:assert/strict');
const { ForbiddenException, BadRequestException } = require('@nestjs/common');
const { ChatService } = require('./chat.service');

function setup() {
  const users = new Map([
    ['alice', { id: 'alice', fullName: 'Alice' }],
    ['bob', { id: 'bob', fullName: 'Bob' }],
    ['mallory', { id: 'mallory', fullName: 'Mallory' }],
  ]);
  const conversations = new Map();
  const messages = new Map();
  const chats = {
    findBetween: async (a, b) => [...conversations.values()].find((item) =>
      item.participantIds.includes(a) && item.participantIds.includes(b)) || null,
    create: async (item) => { conversations.set(item.id, { ...item }); return item; },
    findById: async (id) => conversations.get(id) || null,
    findForUser: async (id) => [...conversations.values()].filter((item) => item.participantIds.includes(id)),
    saveMessage: async (item) => { messages.set(item.id, { ...item }); return item; },
    findMessages: async (id) => [...messages.values()].filter((item) => item.conversationId === id)
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt)),
    markRead: async (id, userId) => {
      let count = 0;
      for (const [messageId, message] of messages) {
        if (message.conversationId === id && message.receiverId === userId && !message.read) {
          messages.set(messageId, { ...message, read: true });
          count += 1;
        }
      }
      return count;
    },
  };
  const connections = {
    findBetween: async () => ({ status: 'accepted' }),
  };
  const bookings = {
    findSent: async () => [],
    findReceived: async () => [],
  };
  const notifications = { create: async (recipientId, data) => ({ recipientId, data }) };
  return new ChatService(chats, connections, bookings, { findById: async (id) => users.get(id) || null }, notifications);
}

test('creates a conversation, sends messages, retrieves them, and marks them read', async () => {
  const service = setup();
  const { conversation } = await service.getOrCreateConversation('alice', 'bob');
  const sent = await service.sendMessage('alice', conversation.id, { content: 'Hello Bob' });
  assert.equal(sent.message.isMine, true);
  const result = await service.messages('bob', conversation.id);
  assert.equal(result.messages[0].content, 'Hello Bob');
  assert.equal(result.messages[0].read, false);
  assert.equal((await service.markRead('bob', conversation.id)).markedCount, 1);
  assert.equal((await service.messages('bob', conversation.id)).messages[0].read, true);
});

test('rejects empty messages and non-participants', async () => {
  const service = setup();
  const { conversation } = await service.getOrCreateConversation('alice', 'bob');
  await assert.rejects(() => service.sendMessage('alice', conversation.id, { content: ' ' }), BadRequestException);
  await assert.rejects(() => service.messages('mallory', conversation.id), ForbiddenException);
});

test('rejects conversation creation without an accepted relationship', async () => {
  const service = setup();
  service.connections.findBetween = async () => null;
  await assert.rejects(() => service.getOrCreateConversation('alice', 'mallory'), ForbiddenException);
});

test('blocks messaging in either direction after a user is blocked', async () => {
  const service = setup();
  service.moderation = {
    isBlockedBetween: async () => true,
  };
  await assert.rejects(
    () => service.getOrCreateConversation('alice', 'bob'),
    ForbiddenException,
  );
});
