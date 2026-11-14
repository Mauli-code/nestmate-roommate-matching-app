const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const test = require('node:test');
const { readStore, writeStore } = require('./store-file');

test('writes users and profiles to JSON and reads them back', () => {
  const previousMode = process.env.NODE_ENV;
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'nestmate-store-'));
  const filePath = path.join(directory, 'store.json');
  const store = {
    users: [{ id: 'user-1', email: 'person@example.com' }],
    profiles: [{ id: 'user-1', preferredArea: 'Pune' }],
  };

  try {
    process.env.NODE_ENV = 'development';
    writeStore(store, filePath);
    assert.deepEqual(readStore(filePath), store);
  } finally {
    if (previousMode === undefined) delete process.env.NODE_ENV;
    else process.env.NODE_ENV = previousMode;
    fs.rmSync(directory, { recursive: true, force: true });
  }
});

test('does not write a store file in test mode', () => {
  const previousMode = process.env.NODE_ENV;
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'nestmate-store-'));
  const filePath = path.join(directory, 'store.json');

  try {
    process.env.NODE_ENV = 'test';
    writeStore({ users: [], profiles: [] }, filePath);
    assert.equal(fs.existsSync(filePath), false);
  } finally {
    if (previousMode === undefined) delete process.env.NODE_ENV;
    else process.env.NODE_ENV = previousMode;
    fs.rmSync(directory, { recursive: true, force: true });
  }
});
