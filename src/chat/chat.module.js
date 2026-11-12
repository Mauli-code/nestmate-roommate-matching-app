const { Module } = require('@nestjs/common');
const { AuthModule } = require('../auth/auth.module');
const { NotificationsModule } = require('../notifications/notifications.module');
const { NotificationsService } = require('../notifications/notifications.service');
const { ChatController } = require('./chat.controller');
const { ChatService } = require('./chat.service');
const { ModerationService } = require('../moderation/moderation.service');
const { ModerationModule } = require('../moderation/moderation.module');

const ChatModule = class {};

Module({
  imports: [AuthModule, NotificationsModule, ModerationModule],
  controllers: [ChatController],
  providers: [
    {
      provide: ChatService,
      useFactory: (notifications, moderation) =>
        new ChatService(undefined, undefined, undefined, undefined, notifications, moderation),
      inject: [NotificationsService, ModerationService],
    },
  ],
})(ChatModule);

module.exports = { ChatModule };
