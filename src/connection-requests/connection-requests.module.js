const { Module } = require('@nestjs/common');
const { AuthModule } = require('../auth/auth.module');
const { NotificationsModule } = require('../notifications/notifications.module');
const { ConnectionRequestsController } = require('./connection-requests.controller');
const { ConnectionRequestsService } = require('./connection-requests.service');
const { PrivacyService } = require('../privacy/privacy.service');
const { PrivacyModule } = require('../privacy/privacy.module');

const ConnectionRequestsModule = class {};

Module({
  imports: [AuthModule, NotificationsModule, PrivacyModule],
  controllers: [ConnectionRequestsController],
  providers: [
    {
      provide: ConnectionRequestsService,
      useFactory: (notifications, privacy) =>
        new ConnectionRequestsService(undefined, undefined, undefined, notifications, privacy),
      inject: [require('../notifications/notifications.service').NotificationsService, PrivacyService],
    },
  ],
})(ConnectionRequestsModule);

module.exports = { ConnectionRequestsModule };
