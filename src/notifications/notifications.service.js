const crypto = require('node:crypto');
const {
  BadRequestException,
  NotFoundException,
  Injectable,
} = require('@nestjs/common');
const notificationRepository = require('./notifications.repository');
const preferenceRepository = require('./notification-preferences.repository');
const { DEFAULT_PREFERENCES } = require('./notification-preferences.service');

class NotificationsService {
  constructor(repository = notificationRepository, preferences = preferenceRepository) {
    this.repository = repository;
    this.preferences = preferences;
  }

  async create(recipientId, data) {
    const preferences = {
      ...DEFAULT_PREFERENCES,
      ...(await this.preferences.findByUser(recipientId) || {}),
    };
    const preferenceKey = this.preferenceKey(data.type);
    if (preferenceKey && preferences[preferenceKey] === false) {
      return null;
    }
    return this.repository.create({
      id: crypto.randomUUID(),
      recipientId,
      title: data.title,
      message: data.message,
      type: data.type,
      read: false,
      relatedRequestId: data.relatedRequestId || null,
      relatedUserId: data.relatedUserId || null,
      createdAt: new Date().toISOString(),
    });
  }

  preferenceKey(type) {
    if (type === 'connection-request-received') return 'connectionRequests';
    if (type === 'connection-request-accepted' || type === 'connection-request-rejected') {
      return 'connectionUpdates';
    }
    if (type === 'chat-message-received') return 'messages';
    if (type?.startsWith('booking-request-')) return 'bookingUpdates';
    if (type?.startsWith('review-')) return 'reviewUpdates';
    if (type?.startsWith('match-')) return 'matchRecommendations';
    return null;
  }

  async list(recipientId) {
    this.validateId(recipientId, 'recipientId');
    const items = await this.repository.findByRecipient(recipientId);
    return {
      notifications: items,
      unreadCount: items.filter((notification) => !notification.read).length,
    };
  }

  async markRead(recipientId, notificationId) {
    this.validateId(recipientId, 'recipientId');
    this.validateId(notificationId, 'notificationId');
    const notification = await this.repository.markRead(notificationId, recipientId);
    if (!notification) throw new NotFoundException('Notification was not found');
    return { notification, message: 'Notification marked as read' };
  }

  async markAllRead(recipientId) {
    this.validateId(recipientId, 'recipientId');
    const count = await this.repository.markAllRead(recipientId);
    return { markedCount: count, message: 'Notifications marked as read' };
  }

  validateId(value, name) {
    if (typeof value !== 'string' || !value.trim()) {
      throw new BadRequestException(`${name} is required`);
    }
  }
}

Injectable()(NotificationsService);

module.exports = { NotificationsService };
