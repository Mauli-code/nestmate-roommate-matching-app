const crypto = require('node:crypto');
const {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} = require('@nestjs/common');
const userRepository = require('../auth/user-repository');
const accommodationRepository = require('../accommodations/accommodations.repository');
const requestRepository = require('./booking-requests.repository');

class BookingRequestsService {
  constructor(
    requests = requestRepository,
    accommodations = accommodationRepository,
    users = userRepository,
    notifications,
  ) {
    this.requests = requests;
    this.accommodations = accommodations;
    this.users = users;
    this.notifications = notifications;
  }

  async send(senderId, listingId, body) {
    this.validateId(senderId, 'senderId');
    this.validateId(listingId, 'listingId');
    const listing = await this.requireListing(listingId);

    if (listing.ownerId === senderId) {
      throw new BadRequestException('You cannot book your own accommodation');
    }
    if (listing.status !== 'available') {
      throw new ConflictException('This accommodation is not available');
    }
    if (await this.requests.findPending(senderId, listingId)) {
      throw new ConflictException('A pending booking request already exists');
    }

    const data = this.validateBooking(body);
    const now = new Date().toISOString();
    const request = await this.requests.create({
      id: crypto.randomUUID(),
      senderId,
      ownerId: listing.ownerId,
      listingId,
      requestedMoveInDate: data.requestedMoveInDate,
      occupants: data.occupants,
      message: data.message,
      status: 'pending',
      createdAt: now,
      updatedAt: now,
    });

    await this.notifications?.create(listing.ownerId, {
      title: 'New booking request',
      message: 'Someone requested to book your accommodation.',
      type: 'booking-request-received',
      relatedRequestId: request.id,
      relatedUserId: senderId,
    });

    return { message: 'Booking request sent', request };
  }

  async received(ownerId) {
    return { requests: await this.requests.findReceived(ownerId) };
  }

  async sent(senderId) {
    return { requests: await this.requests.findSent(senderId) };
  }

  async accept(ownerId, requestId) {
    return this.updateStatus(ownerId, requestId, 'accepted', 'Booking request accepted');
  }

  async reject(ownerId, requestId) {
    return this.updateStatus(ownerId, requestId, 'rejected', 'Booking request rejected');
  }

  async cancel(senderId, requestId) {
    const request = await this.requireOwned(requestId, senderId, 'senderId');
    this.requirePending(request);
    return this.saveStatus(request, 'cancelled', 'Booking request cancelled');
  }

  async updateStatus(ownerId, requestId, status, message) {
    const request = await this.requireOwned(requestId, ownerId, 'ownerId');
    this.requirePending(request);
    return this.saveStatus(request, status, message);
  }

  async saveStatus(request, status, message) {
    const updated = await this.requests.save({
      ...request,
      status,
      updatedAt: new Date().toISOString(),
    });
    if (status === 'accepted' || status === 'rejected') {
      await this.notifications?.create(request.senderId, {
        title: `Booking request ${status}`,
        message: `Your accommodation booking request was ${status}.`,
        type: `booking-request-${status}`,
        relatedRequestId: request.id,
        relatedUserId: request.ownerId,
      });
    }
    return { message, request: updated };
  }

  async requireOwned(requestId, userId, field) {
    this.validateId(requestId, 'requestId');
    const request = await this.requests.findById(requestId);
    if (!request || request[field] !== userId) {
      throw new NotFoundException('Booking request was not found');
    }
    return request;
  }

  async requireListing(listingId) {
    const listing = await this.accommodations.findById(listingId);
    if (!listing) throw new NotFoundException('Accommodation listing was not found');
    return listing;
  }

  validateBooking(body) {
    if (!body || typeof body !== 'object' || Array.isArray(body)) {
      throw new BadRequestException('Booking data is required');
    }
    if (typeof body.requestedMoveInDate !== 'string' ||
        Number.isNaN(Date.parse(body.requestedMoveInDate))) {
      throw new BadRequestException('requestedMoveInDate must be a valid date');
    }
    const occupants = Number(body.occupants);
    if (!Number.isInteger(occupants) || occupants < 1) {
      throw new BadRequestException('occupants must be a positive whole number');
    }
    if (body.message !== undefined && typeof body.message !== 'string') {
      throw new BadRequestException('message must be text');
    }
    return {
      requestedMoveInDate: body.requestedMoveInDate,
      occupants,
      message: body.message?.trim() || '',
    };
  }

  requirePending(request) {
    if (request.status !== 'pending') {
      throw new ConflictException('Only pending booking requests can be changed');
    }
  }

  validateId(value, name) {
    if (typeof value !== 'string' || !value.trim()) {
      throw new BadRequestException(`${name} is required`);
    }
  }
}

Injectable()(BookingRequestsService);

module.exports = { BookingRequestsService };
