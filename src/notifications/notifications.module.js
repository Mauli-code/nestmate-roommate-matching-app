const { Module } = require('@nestjs/common');
const { AuthModule } = require('../auth/auth.module');
const { NotificationsController } = require('./notifications.controller');
const { NotificationsService } = require('./notifications.service');
const { NotificationPreferencesService } = require('./notification-preferences.service');

const NotificationsModule = class {};

Module({
  imports: [AuthModule],
  controllers: [NotificationsController],
  providers: [NotificationsService, NotificationPreferencesService],
  exports: [NotificationsService],
})(NotificationsModule);

module.exports = { NotificationsModule };
