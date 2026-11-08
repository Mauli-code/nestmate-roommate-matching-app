const { Module } = require('@nestjs/common');
const { AuthModule } = require('../auth/auth.module');
const { NotificationsModule } = require('../notifications/notifications.module');
const { NotificationsService } = require('../notifications/notifications.service');
const { BookingRequestsController } = require('./booking-requests.controller');
const { BookingRequestsService } = require('./booking-requests.service');

const BookingRequestsModule = class {};

Module({
  imports: [AuthModule, NotificationsModule],
  controllers: [BookingRequestsController],
  providers: [
    {
      provide: BookingRequestsService,
      useFactory: (notifications) =>
        new BookingRequestsService(undefined, undefined, undefined, notifications),
      inject: [NotificationsService],
    },
  ],
})(BookingRequestsModule);

module.exports = { BookingRequestsModule };
