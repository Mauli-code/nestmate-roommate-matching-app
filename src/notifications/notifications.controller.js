const express = require('express');
const { createAuthMiddleware } = require('../auth/auth.guard');
const { NotificationsService } = require('./notifications.service');
const { NotificationPreferencesService } = require('./notification-preferences.service');

class NotificationsController {
  constructor(
    service = new NotificationsService(),
    preferences = new NotificationPreferencesService(),
  ) {
    this.service = service;
    this.preferences = preferences;
  }

  async list(request) {
    return this.service.list(request.user.sub);
  }

  async markRead(notificationId, request) {
    return this.service.markRead(request.user.sub, notificationId);
  }

  async markAllRead(request) {
    return this.service.markAllRead(request.user.sub);
  }

  async getPreferences(request) {
    return this.preferences.get(request.user.sub);
  }

  async updatePreferences(body, request) {
    return this.preferences.update(request.user.sub, body);
  }
}

function createNotificationsRouter(
  service = new NotificationsService(),
  preferences = new NotificationPreferencesService(),
  authService,
) {
  const router = express.Router();
  const controller = new NotificationsController(service, preferences);
  const requireAuth = createAuthMiddleware(authService);

  router.use(requireAuth);

  router.get('/', async (req, res, next) => {
    try {
      const result = await controller.list(req);
      res.json(result);
    } catch (err) {
      next(err);
    }
  });

  router.get('/preferences', async (req, res, next) => {
    try {
      const result = await controller.getPreferences(req);
      res.json(result);
    } catch (err) {
      next(err);
    }
  });

  router.patch('/preferences', async (req, res, next) => {
    try {
      const result = await controller.updatePreferences(req.body, req);
      res.json(result);
    } catch (err) {
      next(err);
    }
  });

  router.patch('/read-all', async (req, res, next) => {
    try {
      const result = await controller.markAllRead(req);
      res.json(result);
    } catch (err) {
      next(err);
    }
  });

  router.patch('/:notificationId/read', async (req, res, next) => {
    try {
      const result = await controller.markRead(req.params.notificationId, req);
      res.json(result);
    } catch (err) {
      next(err);
    }
  });

  return router;
}

module.exports = { NotificationsController, createNotificationsRouter };
