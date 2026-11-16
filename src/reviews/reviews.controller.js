const express = require('express');
const { createAuthMiddleware } = require('../auth/auth.guard');
const { ReviewsService } = require('./reviews.service');

class ReviewsController {
  constructor(service = new ReviewsService()) {
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

function createReviewsRouter(service = new ReviewsService(), authService) {
  const router = express.Router();
  const controller = new ReviewsController(service);
  const requireAuth = createAuthMiddleware(authService);

  router.post('/roommates/:roommateId', requireAuth, async (req, res, next) => {
    try {
      const result = await controller.createRoommate(req.params.roommateId, req.body, req);
      res.json(result);
    } catch (err) {
      next(err);
    }
  });

  router.post('/accommodations/:listingId', requireAuth, async (req, res, next) => {
    try {
      const result = await controller.createAccommodation(req.params.listingId, req.body, req);
      res.json(result);
    } catch (err) {
      next(err);
    }
  });

  router.get('/roommates/:roommateId', async (req, res, next) => {
    try {
      const result = await controller.listRoommate(req.params.roommateId);
      res.json(result);
    } catch (err) {
      next(err);
    }
  });

  router.get('/accommodations/:listingId', async (req, res, next) => {
    try {
      const result = await controller.listAccommodation(req.params.listingId);
      res.json(result);
    } catch (err) {
      next(err);
    }
  });

  router.patch('/:reviewId', requireAuth, async (req, res, next) => {
    try {
      const result = await controller.update(req.params.reviewId, req.body, req);
      res.json(result);
    } catch (err) {
      next(err);
    }
  });

  router.delete('/:reviewId', requireAuth, async (req, res, next) => {
    try {
      const result = await controller.remove(req.params.reviewId, req);
      res.json(result);
    } catch (err) {
      next(err);
    }
  });

  return router;
}

module.exports = { ReviewsController, createReviewsRouter };
