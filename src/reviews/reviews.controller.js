const {
  Body,
  Controller,
  Delete,
  Get,
  Inject,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} = require('@nestjs/common');
const { AuthGuard } = require('../auth/auth.guard');
const { ReviewsService } = require('./reviews.service');

class ReviewsController {
  constructor(service) {
    this.service = service;
  }

  async createRoommate(roommateId, body, request) {
    return this.service.createRoommateReview(request.user.sub, roommateId, body);
  }

  async createAccommodation(listingId, body, request) {
    return this.service.createAccommodationReview(request.user.sub, listingId, body);
  }

  async listRoommate(roommateId) {
    return this.service.list('roommate', roommateId);
  }

  async listAccommodation(listingId) {
    return this.service.list('accommodation', listingId);
  }

  async update(reviewId, body, request) {
    return this.service.update(request.user.sub, reviewId, body);
  }

  async remove(reviewId, request) {
    return this.service.remove(request.user.sub, reviewId);
  }
}

Controller('api/reviews')(ReviewsController);
UseGuards(AuthGuard)(ReviewsController);
Inject(ReviewsService)(ReviewsController, undefined, 0);

for (const [method, route, param, target] of [
  ['createRoommate', 'roommates/:roommateId', 'roommateId', 0],
  ['createAccommodation', 'accommodations/:listingId', 'listingId', 0],
]) {
  const descriptor = Object.getOwnPropertyDescriptor(ReviewsController.prototype, method);
  Post(route)(ReviewsController.prototype, method, descriptor);
  Param(param)(ReviewsController.prototype, method, 0);
  require('@nestjs/common').Body()(ReviewsController.prototype, method, 1);
  Req()(ReviewsController.prototype, method, 2);
}

for (const [method, route, param] of [
  ['listRoommate', 'roommates/:roommateId', 'roommateId'],
  ['listAccommodation', 'accommodations/:listingId', 'listingId'],
]) {
  const descriptor = Object.getOwnPropertyDescriptor(ReviewsController.prototype, method);
  Get(route)(ReviewsController.prototype, method, descriptor);
  Param(param)(ReviewsController.prototype, method, 0);
}

const updateDescriptor = Object.getOwnPropertyDescriptor(ReviewsController.prototype, 'update');
Patch(':reviewId')(ReviewsController.prototype, 'update', updateDescriptor);
Param('reviewId')(ReviewsController.prototype, 'update', 0);
Body()(ReviewsController.prototype, 'update', 1);
Req()(ReviewsController.prototype, 'update', 2);

const removeDescriptor = Object.getOwnPropertyDescriptor(ReviewsController.prototype, 'remove');
Delete(':reviewId')(ReviewsController.prototype, 'remove', removeDescriptor);
Param('reviewId')(ReviewsController.prototype, 'remove', 0);
Req()(ReviewsController.prototype, 'remove', 1);

module.exports = { ReviewsController };
