const test = require('node:test');
const assert = require('node:assert/strict');
const {
  MOCK_RECOMMENDED_ROOMMATES,
  MOCK_RECOMMENDED_ACCOMMODATIONS,
  MOCK_PROPERTIES,
} = require('../src/data/mockData');
const {
  parseSearchTokens,
  searchRoommates,
  searchProperties,
  searchHomeRoommates,
  searchHomeAccommodations,
} = require('../src/utils/searchUtils');

// ─── Token Parser Tests ──────────────────────────────────────────────────────

test('parseSearchTokens trims whitespace, lowers case, and splits multiple words', () => {
  assert.deepEqual(parseSearchTokens(''), []);
  assert.deepEqual(parseSearchTokens('   '), []);
  assert.deepEqual(parseSearchTokens(null), []);
  assert.deepEqual(parseSearchTokens(undefined), []);
  assert.deepEqual(parseSearchTokens('Sarah'), ['sarah']);
  assert.deepEqual(parseSearchTokens('  SaRah   Chen  '), ['sarah', 'chen']);
  assert.deepEqual(parseSearchTokens('KORAMANGALA   BANGALORE'), ['koramangala', 'bangalore']);
});

// ─── Roommate Search Tests ───────────────────────────────────────────────────

test('searchRoommates with empty query returns all roommates', () => {
  const all = searchRoommates(MOCK_RECOMMENDED_ROOMMATES, '');
  assert.equal(all.length, MOCK_RECOMMENDED_ROOMMATES.length);

  const whitespaceOnly = searchRoommates(MOCK_RECOMMENDED_ROOMMATES, '    ');
  assert.equal(whitespaceOnly.length, MOCK_RECOMMENDED_ROOMMATES.length);
});

test('searchRoommates matches by name with case-insensitivity and whitespace trimming', () => {
  // Lowercase
  const lower = searchRoommates(MOCK_RECOMMENDED_ROOMMATES, 'sarah');
  assert.ok(lower.length >= 1);
  assert.equal(lower[0].name, 'Sarah Chen');

  // Uppercase
  const upper = searchRoommates(MOCK_RECOMMENDED_ROOMMATES, 'SARAH');
  assert.equal(upper.length, lower.length);
  assert.equal(upper[0].name, 'Sarah Chen');

  // Mixed case with spaces
  const mixed = searchRoommates(MOCK_RECOMMENDED_ROOMMATES, '   sArAh   ');
  assert.equal(mixed.length, lower.length);

  // Full name
  const fullName = searchRoommates(MOCK_RECOMMENDED_ROOMMATES, 'David Miller');
  assert.ok(fullName.length >= 1);
  assert.equal(fullName[0].name, 'David Miller');
});

test('searchRoommates matches by location and neighborhood', () => {
  // Central area
  const central = searchRoommates(MOCK_RECOMMENDED_ROOMMATES, 'Central');
  assert.ok(central.length >= 3, 'Should find multiple roommates in Central area');
  for (const r of central) {
    const area = (r.preferredArea || r.location || '').toLowerCase();
    assert.ok(area.includes('central') || (r.bio && r.bio.toLowerCase().includes('central')));
  }

  // Manhattan in bio
  const manhattan = searchRoommates(MOCK_RECOMMENDED_ROOMMATES, 'manhattan');
  assert.ok(manhattan.length >= 1);
  assert.ok(manhattan.some((r) => r.name === 'Sarah Chen'));
});

test('searchRoommates preserves compatibility scores and breakdown', () => {
  const results = searchRoommates(MOCK_RECOMMENDED_ROOMMATES, 'Sarah Chen');
  assert.equal(results.length, 1);
  const candidate = results[0];
  assert.equal(candidate.score, 96);
  assert.ok(candidate.breakdown);
  assert.equal(candidate.breakdown.budget, 25);
  assert.equal(candidate.breakdown.location, 25);
});

test('searchRoommates returns empty list when no matches exist', () => {
  const empty = searchRoommates(MOCK_RECOMMENDED_ROOMMATES, 'NonExistentRoommateNameXYZ');
  assert.equal(empty.length, 0);

  const noLocation = searchRoommates(MOCK_RECOMMENDED_ROOMMATES, 'Antarctica');
  assert.equal(noLocation.length, 0);
});

test('searchRoommates works combined with filters and sorting', () => {
  // Search 'Central' + Max Budget 1150
  const filtered = searchRoommates(
    MOCK_RECOMMENDED_ROOMMATES,
    'Central',
    { maxBudget: 1150 },
    'budget_asc'
  );
  assert.ok(filtered.length >= 1);
  for (const r of filtered) {
    assert.ok(r.budget <= 1150);
  }
  // Verify budget ascending sort
  for (let i = 0; i < filtered.length - 1; i++) {
    assert.ok(filtered[i].budget <= filtered[i + 1].budget);
  }

  // Search 'Central' + Non-smoker + Sort by compatibility
  const nonSmokers = searchRoommates(
    MOCK_RECOMMENDED_ROOMMATES,
    'Central',
    { nonSmokerOnly: true },
    'compatibility'
  );
  assert.ok(nonSmokers.length >= 2);
  for (let i = 0; i < nonSmokers.length - 1; i++) {
    assert.ok(nonSmokers[i].score >= nonSmokers[i + 1].score);
  }
});

// ─── Accommodation Property Search Tests ─────────────────────────────────────

test('searchProperties with empty query returns all properties', () => {
  const all = searchProperties(MOCK_PROPERTIES, '');
  assert.equal(all.length, MOCK_PROPERTIES.length);

  const spaces = searchProperties(MOCK_PROPERTIES, '     ');
  assert.equal(spaces.length, MOCK_PROPERTIES.length);
});

test('searchProperties matches by title and location with case-insensitivity and whitespace trimming', () => {
  // Lowercase location
  const bangalore = searchProperties(MOCK_PROPERTIES, 'bangalore');
  assert.ok(bangalore.length >= 2, 'Should match Bangalore properties');

  // Uppercase location with trailing spaces
  const bangaloreUpper = searchProperties(MOCK_PROPERTIES, '  BANGALORE  ');
  assert.equal(bangaloreUpper.length, bangalore.length);

  // Partial match: "kora" matches "Koramangala"
  const kora = searchProperties(MOCK_PROPERTIES, 'kora');
  assert.ok(kora.length >= 1);
  assert.ok(kora[0].title.toLowerCase().includes('koramangala'));

  // By City: Mumbai / Bandra
  const mumbai = searchProperties(MOCK_PROPERTIES, 'mumbai');
  assert.ok(mumbai.length >= 1);
  assert.ok(mumbai[0].location.toLowerCase().includes('mumbai'));
});

test('searchProperties handles multi-word cross-attribute queries', () => {
  // "Bangalore Flat" -> title/type + location
  const bangaloreFlats = searchProperties(MOCK_PROPERTIES, 'Bangalore Flat');
  assert.ok(bangaloreFlats.length >= 1);
  for (const p of bangaloreFlats) {
    assert.equal(p.type, 'Flat');
    assert.ok(p.location.toLowerCase().includes('bangalore'));
  }

  // "1BHK Koramangala"
  const kora1bhk = searchProperties(MOCK_PROPERTIES, '1BHK Koramangala');
  assert.ok(kora1bhk.length >= 1);
  assert.ok(kora1bhk[0].title.includes('1BHK'));
});

test('searchProperties searches amenities keywords', () => {
  const wifiProps = searchProperties(MOCK_PROPERTIES, 'WiFi');
  assert.ok(wifiProps.length >= 5);

  const powerBackup = searchProperties(MOCK_PROPERTIES, 'Power Backup');
  assert.ok(powerBackup.length >= 3);
});

test('searchProperties returns empty when no properties match', () => {
  const none = searchProperties(MOCK_PROPERTIES, 'Zanzibar Penthouse 999');
  assert.equal(none.length, 0);
});

test('searchProperties combines search with rent filters and sorting', () => {
  // Search "Bangalore" + filter Flat + maxRent 20000 + sort price_asc
  const affordableFlats = searchProperties(
    MOCK_PROPERTIES,
    'Bangalore',
    { type: 'Flat', maxRent: 20000 },
    'price_asc'
  );
  assert.ok(affordableFlats.length >= 1);
  for (const p of affordableFlats) {
    assert.equal(p.type, 'Flat');
    assert.ok(p.rent <= 20000);
    assert.ok(p.location.toLowerCase().includes('bangalore'));
  }
  for (let i = 0; i < affordableFlats.length - 1; i++) {
    assert.ok(affordableFlats[i].rent <= affordableFlats[i + 1].rent);
  }
});

// ─── Home Screen Search & Pill Filter Tests ──────────────────────────────────

test('searchHomeRoommates matches query and applies filter pills', () => {
  // Search query
  const sarah = searchHomeRoommates(MOCK_RECOMMENDED_ROOMMATES, 'Sarah');
  assert.equal(sarah.length, 1);
  assert.equal(sarah[0].name, 'Sarah Chen');

  // Pill: Under $1,200
  const under1200 = searchHomeRoommates(MOCK_RECOMMENDED_ROOMMATES, '', 'Under $1,200');
  assert.ok(under1200.length >= 2);
  for (const r of under1200) {
    assert.ok(r.budget <= 1200);
  }

  // Pill: Pet Friendly
  const petFriendly = searchHomeRoommates(MOCK_RECOMMENDED_ROOMMATES, '', 'Pet Friendly');
  assert.ok(petFriendly.length >= 1);
  assert.ok(petFriendly.some((r) => r.name === 'Marcus Vance'));

  // Combined: Search 'Central' + Pill 'Under $1,200'
  const centralUnder1200 = searchHomeRoommates(MOCK_RECOMMENDED_ROOMMATES, 'Central', 'Under $1,200');
  assert.ok(centralUnder1200.length >= 2);
  for (const r of centralUnder1200) {
    assert.ok(r.budget <= 1200);
    assert.equal(r.preferredArea, 'Central');
  }
});

test('searchHomeAccommodations matches query and applies filter pills', () => {
  // Search Manhattan
  const manhattan = searchHomeAccommodations(MOCK_RECOMMENDED_ACCOMMODATIONS, 'Manhattan');
  assert.ok(manhattan.length >= 1);
  assert.ok(manhattan[0].location.toLowerCase().includes('manhattan'));

  // Pill: Under $1,200
  const cheapAccom = searchHomeAccommodations(MOCK_RECOMMENDED_ACCOMMODATIONS, '', 'Under $1,200');
  assert.ok(cheapAccom.length >= 2);
  for (const a of cheapAccom) {
    assert.ok(a.rent <= 1200);
  }

  // Pill: Near Campus
  const nearCampus = searchHomeAccommodations(MOCK_RECOMMENDED_ACCOMMODATIONS, '', 'Near Campus');
  assert.ok(nearCampus.length >= 1);
  assert.ok(nearCampus[0].distance.toLowerCase().includes('nyu') || nearCampus[0].location.toLowerCase().includes('manhattan'));
});
