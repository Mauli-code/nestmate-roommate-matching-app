const express = require('express');
const { createAuthMiddleware } = require('../auth/auth.guard');
const { ModerationService } = require('./moderation.service');

class ModerationController {
  constructor(service = new ModerationService()) {
    this.service = service;
  }

  async listBlocked(request) {
    return this.service.listBlocked(request.user.sub);
  }

  async block(userId, request) {
    return this.service.block(request.user.sub, userId);
  }

  async unblock(userId, request) {
    return this.service.unblock(request.user.sub, userId);
  }

  async report(userId, body, request) {
    return this.service.report(request.user.sub, userId, body);
  }
}

function createModerationRouter(service = new ModerationService(), authService) {
  const router = express.Router();
  const controller = new ModerationController(service);
  const requireAuth = createAuthMiddleware(authService);

  router.use(requireAuth);

  router.get('/blocks', async (req, res, next) => {
    try {
      const result = await controller.listBlocked(req);
      res.json(result);
    } catch (err) {
      next(err);
    }
  });

  router.post('/blocks/:userId', async (req, res, next) => {
    try {
      const result = await controller.block(req.params.userId, req);
      res.json(result);
    } catch (err) {
      next(err);
    }
  });

  router.delete('/blocks/:userId', async (req, res, next) => {
    try {
      const result = await controller.unblock(req.params.userId, req);
      res.json(result);
    } catch (err) {
      next(err);
    }
  });

  router.post('/reports/:userId', async (req, res, next) => {
    try {
      const result = await controller.report(req.params.userId, req.body, req);
      res.json(result);
    } catch (err) {
      next(err);
    }
  });

  return router;
}

module.exports = { ModerationController, createModerationRouter };
