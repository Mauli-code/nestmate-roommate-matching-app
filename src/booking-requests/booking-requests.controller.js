const {
  Body,
  Controller,
  Delete,
  Get,
  Inject,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} = require('@nestjs/common');
const { AuthGuard } = require('../auth/auth.guard');
const { BookingRequestsService } = require('./booking-requests.service');

class BookingRequestsController {
  constructor(service) {
    this.service = service;
  }

  async send(listingId, body, request) {
    return this.service.send(request.user.sub, listingId, body);
  }

  async received(request) {
    return this.service.received(request.user.sub);
  }

  async sent(request) {
    return this.service.sent(request.user.sub);
  }

  async accept(requestId, request) {
    return this.service.accept(request.user.sub, requestId);
  }

  async reject(requestId, request) {
    return this.service.reject(request.user.sub, requestId);
  }

  async cancel(requestId, request) {
    return this.service.cancel(request.user.sub, requestId);
  }
}

Controller('api/booking-requests')(BookingRequestsController);
UseGuards(AuthGuard)(BookingRequestsController);
Inject(BookingRequestsService)(BookingRequestsController, undefined, 0);

const sendDescriptor = Object.getOwnPropertyDescriptor(BookingRequestsController.prototype, 'send');
Post(':listingId')(BookingRequestsController.prototype, 'send', sendDescriptor);
Param('listingId')(BookingRequestsController.prototype, 'send', 0);
Body()(BookingRequestsController.prototype, 'send', 1);
Req()(BookingRequestsController.prototype, 'send', 2);

for (const method of ['received', 'sent']) {
  const descriptor = Object.getOwnPropertyDescriptor(BookingRequestsController.prototype, method);
  Get(method)(BookingRequestsController.prototype, method, descriptor);
  Req()(BookingRequestsController.prototype, method, 0);
}

for (const [method, route] of [
  ['accept', ':requestId/accept'],
  ['reject', ':requestId/reject'],
  ['cancel', ':requestId/cancel'],
]) {
  const descriptor = Object.getOwnPropertyDescriptor(BookingRequestsController.prototype, method);
  (method === 'cancel' ? Delete(route) : Patch(route))(
    BookingRequestsController.prototype,
    method,
    descriptor,
  );
  Param('requestId')(BookingRequestsController.prototype, method, 0);
  Req()(BookingRequestsController.prototype, method, 1);
}

module.exports = { BookingRequestsController };
