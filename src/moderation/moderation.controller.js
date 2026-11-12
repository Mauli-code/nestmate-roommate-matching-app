const {
  Body,
  Controller,
  Delete,
  Get,
  Inject,
  Param,
  Post,
  Req,
  UseGuards,
} = require('@nestjs/common');
const { AuthGuard } = require('../auth/auth.guard');
const { ModerationService } = require('./moderation.service');

class ModerationController {
  constructor(service) {
    this.service = service;
  }

  async listBlocked(request) {
    return this.service.listBlocked(request.user.sub);
  }

  async block(userId, request) {
    return this.service.block(request.user.sub, userId);
  }

  async unblock(userId, request) {
    return this.service.unblock(request.user.sub, userId);
  }

  async report(userId, body, request) {
    return this.service.report(request.user.sub, userId, body);
  }
}

Controller('api')(ModerationController);
UseGuards(AuthGuard)(ModerationController);
Inject(ModerationService)(ModerationController, undefined, 0);

const listDescriptor = Object.getOwnPropertyDescriptor(ModerationController.prototype, 'listBlocked');
Get('blocks')(ModerationController.prototype, 'listBlocked', listDescriptor);
Req()(ModerationController.prototype, 'listBlocked', 0);

for (const [method, decorator] of [['block', Post], ['unblock', Delete]]) {
  const descriptor = Object.getOwnPropertyDescriptor(ModerationController.prototype, method);
  decorator(`blocks/:userId`)(ModerationController.prototype, method, descriptor);
  Param('userId')(ModerationController.prototype, method, 0);
  Req()(ModerationController.prototype, method, 1);
}

const reportDescriptor = Object.getOwnPropertyDescriptor(ModerationController.prototype, 'report');
Post('reports/:userId')(ModerationController.prototype, 'report', reportDescriptor);
Param('userId')(ModerationController.prototype, 'report', 0);
Body()(ModerationController.prototype, 'report', 1);
Req()(ModerationController.prototype, 'report', 2);

module.exports = { ModerationController };
