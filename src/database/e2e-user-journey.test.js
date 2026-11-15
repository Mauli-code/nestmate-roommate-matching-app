const assert = require('node:assert/strict');
const test = require('node:test');

const isConfiguredForPostgres = process.env.STORAGE_MODE === 'postgres' && Boolean(process.env.DATABASE_URL);

test('End-to-End User Journey (Task 8 — Complete 20-Step Lifecycle)', {
  skip: !isConfiguredForPostgres ? 'Set STORAGE_MODE=postgres and DATABASE_URL to run PostgreSQL end-to-end tests' : false,
}, async (t) => {
  const { query, closePool } = require('./connection');
  const BASE = process.env.TEST_API_URL || 'http://localhost:3000';

  const ts = Date.now();
  const testEmail = `e2e_student_${ts}@example.com`;
  const testPassword = 'Password123';
  let userId;
  let token;
  let headers;
  let convId;

  try {
    // ------------------------------------------------------------------------
    // Step 1: Register a new user
    // ------------------------------------------------------------------------
    await t.test('1. Register a new user account', async () => {
      const res = await fetch(`${BASE}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fullName: 'E2E BTech Student', email: testEmail, password: testPassword }),
      });
      assert.equal(res.status, 201);
      const data = await res.json();
      assert.ok(data.user?.id);
      assert.equal(data.user.email, testEmail);
      userId = data.user.id;
    });

    // ------------------------------------------------------------------------
    // Step 2: Login and obtain JWT
    // ------------------------------------------------------------------------
    await t.test('2. Login and obtain JWT access token', async () => {
      const res = await fetch(`${BASE}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: testEmail, password: testPassword }),
      });
      assert.equal(res.status, 201);
      const data = await res.json();
      assert.ok(data.accessToken);
      token = data.accessToken;
      headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };
    });

    // ------------------------------------------------------------------------
    // Step 3: Complete roommate profile
    // ------------------------------------------------------------------------
    await t.test('3. Complete roommate profile details', async () => {
      const res = await fetch(`${BASE}/api/auth/profile`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({ occupation: 'student', city: 'Pune', bio: 'BTech CS Student looking for a quiet flatmate.' }),
      });
      assert.equal(res.status, 200);
      const data = await res.json();
      assert.equal(data.user?.occupation, 'student');
      assert.equal(data.user?.city, 'Pune');
    });

    // ------------------------------------------------------------------------
    // Step 4: Set roommate matching preferences
    // ------------------------------------------------------------------------
    await t.test('4. Set roommate matching preferences', async () => {
      const res = await fetch(`${BASE}/api/matches/${userId}/preferences`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({
          minBudget: 12000,
          maxBudget: 22000,
          preferredArea: 'Kothrud',
          sleepSchedule: 'flexible',
          cleanliness: 'medium',
          foodHabits: 'vegetarian',
          smoking: 'no',
          drinking: 'no',
        }),
      });
      assert.equal(res.status, 200);
      const data = await res.json();
      assert.ok(data.profile);
      assert.equal(data.profile.preferredArea, 'Kothrud');
    });

    // ------------------------------------------------------------------------
    // Step 5: View compatible roommates
    // ------------------------------------------------------------------------
    await t.test('5. View ranked compatible roommates', async () => {
      const res = await fetch(`${BASE}/api/matches`, { headers });
      assert.equal(res.status, 200);
      const data = await res.json();
      assert.ok(Array.isArray(data.matches));
      assert.ok(data.matches.length > 0);
      assert.ok(typeof data.matches[0].score === 'number');
    });

    // ------------------------------------------------------------------------
    // Step 6: Save a roommate to favorites
    // ------------------------------------------------------------------------
    await t.test('6. Save a roommate (user-4) to favorites', async () => {
      const res = await fetch(`${BASE}/api/favorites/user-4`, { method: 'POST', headers });
      assert.equal(res.status, 201);
      const check = await fetch(`${BASE}/api/favorites`, { headers });
      const favData = await check.json();
      assert.ok(favData.favorites.some((f) => f.roommate.id === 'user-4'));
    });

    // ------------------------------------------------------------------------
    // Step 7: Browse accommodations
    // ------------------------------------------------------------------------
    await t.test('7. Browse all accommodation listings', async () => {
      const res = await fetch(`${BASE}/api/accommodations`, { headers });
      assert.equal(res.status, 200);
      const data = await res.json();
      assert.ok(Array.isArray(data.listings));
      assert.equal(data.listings.length, 16);
    });

    // ------------------------------------------------------------------------
    // Step 8: Filter accommodations by city and budget
    // ------------------------------------------------------------------------
    await t.test('8. Filter accommodations by city and budget', async () => {
      const res = await fetch(`${BASE}/api/accommodations?preferredArea=Kothrud&minRent=10000&maxRent=25000`, { headers });
      assert.equal(res.status, 200);
      const data = await res.json();
      assert.ok(data.listings.length >= 1);
      assert.ok(data.listings.every((l) => l.preferredArea.toLowerCase() === 'kothrud'));
    });

    // ------------------------------------------------------------------------
    // Step 9: Open property details
    // ------------------------------------------------------------------------
    await t.test('9. Open accommodation details (prop-12)', async () => {
      const res = await fetch(`${BASE}/api/accommodations/prop-12`, { headers });
      assert.equal(res.status, 200);
      const data = await res.json();
      assert.equal(data.id, 'prop-12');
      assert.equal(data.city, 'Pune');
    });

    // ------------------------------------------------------------------------
    // Step 10: Open virtual tour (360° Panorama Scenes)
    // ------------------------------------------------------------------------
    await t.test('10. Open and verify 360° virtual room tour scenes', async () => {
      const res = await query('SELECT room_name, panorama_url, is_default FROM virtual_tour_scenes WHERE accommodation_id = $1 ORDER BY id;', ['prop-1']);
      assert.ok(res.rows.length >= 2, 'prop-1 should have multiple virtual tour scenes');
      assert.ok(res.rows.some((s) => s.is_default === true));
      assert.ok(res.rows.every((s) => s.panorama_url.startsWith('http')));
    });

    // ------------------------------------------------------------------------
    // Step 11: Save an accommodation
    // ------------------------------------------------------------------------
    await t.test('11. Save accommodation in persistent PostgreSQL storage', async () => {
      await query('INSERT INTO saved_accommodations (user_id, listing_id) VALUES ($1, $2) ON CONFLICT DO NOTHING;', [userId, 'prop-12']);
      const check = await query('SELECT listing_id FROM saved_accommodations WHERE user_id = $1;', [userId]);
      assert.equal(check.rows.length, 1);
      assert.equal(check.rows[0].listing_id, 'prop-12');
    });

    // ------------------------------------------------------------------------
    // Step 12: Send a booking request
    // ------------------------------------------------------------------------
    await t.test('12. Send a booking request for prop-12', async () => {
      const res = await fetch(`${BASE}/api/booking-requests/prop-12`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          requestedMoveInDate: '2026-12-01',
          occupants: 1,
          message: 'Hello, looking forward to staying here.',
        }),
      });
      assert.equal(res.status, 201);
      const data = await res.json();
      assert.ok(data.request?.id);
      assert.equal(data.request.listingId, 'prop-12');
    });

    // ------------------------------------------------------------------------
    // Step 13: Verify booking status
    // ------------------------------------------------------------------------
    await t.test('13. Verify booking status is pending', async () => {
      const res = await fetch(`${BASE}/api/booking-requests/sent`, { headers });
      assert.equal(res.status, 200);
      const data = await res.json();
      assert.ok(data.requests.some((r) => r.listingId === 'prop-12' && r.status === 'pending'));
    });

    // ------------------------------------------------------------------------
    // Step 14: Send a connection request
    // ------------------------------------------------------------------------
    await t.test('14. Send a connection request to roommate (user-4)', async () => {
      const res = await fetch(`${BASE}/api/connection-requests/user-4`, { method: 'POST', headers });
      assert.equal(res.status, 201);
      const data = await res.json();
      assert.equal(data.request?.receiverId, 'user-4');
    });

    // ------------------------------------------------------------------------
    // Step 15: Accept connection and start conversation
    // ------------------------------------------------------------------------
    await t.test('15. Start conversation with accepted connection', async () => {
      // Simulate user-4 accepting the connection
      await query('UPDATE connection_requests SET status = $1 WHERE sender_id = $2 AND receiver_id = $3;', ['accepted', userId, 'user-4']);
      const res = await fetch(`${BASE}/api/chat/conversations/user-4`, { method: 'POST', headers });
      assert.equal(res.status, 201);
      const data = await res.json();
      assert.ok(data.conversation?.id);
      convId = data.conversation.id;
    });

    // ------------------------------------------------------------------------
    // Step 16: Send a chat message
    // ------------------------------------------------------------------------
    await t.test('16. Send a message in conversation', async () => {
      const res = await fetch(`${BASE}/api/chat/conversations/${convId}/messages`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ content: 'Hi Ananya, excited to connect on NestMate!' }),
      });
      assert.equal(res.status, 201);
      const data = await res.json();
      assert.equal(data.message.content, 'Hi Ananya, excited to connect on NestMate!');
    });

    // ------------------------------------------------------------------------
    // Step 17: Retrieve notifications
    // ------------------------------------------------------------------------
    await t.test('17. Retrieve notifications', async () => {
      const res = await fetch(`${BASE}/api/notifications`, { headers });
      assert.equal(res.status, 200);
      const data = await res.json();
      assert.ok(Array.isArray(data.notifications));
    });

    // ------------------------------------------------------------------------
    // Step 18: Logout and re-login
    // ------------------------------------------------------------------------
    await t.test('18. Logout and re-authenticate', async () => {
      const logout = await fetch(`${BASE}/api/auth/logout`, { method: 'POST', headers });
      assert.equal(logout.status, 201);

      const relogin = await fetch(`${BASE}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: testEmail, password: testPassword }),
      });
      assert.equal(relogin.status, 201);
      const reloginData = await relogin.json();
      assert.ok(reloginData.accessToken);
    });

    // ------------------------------------------------------------------------
    // Step 19: Verify persistent data in PostgreSQL
    // ------------------------------------------------------------------------
    await t.test('19. Verify persistent data in PostgreSQL tables', async () => {
      const userRes = await query('SELECT email, full_name, occupation FROM users WHERE id = $1;', [userId]);
      assert.equal(userRes.rows[0].email, testEmail);
      assert.equal(userRes.rows[0].occupation, 'student');

      const prefRes = await query('SELECT preferred_area, cleanliness FROM roommate_preferences WHERE user_id = $1;', [userId]);
      assert.equal(prefRes.rows[0].preferred_area, 'Kothrud');
      assert.equal(prefRes.rows[0].cleanliness, 'medium');

      const msgRes = await query('SELECT content FROM messages WHERE sender_id = $1;', [userId]);
      assert.equal(msgRes.rows.length, 1);
      assert.equal(msgRes.rows[0].content, 'Hi Ananya, excited to connect on NestMate!');
    });

  } finally {
    // ------------------------------------------------------------------------
    // Step 20: Clean up test records (cascading deletes ensure zero residual data)
    // ------------------------------------------------------------------------
    if (userId) {
      await query('DELETE FROM users WHERE id = $1;', [userId]).catch(() => {});
    }
    await closePool();
  }
});
