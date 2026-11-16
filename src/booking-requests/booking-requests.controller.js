const express = require('express');
const { createAuthMiddleware } = require('../auth/auth.guard');
const { BookingRequestsService } = require('./booking-requests.service');

class BookingRequestsController {
  constructor(service = new BookingRequestsService()) {
    this.service = service;
  }

  async send(listingId, body, request) {
    return this.service.send(request.user.sub, listingId, body);
  }

  async received(request) {
    return this.service.received(request.user.sub);
  }

  async sent(request) {
    return this.service.sent(request.user.sub);
  }

  async accept(requestId, request) {
    return this.service.accept(request.user.sub, requestId);
  }

  async reject(requestId, request) {
    return this.service.reject(request.user.sub, requestId);
  }

  async cancel(requestId, request) {
    return this.service.cancel(request.user.sub, requestId);
  }
}

function createBookingRequestsRouter(service = new BookingRequestsService(), authService) {
  const router = express.Router();
  const controller = new BookingRequestsController(service);
  const requireAuth = createAuthMiddleware(authService);

  router.use(requireAuth);

  router.post('/:listingId', async (req, res, next) => {
    try {
      const result = await controller.send(req.params.listingId, req.body, req);
      res.json(result);
    } catch (err) {
      next(err);
    }
  });

  router.get('/received', async (req, res, next) => {
    try {
      const result = await controller.received(req);
      res.json(result);
    } catch (err) {
      next(err);
    }
  });

  router.get('/sent', async (req, res, next) => {
    try {
      const result = await controller.sent(req);
      res.json(result);
    } catch (err) {
      next(err);
    }
  });

  router.patch('/:requestId/accept', async (req, res, next) => {
    try {
      const result = await controller.accept(req.params.requestId, req);
      res.json(result);
    } catch (err) {
      next(err);
    }
  });

  router.patch('/:requestId/reject', async (req, res, next) => {
    try {
      const result = await controller.reject(req.params.requestId, req);
      res.json(result);
    } catch (err) {
      next(err);
    }
  });

  router.delete('/:requestId/cancel', async (req, res, next) => {
    try {
      const result = await controller.cancel(req.params.requestId, req);
      res.json(result);
    } catch (err) {
      next(err);
    }
  });

  return router;
}

module.exports = { BookingRequestsController, createBookingRequestsRouter };
