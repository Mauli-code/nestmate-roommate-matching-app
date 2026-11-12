const {
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
const { ConnectionRequestsService } = require('./connection-requests.service');

class ConnectionRequestsController {
  constructor(service) {
    this.service = service;
  }

  async send(receiverId, request) {
    return this.service.send(request.user.sub, receiverId);
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

Controller('api/connection-requests')(ConnectionRequestsController);
UseGuards(AuthGuard)(ConnectionRequestsController);
Inject(ConnectionRequestsService)(ConnectionRequestsController, undefined, 0);

const sendDescriptor = Object.getOwnPropertyDescriptor(ConnectionRequestsController.prototype, 'send');
Post(':receiverId')(ConnectionRequestsController.prototype, 'send', sendDescriptor);
Param('receiverId')(ConnectionRequestsController.prototype, 'send', 0);
Req()(ConnectionRequestsController.prototype, 'send', 1);

for (const method of ['received', 'sent']) {
  const descriptor = Object.getOwnPropertyDescriptor(ConnectionRequestsController.prototype, method);
  Get(method)(ConnectionRequestsController.prototype, method, descriptor);
  Req()(ConnectionRequestsController.prototype, method, 0);
}

for (const [method, route] of [['accept', ':requestId/accept'], ['reject', ':requestId/reject'], ['cancel', ':requestId/cancel']]) {
  const descriptor = Object.getOwnPropertyDescriptor(ConnectionRequestsController.prototype, method);
  (method === 'cancel' ? Delete(route) : Patch(route))(
    ConnectionRequestsController.prototype,
    method,
    descriptor,
  );
  Param('requestId')(ConnectionRequestsController.prototype, method, 0);
  Req()(ConnectionRequestsController.prototype, method, 1);
}

module.exports = { ConnectionRequestsController };
