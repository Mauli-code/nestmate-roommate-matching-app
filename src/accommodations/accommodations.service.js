const crypto = require('node:crypto');
const {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} = require('@nestjs/common');
const repository = require('./accommodations.repository');

class AccommodationsService {
  constructor(listings = repository) {
    this.listings = listings;
  }

  async create(ownerId, body) {
    const data = this.validate(body);
    const now = new Date().toISOString();
    return this.listings.create({
      id: crypto.randomUUID(),
      ownerId,
      ...data,
      status: 'available',
      createdAt: now,
      updatedAt: now,
    });
  }

  async findAvailable(query = {}) {
    const filters = this.validateFilters(query);
    return { listings: await this.listings.findAvailable(filters) };
  }

  async findOne(id) {
    const listing = await this.requireListing(id);
    return listing;
  }

  async update(ownerId, id, body) {
    const listing = await this.requireListing(id);
    this.requireOwner(listing, ownerId);
    const updated = await this.listings.save({
      ...listing,
      ...this.validate(body, true),
      updatedAt: new Date().toISOString(),
    });
    return updated;
  }

  async remove(ownerId, id) {
    const listing = await this.requireListing(id);
    this.requireOwner(listing, ownerId);
    await this.listings.remove(id);
    return { message: 'Accommodation listing deleted' };
  }

  async requireListing(id) {
    if (typeof id !== 'string' || !id.trim()) {
      throw new BadRequestException('listingId is required');
    }
    const listing = await this.listings.findById(id);
    if (!listing) throw new NotFoundException('Accommodation listing was not found');
    return listing;
  }

  requireOwner(listing, ownerId) {
    if (listing.ownerId !== ownerId) {
      throw new ForbiddenException('You can only manage your own listings');
    }
  }

  validate(body, partial = false) {
    if (!body || typeof body !== 'object' || Array.isArray(body)) {
      throw new BadRequestException('Listing data is required');
    }
    const requiredText = ['title', 'description', 'city', 'preferredArea', 'type'];
    const values = {};
    for (const field of requiredText) {
      if (partial && body[field] === undefined) continue;
      if (typeof body[field] !== 'string' || !body[field].trim()) {
        throw new BadRequestException(`${field} is required`);
      }
      values[field] = body[field].trim();
    }
    if (!partial || body.monthlyRent !== undefined) {
      values.monthlyRent = this.positiveNumber(body.monthlyRent, 'monthlyRent');
    }
    if (body.securityDeposit !== undefined) {
      values.securityDeposit = this.nonNegativeNumber(body.securityDeposit, 'securityDeposit');
    } else if (!partial) {
      values.securityDeposit = 0;
    }
    if (!partial || body.availableRooms !== undefined) {
      const rooms = Number(body.availableRooms);
      if (!Number.isInteger(rooms) || rooms < 1) {
        throw new BadRequestException('availableRooms must be a positive whole number');
      }
      values.availableRooms = rooms;
    }
    if (!partial || body.availableFrom !== undefined) {
      if (typeof body.availableFrom !== 'string' || Number.isNaN(Date.parse(body.availableFrom))) {
        throw new BadRequestException('availableFrom must be a valid date');
      }
      values.availableFrom = body.availableFrom;
    }
    if (body.photoUrls !== undefined) {
      if (!Array.isArray(body.photoUrls) || body.photoUrls.some((url) => typeof url !== 'string')) {
        throw new BadRequestException('photoUrls must be an array of strings');
      }
      values.photoUrls = body.photoUrls;
    } else if (!partial) {
      values.photoUrls = [];
    }
    if (body.type && !['flat', 'apartment', 'pg', 'shared-room'].includes(body.type)) {
      throw new BadRequestException('type must be flat, apartment, pg, or shared-room');
    }
    return values;
  }

  positiveNumber(value, name) {
    const number = Number(value);
    if (!Number.isFinite(number) || number <= 0) {
      throw new BadRequestException(`${name} must be greater than zero`);
    }
    return number;
  }

  nonNegativeNumber(value, name) {
    const number = Number(value);
    if (!Number.isFinite(number) || number < 0) {
      throw new BadRequestException(`${name} must be zero or greater`);
    }
    return number;
  }

  validateFilters(query) {
    const minRent = query.minRent === undefined || query.minRent === '' ? null : this.nonNegativeNumber(query.minRent, 'minRent');
    const maxRent = query.maxRent === undefined || query.maxRent === '' ? null : this.nonNegativeNumber(query.maxRent, 'maxRent');
    if (minRent !== null && maxRent !== null && maxRent < minRent) {
      throw new BadRequestException('maxRent must be greater than or equal to minRent');
    }
    const type = query.type || null;
    if (type !== null && !['flat', 'apartment', 'pg', 'shared-room'].includes(type)) {
      throw new BadRequestException('type must be flat, apartment, pg, or shared-room');
    }
    return {
      minRent,
      maxRent,
      type,
      preferredArea: query.preferredArea ? String(query.preferredArea).trim() : null,
    };
  }
}

Injectable()(AccommodationsService);

module.exports = { AccommodationsService };
