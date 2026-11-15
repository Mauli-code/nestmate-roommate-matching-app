const assert = require('node:assert/strict');
const test = require('node:test');

const isConfiguredForPostgres = process.env.STORAGE_MODE === 'postgres' && Boolean(process.env.DATABASE_URL);

test('PostgreSQL Stage 2 Integration: Users, Roommate Preferences, and Accommodations', {
  skip: !isConfiguredForPostgres ? 'Set STORAGE_MODE=postgres and DATABASE_URL to run PostgreSQL integration tests' : false,
}, async (t) => {

  const { query, closePool } = require('./connection');
  const userRepository = require('../auth/user-repository');
  const profileRepository = require('../matching/profile-repository');
  const accommodationsRepository = require('../accommodations/accommodations.repository');

  const testUserId = `test-user-${Date.now()}`;
  const testUserEmail = `test_${Date.now()}@example.com`;
  const testListingId = `test-prop-${Date.now()}`;

  try {
    // ------------------------------------------------------------------------
    // 1. USER PERSISTENCE TEST
    // ------------------------------------------------------------------------
    await t.test('persists, queries, and updates users in PostgreSQL', async () => {
      const created = await userRepository.save({
        id: testUserId,
        fullName: 'Test Database Student',
        email: testUserEmail,
        passwordHash: '$2a$10$dummyhashfortestingpostgres1234567890123456789012',
        accountStatus: 'active',
        authVersion: 0,
        occupation: 'CS Student',
        city: 'Pune',
        bio: 'Testing PostgreSQL repository integration',
        phone: '+91 99999 88888',
      });

      assert.equal(created.id, testUserId);
      assert.equal(created.email, testUserEmail);

      // Query by ID
      const foundById = await userRepository.findById(testUserId);
      assert.ok(foundById);
      assert.equal(foundById.fullName, 'Test Database Student');
      assert.equal(foundById.city, 'Pune');
      assert.equal(foundById.occupation, 'CS Student');

      // Query by Email (case-insensitive)
      const foundByEmail = await userRepository.findByEmail(testUserEmail.toUpperCase());
      assert.ok(foundByEmail);
      assert.equal(foundByEmail.id, testUserId);

      // Direct SQL check to prove actual PostgreSQL storage
      const directSql = await query('SELECT * FROM users WHERE id = $1;', [testUserId]);
      assert.equal(directSql.rows.length, 1);
      assert.equal(directSql.rows[0].email, testUserEmail);

      // Update user
      const updated = await userRepository.save({
        ...foundById,
        occupation: 'Software Intern',
        bio: 'Updated bio in PostgreSQL',
        authVersion: 1,
      });

      assert.equal(updated.occupation, 'Software Intern');
      assert.equal(updated.authVersion, 1);

      const verifyUpdate = await userRepository.findById(testUserId);
      assert.equal(verifyUpdate.occupation, 'Software Intern');
      assert.equal(verifyUpdate.authVersion, 1);
    });

    // ------------------------------------------------------------------------
    // 2. ROOMMATE PREFERENCES PERSISTENCE TEST (Strict 1:1)
    // ------------------------------------------------------------------------
    await t.test('persists, queries, and updates roommate preferences in PostgreSQL', async () => {
      const savedProfile = await profileRepository.saveProfile({
        id: testUserId,
        budget: 15000,
        minBudget: 10000,
        maxBudget: 20000,
        preferredArea: 'Hinjewadi',
        lifestyle: {
          sleepSchedule: 'early',
          cleanliness: 'high',
          smoking: false,
          pets: 'none',
        },
        foodHabits: 'vegetarian',
        drinking: 'never',
      });

      assert.equal(savedProfile.id, testUserId);
      assert.equal(savedProfile.preferredArea, 'Hinjewadi');
      assert.equal(savedProfile.minBudget, 10000);
      assert.equal(savedProfile.maxBudget, 20000);

      // Read profile
      const loaded = await profileRepository.findProfile(testUserId);
      assert.ok(loaded);
      assert.equal(loaded.preferredArea, 'Hinjewadi');
      assert.equal(loaded.foodHabits, 'vegetarian');
      assert.equal(loaded.lifestyle.sleepSchedule, 'early');
      assert.equal(loaded.lifestyle.smoking, false);

      // Direct SQL verification
      const directPref = await query('SELECT * FROM roommate_preferences WHERE user_id = $1;', [
        testUserId,
      ]);
      assert.equal(directPref.rows.length, 1);
      assert.equal(directPref.rows[0].preferred_area, 'Hinjewadi');

      // Find candidates (should include other seeded users, excluding current user)
      const candidates = await profileRepository.findCandidates(testUserId);
      assert.ok(candidates.length >= 10);
      assert.ok(candidates.every((c) => c.id !== testUserId));

      // Update preferences
      const updatedProfile = await profileRepository.saveProfile({
        ...loaded,
        minBudget: 12000,
        maxBudget: 22000,
        preferredArea: 'Viman Nagar',
        lifestyle: {
          ...loaded.lifestyle,
          cleanliness: 'moderate',
        },
      });

      assert.equal(updatedProfile.preferredArea, 'Viman Nagar');
      assert.equal(updatedProfile.minBudget, 12000);

      const verifyUpdate = await profileRepository.findProfile(testUserId);
      assert.equal(verifyUpdate.preferredArea, 'Viman Nagar');
      assert.equal(verifyUpdate.minBudget, 12000);
      assert.equal(verifyUpdate.lifestyle.cleanliness, 'moderate');
    });

    // ------------------------------------------------------------------------
    // 3. ACCOMMODATION LISTING PERSISTENCE TEST
    // ------------------------------------------------------------------------
    await t.test('persists, filters, and manages accommodations in PostgreSQL', async () => {
      const createdListing = await accommodationsRepository.create({
        id: testListingId,
        ownerId: testUserId,
        title: 'Integration Test 2BHK Flat in Hinjewadi',
        description: 'Test property for PostgreSQL repository integration',
        city: 'Pune',
        preferredArea: 'Hinjewadi',
        type: 'entire_apartment',
        monthlyRent: 17500,
        securityDeposit: 35000,
        availableRooms: 2,
        availableFrom: '2026-12-01',
        status: 'available',
        photoUrls: ['https://example.com/test-photo.jpg'],
        hasVirtualTour: true,
      });

      assert.equal(createdListing.id, testListingId);
      assert.equal(createdListing.monthlyRent, 17500);
      assert.equal(createdListing.hasVirtualTour, true);

      // Find by ID
      const foundListing = await accommodationsRepository.findById(testListingId);
      assert.ok(foundListing);
      assert.equal(foundListing.title, 'Integration Test 2BHK Flat in Hinjewadi');
      assert.equal(foundListing.ownerId, testUserId);
      assert.equal(foundListing.city, 'Pune');
      assert.equal(foundListing.hasVirtualTour, true);

      // Find with filters
      const filteredByArea = await accommodationsRepository.findAvailable({
        preferredArea: 'Hinjewadi',
      });
      assert.ok(filteredByArea.some((l) => l.id === testListingId));

      const filteredByRent = await accommodationsRepository.findAvailable({
        minRent: 15000,
        maxRent: 20000,
        type: 'entire_apartment',
      });
      assert.ok(filteredByRent.some((l) => l.id === testListingId));

      // Direct SQL check
      const directAcc = await query('SELECT * FROM accommodations WHERE id = $1;', [testListingId]);
      assert.equal(directAcc.rows.length, 1);
      assert.equal(Number(directAcc.rows[0].monthly_rent), 17500);

      // Update accommodation
      const updatedListing = await accommodationsRepository.save({
        ...foundListing,
        title: 'Updated 2BHK Flat in Hinjewadi Phase 1',
        monthlyRent: 18000,
      });

      assert.equal(updatedListing.title, 'Updated 2BHK Flat in Hinjewadi Phase 1');
      assert.equal(updatedListing.monthlyRent, 18000);

      const verifyUpdate = await accommodationsRepository.findById(testListingId);
      assert.equal(verifyUpdate.title, 'Updated 2BHK Flat in Hinjewadi Phase 1');
      assert.equal(verifyUpdate.monthlyRent, 18000);
    });

  } finally {
    // ------------------------------------------------------------------------
    // CLEANUP: Clean up test records without affecting the 14 seeded users / 16 properties
    // ------------------------------------------------------------------------
    await query('DELETE FROM accommodations WHERE id = $1;', [testListingId]).catch(() => {});
    await query('DELETE FROM users WHERE id = $1;', [testUserId]).catch(() => {});
    await closePool();
  }
});
