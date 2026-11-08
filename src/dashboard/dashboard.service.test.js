const test = require('node:test');
const assert = require('node:assert/strict');
const { UnauthorizedException } = require('@nestjs/common');
const { DashboardService } = require('./dashboard.service');

function setup() {
  const service = new DashboardService(
    { findById: async (id) => id === 'alice' ? { id, fullName: 'Alice' } : null },
    {
      findProfile: async (id) => id === 'alice' ? { id, budget: 1000, preferredArea: 'Central' } : null,
      findCandidates: async () => [{ id: 'bob' }, { id: 'carol' }],
    },
    { findByUser: async () => [{ roommateId: 'bob' }] },
    {
      findReceived: async () => [{ status: 'pending' }],
      findSent: async () => [],
    },
    {
      findReceived: async () => [{ status: 'pending' }],
      findSent: async () => [],
    },
    {
      findByRecipient: async () => [
        { id: 'notice-1', title: 'Welcome', message: 'Hello', createdAt: '2026-01-02', read: false },
      ],
    },
    {
      findForUser: async () => [{ id: 'conversation-1' }],
      findMessages: async () => [{
        id: 'message-1',
        conversationId: 'conversation-1',
        senderId: 'bob',
        content: 'Hi',
        createdAt: '2026-01-03',
        read: false,
      }],
    },
  );
  return service;
}

test('returns user-scoped dashboard counts and recent activity', async () => {
  const result = await setup().get('alice');
  assert.equal(result.user.fullName, 'Alice');
  assert.equal(result.counts.matches, 2);
  assert.equal(result.counts.favorites, 1);
  assert.equal(result.counts.pendingConnectionRequests, 1);
  assert.equal(result.counts.pendingBookingRequests, 1);
  assert.equal(result.counts.unreadNotifications, 1);
  assert.equal(result.recentMessages[0].content, 'Hi');
});

test('does not expose dashboard data for an unknown user', async () => {
  await assert.rejects(() => setup().get('mallory'), UnauthorizedException);
});
