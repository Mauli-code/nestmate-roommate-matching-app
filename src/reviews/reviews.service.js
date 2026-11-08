const crypto = require('node:crypto');
const {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} = require('@nestjs/common');
const reviewRepository = require('./reviews.repository');
const userRepository = require('../auth/user-repository');
const connectionRepository = require('../connection-requests/connection-requests.repository');
const bookingRepository = require('../booking-requests/booking-requests.repository');
const accommodationRepository = require('../accommodations/accommodations.repository');

class ReviewsService {
  constructor(
    reviews = reviewRepository,
    users = userRepository,
    connections = connectionRepository,
    bookings = bookingRepository,
    accommodations = accommodationRepository,
  ) {
    this.reviews = reviews;
    this.users = users;
    this.connections = connections;
    this.bookings = bookings;
    this.accommodations = accommodations;
  }

  async createRoommateReview(reviewerId, roommateId, body) {
    this.validateId(reviewerId, 'reviewerId');
    this.validateId(roommateId, 'roommateId');
    if (reviewerId === roommateId) {
      throw new BadRequestException('You cannot review yourself');
    }
    await this.requireUser(roommateId);
    const connection = await this.connections.findBetween(reviewerId, roommateId);
    if (!connection || connection.status !== 'accepted') {
      throw new ForbiddenException('An accepted roommate connection is required to review this user');
    }
    return this.createReview(
      reviewerId,
      'roommate',
      roommateId,
      `connection:${connection.id}`,
      body,
    );
  }

  async createAccommodationReview(reviewerId, listingId, body) {
    this.validateId(reviewerId, 'reviewerId');
    this.validateId(listingId, 'listingId');
    const listing = await this.accommodations.findById(listingId);
    if (!listing) throw new NotFoundException('Accommodation listing was not found');
    const requests = await this.bookings.findSent(reviewerId);
    const booking = requests.find(
      (request) =>
        request.listingId === listingId &&
        (request.status === 'accepted' || request.status === 'completed'),
    );
    if (!booking) {
      throw new ForbiddenException('An accepted or completed booking is required to review this accommodation');
    }
    return this.createReview(
      reviewerId,
      'accommodation',
      listingId,
      `booking:${booking.id}`,
      body,
    );
  }

  async createReview(reviewerId, targetType, targetId, interactionKey, body) {
    const data = this.validate(body);
    if (await this.reviews.findByReviewerAndInteraction(reviewerId, interactionKey)) {
      throw new ConflictException('You have already reviewed this interaction');
    }
    const now = new Date().toISOString();
    const review = await this.reviews.create({
      id: crypto.randomUUID(),
      reviewerId,
      targetType,
      targetId,
      interactionKey,
      rating: data.rating,
      comment: data.comment,
      createdAt: now,
      updatedAt: now,
    });
    return { message: 'Review submitted', review: this.publicReview(review) };
  }

  async list(targetType, targetId) {
    this.validateTarget(targetType);
    this.validateId(targetId, 'targetId');
    const reviews = await this.reviews.findForTarget(targetType, targetId);
    const total = reviews.reduce((sum, review) => sum + review.rating, 0);
    return {
      reviews: await Promise.all(reviews.map((review) => this.present(review))),
      averageRating: reviews.length ? Number((total / reviews.length).toFixed(2)) : 0,
      totalReviews: reviews.length,
    };
  }

  async update(userId, reviewId, body) {
    const review = await this.requireOwned(userId, reviewId);
    const updated = await this.reviews.save({
      ...review,
      ...this.validate(body),
      updatedAt: new Date().toISOString(),
    });
    return { message: 'Review updated', review: this.publicReview(updated) };
  }

  async remove(userId, reviewId) {
    await this.requireOwned(userId, reviewId);
    await this.reviews.remove(reviewId);
    return { message: 'Review deleted' };
  }

  async requireOwned(userId, reviewId) {
    this.validateId(reviewId, 'reviewId');
    const review = await this.reviews.findById(reviewId);
    if (!review) throw new NotFoundException('Review was not found');
    if (review.reviewerId !== userId) {
      throw new ForbiddenException('You can only manage your own reviews');
    }
    return review;
  }

  async present(review) {
    const user = await this.users.findById(review.reviewerId);
    return {
      ...this.publicReview(review),
      reviewer: { id: review.reviewerId, fullName: user?.fullName || 'User' },
    };
  }

  publicReview(review) {
    return {
      id: review.id,
      reviewerId: review.reviewerId,
      targetType: review.targetType,
      targetId: review.targetId,
      rating: review.rating,
      comment: review.comment,
      createdAt: review.createdAt,
      updatedAt: review.updatedAt,
    };
  }

  validate(body) {
    if (!body || typeof body !== 'object' || Array.isArray(body)) {
      throw new BadRequestException('Review data is required');
    }
    const rating = Number(body.rating);
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      throw new BadRequestException('rating must be a whole number from 1 to 5');
    }
    if (body.comment !== undefined && typeof body.comment !== 'string') {
      throw new BadRequestException('comment must be text');
    }
    const comment = body.comment?.trim() || '';
    if (comment.length > 1000) {
      throw new BadRequestException('comment must be 1000 characters or fewer');
    }
    return { rating, comment };
  }

  validateTarget(targetType) {
    if (!['roommate', 'accommodation'].includes(targetType)) {
      throw new BadRequestException('targetType must be roommate or accommodation');
    }
  }

  async requireUser(id) {
    if (!(await this.users.findById(id))) throw new NotFoundException('User was not found');
  }

  validateId(value, name) {
    if (typeof value !== 'string' || !value.trim()) {
      throw new BadRequestException(`${name} is required`);
    }
  }
}

Injectable()(ReviewsService);

module.exports = { ReviewsService };
