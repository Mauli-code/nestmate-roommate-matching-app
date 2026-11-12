const { Controller, Get } = require('@nestjs/common');

class HealthController {
  getHealth() {
    return {
      status: 'ok',
      service: 'nestmate-backend',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    };
  }
}

Controller('api/health')(HealthController);
Get()(
  HealthController.prototype,
  'getHealth',
  Object.getOwnPropertyDescriptor(HealthController.prototype, 'getHealth'),
);

module.exports = { HealthController };
