const { Module } = require('@nestjs/common');
const { AuthModule } = require('../auth/auth.module');
const { NotificationsModule } = require('../notifications/notifications.module');
const { NotificationsService } = require('../notifications/notifications.service');
const { ChatController } = require('./chat.controller');
const { ChatService } = require('./chat.service');

const ChatModule = class {};

Module({
  imports: [AuthModule, NotificationsModule],
  controllers: [ChatController],
  providers: [
    {
      provide: ChatService,
      useFactory: (notifications) =>
        new ChatService(undefined, undefined, undefined, undefined, notifications),
      inject: [NotificationsService],
    },
  ],
})(ChatModule);

module.exports = { ChatModule };
