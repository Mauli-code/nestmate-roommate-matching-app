const express = require('express');
const { createAuthMiddleware } = require('../auth/auth.guard');
const { AccommodationsService } = require('./accommodations.service');

class AccommodationsController {
  constructor(service = new AccommodationsService()) {
    this.service = service;
  }

  async create(body, request) {
    return this.service.create(request.user.sub, body);
  }

  async findAvailable(query) {
    return this.service.findAvailable(query);
  }

  async recommendations(request) {
    return this.service.recommendations(request.user.sub);
  }

  async findOne(id) {
    return this.service.findOne(id);
  }

  async update(id, body, request) {
    return this.service.update(request.user.sub, id, body);
  }

  async remove(id, request) {
    return this.service.remove(request.user.sub, id);
  }
}

function createAccommodationsRouter(service = new AccommodationsService(), authService) {
  const router = express.Router();
  const controller = new AccommodationsController(service);
  const requireAuth = createAuthMiddleware(authService);

  router.use(requireAuth);

  router.post('/', async (req, res, next) => {
    try {
      const result = await controller.create(req.body, req);
      res.json(result);
    } catch (err) {
      next(err);
    }
  });

  router.get('/', async (req, res, next) => {
    try {
      const result = await controller.findAvailable(req.query);
      res.json(result);
    } catch (err) {
      next(err);
    }
  });

  router.get('/recommendations', async (req, res, next) => {
    try {
      const result = await controller.recommendations(req);
      res.json(result);
    } catch (err) {
      next(err);
    }
  });

  router.get('/:id', async (req, res, next) => {
    try {
      const result = await controller.findOne(req.params.id);
      res.json(result);
    } catch (err) {
      next(err);
    }
  });

  router.put('/:id', async (req, res, next) => {
    try {
      const result = await controller.update(req.params.id, req.body, req);
      res.json(result);
    } catch (err) {
      next(err);
    }
  });

  router.delete('/:id', async (req, res, next) => {
    try {
      const result = await controller.remove(req.params.id, req);
      res.json(result);
    } catch (err) {
      next(err);
    }
  });

  return router;
}

module.exports = { AccommodationsController, createAccommodationsRouter };
