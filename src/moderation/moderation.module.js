const { Module } = require('@nestjs/common');
const { AuthModule } = require('../auth/auth.module');
const { ModerationController } = require('./moderation.controller');
const { ModerationService } = require('./moderation.service');

const ModerationModule = class {};

Module({
  imports: [AuthModule],
  controllers: [ModerationController],
  providers: [ModerationService],
  exports: [ModerationService],
})(ModerationModule);

module.exports = { ModerationModule };
