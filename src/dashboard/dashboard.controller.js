const { Controller, Get, Inject, Req, UseGuards } = require('@nestjs/common');
const { AuthGuard } = require('../auth/auth.guard');
const { DashboardService } = require('./dashboard.service');

class DashboardController {
  constructor(service) {
    this.service = service;
  }

  async get(request) {
    return this.service.get(request.user.sub);
  }
}

Controller('api/dashboard')(DashboardController);
UseGuards(AuthGuard)(DashboardController);
Inject(DashboardService)(DashboardController, undefined, 0);

const descriptor = Object.getOwnPropertyDescriptor(DashboardController.prototype, 'get');
Get()(DashboardController.prototype, 'get', descriptor);
Req()(DashboardController.prototype, 'get', 0);

module.exports = { DashboardController };
