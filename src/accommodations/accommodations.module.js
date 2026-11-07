const { Module } = require('@nestjs/common');
const { AuthModule } = require('../auth/auth.module');
const { AccommodationsController } = require('./accommodations.controller');
const { AccommodationsService } = require('./accommodations.service');

const AccommodationsModule = class {};

Module({
  imports: [AuthModule],
  controllers: [AccommodationsController],
  providers: [AccommodationsService],
})(AccommodationsModule);

module.exports = { AccommodationsModule };
