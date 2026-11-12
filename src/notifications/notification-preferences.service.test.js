const test = require('node:test');
const assert = require('node:assert/strict');
const { BadRequestException } = require('@nestjs/common');
const { NotificationPreferencesService } = require('./notification-preferences.service');

function setup() {
  const saved = new Map();
  return new NotificationPreferencesService({
    findByUser: async (id) => saved.get(id) || null,
    save: async (id, values) => {
      saved.set(id, values);
      return values;
    },
  });
}

test('returns defaults and saves separate user preferences', async () => {
  const service = setup();
  const defaults = await service.get('alice');
  assert.equal(defaults.preferences.messages, true);
  await service.update('alice', { messages: false, connectionRequests: false });
  await service.update('bob', { messages: true });
  assert.equal((await service.get('alice')).preferences.messages, false);
  assert.equal((await service.get('bob')).preferences.messages, true);
});

test('rejects invalid preference values', async () => {
  await assert.rejects(
    () => setup().update('alice', { messages: 'false' }),
    BadRequestException,
  );
});
