const { BadRequestException, Injectable } = require('@nestjs/common');
const repository = require('./privacy.repository');

const DEFAULT_PRIVACY = Object.freeze({
  showProfile: true,
  showBudget: true,
  showLifestyle: true,
  allowConnectionRequests: true,
});

class PrivacyService {
  constructor(settings = repository) {
    this.settings = settings;
  }

  async get(userId) {
    this.validateId(userId);
    return { privacy: await this.forUser(userId) };
  }

  async update(userId, body) {
    this.validateId(userId);
    if (!body || typeof body !== 'object' || Array.isArray(body)) {
      throw new BadRequestException('Privacy settings are required');
    }
    const values = {};
    for (const field of Object.keys(DEFAULT_PRIVACY)) {
      if (body[field] !== undefined && typeof body[field] !== 'boolean') {
        throw new BadRequestException(`${field} must be true or false`);
      }
      values[field] = body[field] === undefined ? DEFAULT_PRIVACY[field] : body[field];
    }
    await this.settings.save(userId, values);
    return {
      message: 'Privacy settings saved',
      privacy: await this.forUser(userId),
    };
  }

  async forUser(userId) {
    const saved = await this.settings.findByUser(userId);
    return Object.keys(DEFAULT_PRIVACY).reduce((privacy, field) => {
      privacy[field] = saved?.[field] === undefined ? DEFAULT_PRIVACY[field] : saved[field];
      return privacy;
    }, {});
  }

  validateId(userId) {
    if (typeof userId !== 'string' || !userId.trim()) {
      throw new BadRequestException('userId is required');
    }
  }
}

Injectable()(PrivacyService);

module.exports = { PrivacyService, DEFAULT_PRIVACY };
