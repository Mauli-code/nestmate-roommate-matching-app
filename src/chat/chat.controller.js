const {
  Body,
  Controller,
  Get,
  Inject,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} = require('@nestjs/common');
const { AuthGuard } = require('../auth/auth.guard');
const { ChatService } = require('./chat.service');

class ChatController {
  constructor(service) {
    this.service = service;
  }

  async createConversation(otherUserId, request) {
    return this.service.getOrCreateConversation(request.user.sub, otherUserId);
  }

  async listConversations(request) {
    return this.service.listConversations(request.user.sub);
  }

  async sendMessage(conversationId, body, request) {
    return this.service.sendMessage(request.user.sub, conversationId, body);
  }

  async messages(conversationId, request) {
    return this.service.messages(request.user.sub, conversationId);
  }

  async markRead(conversationId, request) {
    return this.service.markRead(request.user.sub, conversationId);
  }
}

Controller('api/chat')(ChatController);
UseGuards(AuthGuard)(ChatController);
Inject(ChatService)(ChatController, undefined, 0);

const createDescriptor = Object.getOwnPropertyDescriptor(ChatController.prototype, 'createConversation');
Post('conversations/:otherUserId')(ChatController.prototype, 'createConversation', createDescriptor);
Param('otherUserId')(ChatController.prototype, 'createConversation', 0);
Req()(ChatController.prototype, 'createConversation', 1);

const listDescriptor = Object.getOwnPropertyDescriptor(ChatController.prototype, 'listConversations');
Get('conversations')(ChatController.prototype, 'listConversations', listDescriptor);
Req()(ChatController.prototype, 'listConversations', 0);

const sendDescriptor = Object.getOwnPropertyDescriptor(ChatController.prototype, 'sendMessage');
Post('conversations/:conversationId/messages')(ChatController.prototype, 'sendMessage', sendDescriptor);
Param('conversationId')(ChatController.prototype, 'sendMessage', 0);
Body()(ChatController.prototype, 'sendMessage', 1);
Req()(ChatController.prototype, 'sendMessage', 2);

for (const [method, route] of [
  ['messages', 'conversations/:conversationId/messages'],
  ['markRead', 'conversations/:conversationId/read'],
]) {
  const descriptor = Object.getOwnPropertyDescriptor(ChatController.prototype, method);
  (method === 'messages' ? Get(route) : Patch(route))(
    ChatController.prototype,
    method,
    descriptor,
  );
  Param('conversationId')(ChatController.prototype, method, 0);
  Req()(ChatController.prototype, method, 1);
}

module.exports = { ChatController };
