const crypto = require('node:crypto');
const {
  BadRequestException,
  NotFoundException,
  Injectable,
} = require('@nestjs/common');
const notificationRepository = require('./notifications.repository');

class NotificationsService {
  constructor(repository = notificationRepository) {
    this.repository = repository;
  }

  async create(recipientId, data) {
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
