const assert = require('node:assert/strict');
const test = require('node:test');
const { HealthController } = require('./health.controller');

test('returns healthy status and metadata', () => {
  const controller = new HealthController();
  const health = controller.getHealth();

  assert.equal(health.status, 'ok');
  assert.equal(health.service, 'nestmate-backend');
  assert.ok(typeof health.timestamp === 'string');
  assert.ok(typeof health.uptime === 'number');
});
