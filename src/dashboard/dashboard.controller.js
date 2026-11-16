const express = require('express');
const { createAuthMiddleware } = require('../auth/auth.guard');
const { DashboardService } = require('./dashboard.service');

class DashboardController {
  constructor(service = new DashboardService()) {
    this.service = service;
  }

  async get(request) {
    return this.service.get(request.user.sub);
  }
}

function createDashboardRouter(service = new DashboardService(), authService) {
  const router = express.Router();
  const controller = new DashboardController(service);
  const requireAuth = createAuthMiddleware(authService);

  router.use(requireAuth);

  router.get('/', async (req, res, next) => {
    try {
      const result = await controller.get(req);
      res.json(result);
    } catch (err) {
      next(err);
    }
  });

  return router;
}

module.exports = { DashboardController, createDashboardRouter };
