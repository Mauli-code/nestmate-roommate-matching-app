const { Body, Controller, Get, Inject, Patch, Req, UseGuards } = require('@nestjs/common');
const { AuthGuard } = require('../auth/auth.guard');
const { PrivacyService } = require('./privacy.service');

class PrivacyController {
  constructor(service) {
    this.service = service;
  }

  async get(request) {
    return this.service.get(request.user.sub);
  }

  async update(body, request) {
    return this.service.update(request.user.sub, body);
  }
}

Controller('api/privacy')(PrivacyController);
UseGuards(AuthGuard)(PrivacyController);
Inject(PrivacyService)(PrivacyController, undefined, 0);

const getDescriptor = Object.getOwnPropertyDescriptor(PrivacyController.prototype, 'get');
Get('preferences')(PrivacyController.prototype, 'get', getDescriptor);
Req()(PrivacyController.prototype, 'get', 0);

const updateDescriptor = Object.getOwnPropertyDescriptor(PrivacyController.prototype, 'update');
Patch('preferences')(PrivacyController.prototype, 'update', updateDescriptor);
Body()(PrivacyController.prototype, 'update', 0);
Req()(PrivacyController.prototype, 'update', 1);

module.exports = { PrivacyController };
