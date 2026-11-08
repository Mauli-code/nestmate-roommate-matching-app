const test = require('node:test');
const assert = require('node:assert/strict');
const { BadRequestException } = require('@nestjs/common');
const { PrivacyService } = require('./privacy.service');

function setup() {
  const saved = new Map();
  return new PrivacyService({
    findByUser: async (id) => saved.get(id) || null,
    save: async (id, value) => { saved.set(id, value); return value; },
  });
}

test('returns defaults and stores separate user settings', async () => {
  const service = setup();
  assert.equal((await service.get('alice')).privacy.showProfile, true);
  await service.update('alice', { showProfile: false, showBudget: false });
  await service.update('bob', { showBudget: true });
  assert.equal((await service.get('alice')).privacy.showProfile, false);
  assert.equal((await service.get('bob')).privacy.showProfile, true);
});

test('rejects invalid privacy values', async () => {
  await assert.rejects(() => setup().update('alice', { showProfile: 'no' }), BadRequestException);
});
