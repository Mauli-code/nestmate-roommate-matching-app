const {
  Controller,
  Body,
  Get,
  Inject,
  Param,
  Patch,
  Req,
  UseGuards,
} = require('@nestjs/common');
const { AuthGuard } = require('../auth/auth.guard');
const { NotificationsService } = require('./notifications.service');
const { NotificationPreferencesService } = require('./notification-preferences.service');

class NotificationsController {
  constructor(service, preferences) {
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

Controller('api/notifications')(NotificationsController);
UseGuards(AuthGuard)(NotificationsController);
Inject(NotificationsService)(NotificationsController, undefined, 0);
Inject(NotificationPreferencesService)(NotificationsController, undefined, 1);

const listDescriptor = Object.getOwnPropertyDescriptor(NotificationsController.prototype, 'list');
Get()(NotificationsController.prototype, 'list', listDescriptor);
Req()(NotificationsController.prototype, 'list', 0);

const readDescriptor = Object.getOwnPropertyDescriptor(NotificationsController.prototype, 'markRead');
Patch(':notificationId/read')(NotificationsController.prototype, 'markRead', readDescriptor);
Param('notificationId')(NotificationsController.prototype, 'markRead', 0);
Req()(NotificationsController.prototype, 'markRead', 1);

const allDescriptor = Object.getOwnPropertyDescriptor(NotificationsController.prototype, 'markAllRead');
Patch('read-all')(NotificationsController.prototype, 'markAllRead', allDescriptor);
Req()(NotificationsController.prototype, 'markAllRead', 0);

const preferencesDescriptor = Object.getOwnPropertyDescriptor(NotificationsController.prototype, 'getPreferences');
Get('preferences')(NotificationsController.prototype, 'getPreferences', preferencesDescriptor);
Req()(NotificationsController.prototype, 'getPreferences', 0);

const updatePreferencesDescriptor = Object.getOwnPropertyDescriptor(NotificationsController.prototype, 'updatePreferences');
Patch('preferences')(NotificationsController.prototype, 'updatePreferences', updatePreferencesDescriptor);
Body()(NotificationsController.prototype, 'updatePreferences', 0);
Req()(NotificationsController.prototype, 'updatePreferences', 1);

module.exports = { NotificationsController };
