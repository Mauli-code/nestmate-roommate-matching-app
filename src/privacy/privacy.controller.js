const express = require('express');
const { createAuthMiddleware } = require('../auth/auth.guard');
const { PrivacyService } = require('./privacy.service');

class PrivacyController {
  constructor(service = new PrivacyService()) {
    this.service = service;
  }

  async get(request) {
    return this.service.get(request.user.sub);
  }

  async update(body, request) {
    return this.service.update(request.user.sub, body);
  }
}

function createPrivacyRouter(service = new PrivacyService(), authService) {
  const router = express.Router();
  const controller = new PrivacyController(service);
  const requireAuth = createAuthMiddleware(authService);

  router.use(requireAuth);

  router.get('/preferences', async (req, res, next) => {
    try {
      const result = await controller.get(req);
      res.json(result);
    } catch (err) {
      next(err);
    }
  });

  router.patch('/preferences', async (req, res, next) => {
    try {
      const result = await controller.update(req.body, req);
      res.json(result);
    } catch (err) {
      next(err);
    }
  });

  return router;
}

module.exports = { PrivacyController, createPrivacyRouter };
