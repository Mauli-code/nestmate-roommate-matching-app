const { Module } = require('@nestjs/common');
const { AuthModule } = require('../auth/auth.module');
const { PrivacyController } = require('./privacy.controller');
const { PrivacyService } = require('./privacy.service');

const PrivacyModule = class {};

Module({
  imports: [AuthModule],
  controllers: [PrivacyController],
  providers: [PrivacyService],
  exports: [PrivacyService],
})(PrivacyModule);

module.exports = { PrivacyModule };
