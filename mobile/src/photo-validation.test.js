const assert = require('node:assert/strict');
const test = require('node:test');

test('accepts supported photos up to the 5 MB limit', async () => {
  const { validateProfilePhoto } = await import('./photo-validation.js');
  assert.equal(validateProfilePhoto({ mimeType: 'image/jpeg', fileSize: 5 * 1024 * 1024 }), '');
  assert.equal(validateProfilePhoto({ mimeType: 'image/webp', file: { size: 1024 } }), '');
});

test('rejects unsupported photos and sizes it cannot verify', async () => {
  const { validateProfilePhoto } = await import('./photo-validation.js');
  assert.match(validateProfilePhoto({ mimeType: 'image/gif', fileSize: 50 }), /JPEG, PNG, or WebP/);
  assert.match(validateProfilePhoto({ mimeType: 'image/png', fileSize: 5 * 1024 * 1024 + 1 }), /5 MB or smaller/);
  assert.match(validateProfilePhoto({ mimeType: 'image/png' }), /Could not read the photo size/);
});
