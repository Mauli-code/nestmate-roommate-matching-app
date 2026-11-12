const assert = require('node:assert/strict');
const test = require('node:test');
const { BadRequestException, ConflictException } = require('@nestjs/common');
const { ModerationService } = require('./moderation.service');

function setup() {
  const blocks = new Map();
  const reports = [];
  return new ModerationService({
    findBlock: async (ownerId, blockedUserId) => blocks.get(`${ownerId}:${blockedUserId}`) || null,
    saveBlock: async (block) => {
      blocks.set(`${block.ownerId}:${block.blockedUserId}`, block);
      return block;
    },
    deleteBlock: async (ownerId, blockedUserId) => blocks.delete(`${ownerId}:${blockedUserId}`),
    findByOwner: async (ownerId) => [...blocks.values()].filter((block) => block.ownerId === ownerId),
    saveReport: async (report) => { reports.push(report); return report; },
    findRecentReport: async (reporterId, reportedUserId, category, since) =>
      reports.find((report) =>
        report.reporterId === reporterId &&
        report.reportedUserId === reportedUserId &&
        report.category === category &&
        report.createdAt >= since) || null,
  }, {
    findById: async (id) => ['alice', 'bob'].includes(id) ? { id, fullName: id } : null,
  });
}

test('blocks, lists, and unblocks a user', async () => {
  const service = setup();
  await service.block('alice', 'bob');
  assert.equal((await service.listBlocked('alice')).blockedUsers[0].userId, 'bob');
  assert.equal(await service.isBlockedBetween('bob', 'alice'), true);
  await service.unblock('alice', 'bob');
  assert.equal(await service.isBlockedBetween('alice', 'bob'), false);
});

test('rejects self-blocking and invalid reports', async () => {
  const service = setup();
  await assert.rejects(() => service.block('alice', 'alice'), BadRequestException);
  await assert.rejects(() => service.report('alice', 'bob', { category: 'unknown' }), BadRequestException);
});

test('prevents duplicate reports for the same category within 24 hours', async () => {
  const service = setup();
  await service.report('alice', 'bob', { category: 'spam', description: 'Repeated messages' });
  await assert.rejects(
    () => service.report('alice', 'bob', { category: 'spam' }),
    ConflictException,
  );
});
