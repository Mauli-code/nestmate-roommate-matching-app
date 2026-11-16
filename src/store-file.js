const fs = require('node:fs');
const path = require('node:path');

const storePath = path.join(process.cwd(), 'data', 'store.json');

function readStore(filePath = storePath) {
  if (process.env.NODE_ENV === 'test') return { users: [], profiles: [] };
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch (error) {
    if (error.code === 'ENOENT') return { users: [], profiles: [] };
    throw error;
  }
}

function writeStore(store, filePath = storePath) {
  if (process.env.NODE_ENV === 'test') return;
  // Vercel and other read-only environments: skip file writes silently.
  // Data stays in-memory for the lifetime of the function instance.
  try {
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    const temporaryPath = `${filePath}.tmp`;
    fs.writeFileSync(temporaryPath, JSON.stringify(store, null, 2));
    fs.renameSync(temporaryPath, filePath);
  } catch {
    // Read-only filesystem — data lives in memory only
  }
}

module.exports = { readStore, writeStore };
