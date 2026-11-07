const crypto = require('node:crypto');
const {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} = require('@nestjs/common');
const repository = require('./accommodations.repository');
const profileRepository = require('../matching/profile-repository');

class AccommodationsService {
  constructor(listings = repository, profiles = profileRepository) {
    this.listings = listings;
    this.profiles = profiles;
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

  async recommendations(userId) {
    const profile = await this.profiles.findProfile(userId);
    if (!profile || typeof profile !== 'object') {
      throw new BadRequestException('Your roommate preferences must be saved before searching');
    }

    const listings = await this.listings.findAvailable({});
    const recommendations = listings
      .filter((listing) => this.validListing(listing))
      .map((listing) => {
        const score = this.scoreListing(profile, listing);
        return {
          listing,
          score: score.total,
          breakdown: score.breakdown,
        };
      })
      .sort((first, second) => second.score - first.score);

    return { recommendations };
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

  validListing(listing) {
    return listing &&
      listing.status === 'available' &&
      Number.isFinite(listing.monthlyRent) &&
      listing.monthlyRent > 0 &&
      typeof listing.preferredArea === 'string' &&
      listing.preferredArea.trim() &&
      Number.isInteger(listing.availableRooms) &&
      listing.availableRooms > 0 &&
      typeof listing.availableFrom === 'string' &&
      !Number.isNaN(Date.parse(listing.availableFrom));
  }

  scoreListing(profile, listing) {
    const budget = this.budgetScore(profile.budget, listing.monthlyRent);
    const location = this.textScore(profile.preferredArea, listing.preferredArea);
    const preferredType =
      profile.preferredAccommodationType || profile.accommodationType;
    const type = preferredType
      ? this.textScore(preferredType, listing.type)
      : 0.5;
    const rooms = listing.availableRooms > 0 ? 1 : 0;
    const moveInDate = this.dateScore(profile.moveInDate, listing.availableFrom);
    const breakdown = { budget, location, type, rooms, moveInDate };
    return {
      total: Math.round(
        (budget * 35) +
        (location * 30) +
        (type * 15) +
        (rooms * 10) +
        (moveInDate * 10),
      ),
      breakdown,
    };
  }

  budgetScore(budget, rent) {
    if (!Number.isFinite(budget) || budget <= 0 || !Number.isFinite(rent) || rent <= 0) {
      return 0;
    }
    return Math.max(0, 1 - Math.abs(budget - rent) / Math.max(budget, rent));
  }

  textScore(first, second) {
    if (typeof first !== 'string' || typeof second !== 'string' || !first.trim() || !second.trim()) {
      return 0;
    }
    return first.trim().toLowerCase() === second.trim().toLowerCase() ? 1 : 0;
  }

  dateScore(moveInDate, availableFrom) {
    if (!moveInDate) return 0.5;
    const moveIn = Date.parse(moveInDate);
    const available = Date.parse(availableFrom);
    return Number.isNaN(moveIn) || Number.isNaN(available) || available <= moveIn ? 1 : 0;
  }
}

Injectable()(AccommodationsService);

module.exports = { AccommodationsService };
