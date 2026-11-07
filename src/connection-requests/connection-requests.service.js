const crypto = require('node:crypto');
const path = require('node:path');
const {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} = require('@nestjs/common');
const { calculateCompatibility } = require('../matching/compatibility-score');
const userRepository = require('../auth/user-repository');
const profileRepository = require('../matching/profile-repository');
const requestRepository = require('./connection-requests.repository');

class ConnectionRequestsService {
  constructor(
    requests = requestRepository,
    profiles = profileRepository,
    users = userRepository,
  ) {
    this.requests = requests;
    this.profiles = profiles;
    this.users = users;
  }

  async send(senderId, receiverId) {
    this.validateId(senderId, 'senderId');
    this.validateId(receiverId, 'receiverId');
    if (senderId === receiverId) {
      throw new BadRequestException('You cannot send a request to yourself');
    }

    await this.requireProfile(senderId);
    await this.requireProfile(receiverId);
    if (await this.requests.findPending(senderId, receiverId)) {
      throw new ConflictException('A pending connection request already exists');
    }

    const now = new Date().toISOString();
    const request = await this.requests.create({
      id: crypto.randomUUID(),
      senderId,
      receiverId,
      status: 'pending',
      createdAt: now,
      updatedAt: now,
    });
    return { message: 'Connection request sent', request: await this.present(request) };
  }

  async received(userId) {
    return { requests: await this.presentMany(await this.requests.findReceived(userId)) };
  }

  async sent(userId) {
    return { requests: await this.presentMany(await this.requests.findSent(userId)) };
  }

  async accept(userId, requestId) {
    const request = await this.requireOwned(requestId, userId, 'receiverId');
    this.requirePending(request);
    return this.updateStatus(request, 'accepted', 'Connection request accepted');
  }

  async reject(userId, requestId) {
    const request = await this.requireOwned(requestId, userId, 'receiverId');
    this.requirePending(request);
    return this.updateStatus(request, 'rejected', 'Connection request rejected');
  }

  async cancel(userId, requestId) {
    const request = await this.requireOwned(requestId, userId, 'senderId');
    this.requirePending(request);
    return this.updateStatus(request, 'cancelled', 'Connection request cancelled');
  }

  async updateStatus(request, status, message) {
    const updated = await this.requests.save({
      ...request,
      status,
      updatedAt: new Date().toISOString(),
    });
    return { message, request: await this.present(updated) };
  }

  async requireOwned(requestId, userId, ownerField) {
    this.validateId(requestId, 'requestId');
    const request = await this.requests.findById(requestId);
    if (!request || request[ownerField] !== userId) {
      throw new NotFoundException('Connection request was not found');
    }
    return request;
  }

  requirePending(request) {
    if (request.status !== 'pending') {
      throw new ConflictException('Only pending requests can be changed');
    }
  }

  async presentMany(requests) {
    return Promise.all(requests.map((request) => this.present(request)));
  }

  async present(request) {
    const otherUserId = request.senderId;
    const sender = await this.users.findById(request.senderId);
    const receiver = await this.users.findById(request.receiverId);
    const senderProfile = await this.requireProfile(request.senderId);
    const receiverProfile = await this.requireProfile(request.receiverId);
    return {
      id: request.id,
      senderId: request.senderId,
      receiverId: request.receiverId,
      status: request.status,
      createdAt: request.createdAt,
      updatedAt: request.updatedAt,
      sender: this.publicUser(sender, senderProfile),
      receiver: this.publicUser(receiver, receiverProfile),
      compatibility: calculateCompatibility(senderProfile, receiverProfile),
      otherUserId,
    };
  }

  async requireProfile(id) {
    const profile = await this.profiles.findProfile(id);
    if (!profile || typeof profile !== 'object') {
      throw new NotFoundException(`Profile "${id}" was not found`);
    }
    return profile;
  }

  validateId(value, name) {
    if (typeof value !== 'string' || !value.trim()) {
      throw new BadRequestException(`${name} is required`);
    }
  }

  publicUser(user, profile) {
    return {
      id: profile.id,
      fullName: user?.fullName || 'Roommate',
      photoUrl: user?.photoPath
        ? `/uploads/profile-photos/${path.basename(user.photoPath)}`
        : null,
    };
  }
}

Injectable()(ConnectionRequestsService);

module.exports = { ConnectionRequestsService };
