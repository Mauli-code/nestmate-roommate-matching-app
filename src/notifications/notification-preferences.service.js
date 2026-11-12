const { BadRequestException, Injectable } = require('@nestjs/common');
const repository = require('./notification-preferences.repository');

const DEFAULT_PREFERENCES = Object.freeze({
  connectionRequests: true,
  connectionUpdates: true,
  messages: true,
  matchRecommendations: true,
  bookingUpdates: true,
  reviewUpdates: true,
});

class NotificationPreferencesService {
  constructor(preferences = repository) {
    this.preferences = preferences;
  }

  async get(userId) {
    this.validateId(userId);
    const saved = await this.preferences.findByUser(userId);
    return { preferences: { ...DEFAULT_PREFERENCES, ...(saved || {}) } };
  }

  async update(userId, body) {
    this.validateId(userId);
    const values = this.validate(body);
    const saved = await this.preferences.save(userId, values);
    return {
      message: 'Notification preferences saved',
      preferences: { ...DEFAULT_PREFERENCES, ...saved },
    };
  }

  validate(body) {
    if (!body || typeof body !== 'object' || Array.isArray(body)) {
      throw new BadRequestException('Notification preferences are required');
    }
    const values = {};
    for (const field of Object.keys(DEFAULT_PREFERENCES)) {
      if (body[field] !== undefined && typeof body[field] !== 'boolean') {
        throw new BadRequestException(`${field} must be true or false`);
      }
      values[field] = body[field] === undefined
        ? DEFAULT_PREFERENCES[field]
        : body[field];
    }
    return values;
  }

  validateId(userId) {
    if (typeof userId !== 'string' || !userId.trim()) {
      throw new BadRequestException('userId is required');
    }
  }
}

Injectable()(NotificationPreferencesService);

module.exports = { NotificationPreferencesService, DEFAULT_PREFERENCES };
