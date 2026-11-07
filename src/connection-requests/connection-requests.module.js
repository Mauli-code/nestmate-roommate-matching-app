const { Module } = require('@nestjs/common');
const { AuthModule } = require('../auth/auth.module');
const { ConnectionRequestsController } = require('./connection-requests.controller');
const { ConnectionRequestsService } = require('./connection-requests.service');

const ConnectionRequestsModule = class {};

Module({
  imports: [AuthModule],
  controllers: [ConnectionRequestsController],
  providers: [ConnectionRequestsService],
})(ConnectionRequestsModule);

module.exports = { ConnectionRequestsModule };
