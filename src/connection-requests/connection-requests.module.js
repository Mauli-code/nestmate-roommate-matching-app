const { Module } = require('@nestjs/common');
const { AuthModule } = require('../auth/auth.module');
const { NotificationsModule } = require('../notifications/notifications.module');
const { ConnectionRequestsController } = require('./connection-requests.controller');
const { ConnectionRequestsService } = require('./connection-requests.service');
const { PrivacyService } = require('../privacy/privacy.service');
const { PrivacyModule } = require('../privacy/privacy.module');
const { ModerationService } = require('../moderation/moderation.service');
const { ModerationModule } = require('../moderation/moderation.module');

const ConnectionRequestsModule = class {};

Module({
  imports: [AuthModule, NotificationsModule, PrivacyModule, ModerationModule],
  controllers: [ConnectionRequestsController],
  providers: [
    {
      provide: ConnectionRequestsService,
      useFactory: (notifications, privacy, moderation) =>
        new ConnectionRequestsService(undefined, undefined, undefined, notifications, privacy, moderation),
      inject: [
        require('../notifications/notifications.service').NotificationsService,
        PrivacyService,
        ModerationService,
      ],
    },
  ],
})(ConnectionRequestsModule);

module.exports = { ConnectionRequestsModule };
