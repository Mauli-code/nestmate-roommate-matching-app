const {
  Body,
  Controller,
  Delete,
  Get,
  Inject,
  Param,
  Post,
  Put,
  Query,
  Req,
  UseGuards,
} = require('@nestjs/common');
const { AuthGuard } = require('../auth/auth.guard');
const { AccommodationsService } = require('./accommodations.service');

class AccommodationsController {
  constructor(service) {
    this.service = service;
  }

  async create(body, request) {
    return this.service.create(request.user.sub, body);
  }

  async findAvailable(query) {
    return this.service.findAvailable(query);
  }

  async recommendations(request) {
    return this.service.recommendations(request.user.sub);
  }

  async findOne(id) {
    return this.service.findOne(id);
  }

  async update(id, body, request) {
    return this.service.update(request.user.sub, id, body);
  }

  async remove(id, request) {
    return this.service.remove(request.user.sub, id);
  }
}

Controller('api/accommodations')(AccommodationsController);
UseGuards(AuthGuard)(AccommodationsController);
Inject(AccommodationsService)(AccommodationsController, undefined, 0);

const createDescriptor = Object.getOwnPropertyDescriptor(AccommodationsController.prototype, 'create');
Post()(AccommodationsController.prototype, 'create', createDescriptor);
Body()(AccommodationsController.prototype, 'create', 0);
Req()(AccommodationsController.prototype, 'create', 1);

const listDescriptor = Object.getOwnPropertyDescriptor(AccommodationsController.prototype, 'findAvailable');
Get()(AccommodationsController.prototype, 'findAvailable', listDescriptor);
Query()(AccommodationsController.prototype, 'findAvailable', 0);

const recommendationsDescriptor = Object.getOwnPropertyDescriptor(
  AccommodationsController.prototype,
  'recommendations',
);
Get('recommendations')(
  AccommodationsController.prototype,
  'recommendations',
  recommendationsDescriptor,
);
Req()(AccommodationsController.prototype, 'recommendations', 0);

const oneDescriptor = Object.getOwnPropertyDescriptor(AccommodationsController.prototype, 'findOne');
Get(':id')(AccommodationsController.prototype, 'findOne', oneDescriptor);
Param('id')(AccommodationsController.prototype, 'findOne', 0);

const updateDescriptor = Object.getOwnPropertyDescriptor(AccommodationsController.prototype, 'update');
Put(':id')(AccommodationsController.prototype, 'update', updateDescriptor);
Param('id')(AccommodationsController.prototype, 'update', 0);
Body()(AccommodationsController.prototype, 'update', 1);
Req()(AccommodationsController.prototype, 'update', 2);

const removeDescriptor = Object.getOwnPropertyDescriptor(AccommodationsController.prototype, 'remove');
Delete(':id')(AccommodationsController.prototype, 'remove', removeDescriptor);
Param('id')(AccommodationsController.prototype, 'remove', 0);
Req()(AccommodationsController.prototype, 'remove', 1);

module.exports = { AccommodationsController };
