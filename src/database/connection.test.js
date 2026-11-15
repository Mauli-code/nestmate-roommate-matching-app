const assert = require('node:assert/strict');
const test = require('node:test');
const { getStorageMode, isPostgres, getDatabaseUrl, query } = require('./connection');

test('database connection module: respects storage mode configuration', () => {
  const originalMode = process.env.STORAGE_MODE;
  try {
    process.env.STORAGE_MODE = 'memory';
    assert.equal(getStorageMode(), 'memory');
    assert.equal(isPostgres(), false);

    process.env.STORAGE_MODE = 'postgres';
    assert.equal(getStorageMode(), 'postgres');
    assert.equal(isPostgres(), true);
  } finally {
    process.env.STORAGE_MODE = originalMode;
  }
});

test('database connection module: resolves database URLs safely', () => {
  const originalUrl = process.env.DATABASE_URL;
  try {
    process.env.DATABASE_URL = 'postgresql://testuser:secret@localhost:5432/nestmate_custom';
    assert.match(getDatabaseUrl(), /nestmate_/);
  } finally {
    process.env.DATABASE_URL = originalUrl;
  }
});

test('database connection module: rejects raw queries when STORAGE_MODE is memory', async () => {
  const originalMode = process.env.STORAGE_MODE;
  try {
    process.env.STORAGE_MODE = 'memory';
    await assert.rejects(
      query('SELECT 1'),
      /Cannot execute PostgreSQL query in 'memory' mode/
    );
  } finally {
    process.env.STORAGE_MODE = originalMode;
  }
});
