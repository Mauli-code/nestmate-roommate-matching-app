const test = require('node:test');
const assert = require('node:assert/strict');
const { MOCK_PROPERTIES } = require('../src/data/mockData');

test('Mock properties data integrity', () => {
  assert.ok(Array.isArray(MOCK_PROPERTIES));
  assert.equal(MOCK_PROPERTIES.length, 10, 'Expected 10 properties in mock dataset');

  for (const property of MOCK_PROPERTIES) {
    assert.ok(property.id, 'Property must have an id');
    assert.ok(property.title, 'Property must have a title');
    assert.ok(typeof property.rent === 'number' && property.rent > 0, 'Rent must be positive number');
    assert.ok(property.location, 'Property must have a location');
    assert.ok(property.fullAddress, 'Property must have a full address');
    assert.ok(['PG', 'Flat', 'Shared Room', 'Private Room'].includes(property.type), 'Valid property type');
    assert.ok(property.bedrooms >= 1, 'Bedrooms must be >= 1');
    assert.ok(['Fully Furnished', 'Semi-Furnished', 'Unfurnished'].includes(property.furnishing));
    assert.ok(property.availability, 'Availability must be defined');
    assert.ok(property.image, 'Image URL must be defined');
    assert.ok(Array.isArray(property.amenities) && property.amenities.length > 0, 'Must have amenities');
    assert.ok(typeof property.popularity === 'number', 'Popularity must be a number');
    assert.ok(typeof property.postedDaysAgo === 'number', 'postedDaysAgo must be a number');
  }
});

test('Search filtering by title, location, and type works correctly', () => {
  // Search by location: "Bangalore"
  const bangaloreProps = MOCK_PROPERTIES.filter(p =>
    p.location.toLowerCase().includes('bangalore') ||
    p.title.toLowerCase().includes('bangalore')
  );
  assert.ok(bangaloreProps.length >= 3, 'Should find Bangalore properties');

  // Search by type: "PG"
  const pgProps = MOCK_PROPERTIES.filter(p =>
    p.type.toLowerCase().includes('pg') ||
    p.title.toLowerCase().includes('pg')
  );
  assert.ok(pgProps.length >= 2, 'Should find PG properties');

  // Search by name: "Koramangala"
  const koraProps = MOCK_PROPERTIES.filter(p =>
    p.title.toLowerCase().includes('koramangala') ||
    p.location.toLowerCase().includes('koramangala')
  );
  assert.ok(koraProps.length >= 1, 'Should find Koramangala property');
});

test('Property filters for type, rent range, furnishing, and bedrooms', () => {
  // Filter by Flat
  const flats = MOCK_PROPERTIES.filter(p => p.type === 'Flat');
  assert.ok(flats.length >= 4, 'Should have multiple flats');

  // Filter by rent range (10K - 20K)
  const midRent = MOCK_PROPERTIES.filter(p => p.rent >= 10000 && p.rent <= 20000);
  assert.ok(midRent.length >= 3, 'Should find properties between 10k and 20k');
  for (const p of midRent) {
    assert.ok(p.rent >= 10000 && p.rent <= 20000);
  }

  // Filter by furnishing: Fully Furnished
  const furnished = MOCK_PROPERTIES.filter(p => p.furnishing === 'Fully Furnished');
  assert.ok(furnished.length >= 4);

  // Filter by bedrooms: 2
  const twoBeds = MOCK_PROPERTIES.filter(p => p.bedrooms === 2);
  assert.ok(twoBeds.length >= 2);
  for (const p of twoBeds) {
    assert.equal(p.bedrooms, 2);
  }

  // Filter by availability: Available Now
  const availableNow = MOCK_PROPERTIES.filter(p => p.availability === 'Available Now');
  assert.ok(availableNow.length >= 5);
});

test('Sorting properties by price, newest, and popularity', () => {
  // Price Ascending (Low to High)
  const priceAsc = [...MOCK_PROPERTIES].sort((a, b) => a.rent - b.rent);
  for (let i = 0; i < priceAsc.length - 1; i++) {
    assert.ok(priceAsc[i].rent <= priceAsc[i + 1].rent, 'Price should be ascending');
  }

  // Price Descending (High to Low)
  const priceDesc = [...MOCK_PROPERTIES].sort((a, b) => b.rent - a.rent);
  for (let i = 0; i < priceDesc.length - 1; i++) {
    assert.ok(priceDesc[i].rent >= priceDesc[i + 1].rent, 'Price should be descending');
  }

  // Newest (lowest postedDaysAgo)
  const newest = [...MOCK_PROPERTIES].sort((a, b) => a.postedDaysAgo - b.postedDaysAgo);
  for (let i = 0; i < newest.length - 1; i++) {
    assert.ok(newest[i].postedDaysAgo <= newest[i + 1].postedDaysAgo, 'Newest should have lowest postedDaysAgo');
  }

  // Popularity Descending
  const popular = [...MOCK_PROPERTIES].sort((a, b) => b.popularity - a.popularity);
  for (let i = 0; i < popular.length - 1; i++) {
    assert.ok(popular[i].popularity >= popular[i + 1].popularity, 'Popularity should be descending');
  }
});

test('Property details can be resolved by ID', () => {
  for (const property of MOCK_PROPERTIES) {
    const found = MOCK_PROPERTIES.find(p => p.id === property.id);
    assert.ok(found, `Property with id ${property.id} must be found`);
    assert.equal(found.title, property.title);
  }
});
