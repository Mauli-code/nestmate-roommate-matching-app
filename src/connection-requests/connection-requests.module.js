const { Module } = require('@nestjs/common');
const { AuthModule } = require('../auth/auth.module');
const { NotificationsModule } = require('../notifications/notifications.module');
const { ConnectionRequestsController } = require('./connection-requests.controller');
const { ConnectionRequestsService } = require('./connection-requests.service');

const ConnectionRequestsModule = class {};

Module({
  imports: [AuthModule, NotificationsModule],
  controllers: [ConnectionRequestsController],
  providers: [
    {
      provide: ConnectionRequestsService,
      useFactory: (notifications) =>
        new ConnectionRequestsService(undefined, undefined, undefined, notifications),
      inject: [require('../notifications/notifications.service').NotificationsService],
    },
  ],
})(ConnectionRequestsModule);

module.exports = { ConnectionRequestsModule };
