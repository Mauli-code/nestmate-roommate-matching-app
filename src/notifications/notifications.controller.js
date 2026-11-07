const {
  Controller,
  Get,
  Inject,
  Param,
  Patch,
  Req,
  UseGuards,
} = require('@nestjs/common');
const { AuthGuard } = require('../auth/auth.guard');
const { NotificationsService } = require('./notifications.service');

class NotificationsController {
  constructor(service) {
    this.service = service;
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
}

Controller('api/notifications')(NotificationsController);
UseGuards(AuthGuard)(NotificationsController);
Inject(NotificationsService)(NotificationsController, undefined, 0);

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

module.exports = { NotificationsController };
