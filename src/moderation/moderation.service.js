const crypto = require('node:crypto');
const {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} = require('@nestjs/common');
const userRepository = require('../auth/user-repository');
const repository = require('./moderation.repository');

const REPORT_CATEGORIES = Object.freeze([
  'fake-profile',
  'spam',
  'inappropriate-behaviour',
  'harassment-or-threats',
  'suspicious-activity',
  'other',
]);

class ModerationService {
  constructor(blocks = repository, users = userRepository) {
    this.blocks = blocks;
    this.users = users;
  }

  async block(ownerId, blockedUserId) {
    this.validateDifferentUsers(ownerId, blockedUserId);
    await this.requireUser(blockedUserId);
    if (await this.blocks.findBlock(ownerId, blockedUserId)) {
      throw new ConflictException('This user is already blocked');
    }
    const block = await this.blocks.saveBlock({
      id: crypto.randomUUID(),
      ownerId,
      blockedUserId,
      createdAt: new Date().toISOString(),
    });
    return { message: 'User blocked', block: await this.presentBlock(block) };
  }

  async unblock(ownerId, blockedUserId) {
    this.validateDifferentUsers(ownerId, blockedUserId);
    if (!(await this.blocks.deleteBlock(ownerId, blockedUserId))) {
      throw new NotFoundException('Blocked user was not found');
    }
    return { message: 'User unblocked', blockedUserId };
  }

  async listBlocked(ownerId) {
    const blocked = await this.blocks.findByOwner(ownerId);
    return { blockedUsers: await Promise.all(blocked.map((item) => this.presentBlock(item))) };
  }

  async isBlockedBetween(firstUserId, secondUserId) {
    return Boolean(
      await this.blocks.findBlock(firstUserId, secondUserId) ||
      await this.blocks.findBlock(secondUserId, firstUserId),
    );
  }

  async report(reporterId, reportedUserId, body) {
    this.validateDifferentUsers(reporterId, reportedUserId);
    await this.requireUser(reportedUserId);
    if (!body || typeof body !== 'object' || Array.isArray(body)) {
      throw new BadRequestException('Report data is required');
    }
    if (!REPORT_CATEGORIES.includes(body.category)) {
      throw new BadRequestException(`category must be one of: ${REPORT_CATEGORIES.join(', ')}`);
    }
    if (body.description !== undefined &&
        (typeof body.description !== 'string' || body.description.trim().length > 1000)) {
      throw new BadRequestException('description must be 1000 characters or fewer');
    }

    const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    if (await this.blocks.findRecentReport(
      reporterId,
      reportedUserId,
      body.category,
      since,
    )) {
      throw new ConflictException('You recently submitted this report');
    }

    await this.blocks.saveReport({
      id: crypto.randomUUID(),
      reporterId,
      reportedUserId,
      category: body.category,
      description: body.description?.trim() || '',
      createdAt: new Date().toISOString(),
    });
    return { message: 'Report submitted' };
  }

  async presentBlock(block) {
    const user = await this.users.findById(block.blockedUserId);
    return {
      id: block.id,
      userId: block.blockedUserId,
      fullName: user?.fullName || 'User',
      createdAt: block.createdAt,
    };
  }

  async requireUser(userId) {
    if (!(await this.users.findById(userId))) {
      throw new NotFoundException('User was not found');
    }
  }

  validateDifferentUsers(ownerId, otherUserId) {
    if (typeof ownerId !== 'string' || !ownerId.trim()) {
      throw new BadRequestException('userId is required');
    }
    if (typeof otherUserId !== 'string' || !otherUserId.trim()) {
      throw new BadRequestException('other user id is required');
    }
    if (ownerId === otherUserId) {
      throw new BadRequestException('You cannot block or report yourself');
    }
  }
}

Injectable()(ModerationService);

module.exports = { ModerationService, REPORT_CATEGORIES };
