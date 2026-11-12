const { Module } = require('@nestjs/common');
const { AuthModule } = require('../auth/auth.module');
const { ReviewsController } = require('./reviews.controller');
const { ReviewsService } = require('./reviews.service');

const ReviewsModule = class {};

Module({
  imports: [AuthModule],
  controllers: [ReviewsController],
  providers: [ReviewsService],
})(ReviewsModule);

module.exports = { ReviewsModule };
