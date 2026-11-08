const { Module } = require('@nestjs/common');
const { AuthModule } = require('../auth/auth.module');
const { DashboardController } = require('./dashboard.controller');
const { DashboardService } = require('./dashboard.service');

const DashboardModule = class {};

Module({
  imports: [AuthModule],
  controllers: [DashboardController],
  providers: [DashboardService],
})(DashboardModule);

module.exports = { DashboardModule };
