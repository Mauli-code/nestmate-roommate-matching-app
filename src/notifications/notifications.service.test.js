const assert = require('node:assert/strict');
const test = require('node:test');
const { NotFoundException } = require('@nestjs/common');
const { NotificationsService } = require('./notifications.service');

function createService() {
  const items = new Map();
  return new NotificationsService({
    create: async (notification) => {
      const duplicate = [...items.values()].find(
        (item) =>
          item.recipientId === notification.recipientId &&
          item.type === notification.type &&
          item.relatedRequestId === notification.relatedRequestId,
      );
      if (duplicate) return duplicate;
      items.set(notification.id, notification);
      return notification;
    },
    findByRecipient: async (recipientId) =>
      [...items.values()].filter((item) => item.recipientId === recipientId),
    markRead: async (id, recipientId) => {
      const item = items.get(id);
      if (!item || item.recipientId !== recipientId) return null;
      item.read = true;
      return item;
    },
    markAllRead: async (recipientId) => {
      let count = 0;
      for (const item of items.values()) {
        if (item.recipientId === recipientId && !item.read) {
          item.read = true;
          count += 1;
        }
      }
      return count;
    },
  });
}

test('creates and retrieves unread notifications', async () => {
  const service = createService();
  const first = await service.create('user-1', {
    title: 'New request',
    message: 'A roommate sent a request.',
    type: 'connection-request-received',
    relatedRequestId: 'request-1',
  });
  await service.create('user-1', {
    title: 'New request',
    message: 'A roommate sent a request.',
    type: 'connection-request-received',
    relatedRequestId: 'request-1',
  });

  const result = await service.list('user-1');
  assert.equal(result.notifications.length, 1);
  assert.equal(result.unreadCount, 1);
  assert.equal(first.read, false);
});

test('marks one and all notifications as read', async () => {
  const service = createService();
  const notification = await service.create('user-1', {
    title: 'Request',
    message: 'Read me',
    type: 'connection-request-received',
    relatedRequestId: 'request-2',
  });
  assert.equal((await service.markRead('user-1', notification.id)).notification.read, true);
  await service.create('user-1', {
    title: 'Accepted',
    message: 'A request was accepted.',
    type: 'connection-request-accepted',
    relatedRequestId: 'request-3',
  });
  assert.equal((await service.markAllRead('user-1')).markedCount, 1);
  assert.equal((await service.list('user-1')).unreadCount, 0);
});

test('does not allow another user to mark a notification as read', async () => {
  const service = createService();
  const notification = await service.create('user-1', {
    title: 'Private',
    message: 'Private notification',
    type: 'connection-request-received',
    relatedRequestId: 'request-4',
  });
  await assert.rejects(
    () => service.markRead('user-2', notification.id),
    (error) => error instanceof NotFoundException,
  );
});
