const fs = require('node:fs');
const path = require('node:path');

const storePath = path.join(process.cwd(), 'data', 'store.json');

function readStore() {
  if (process.env.NODE_ENV === 'test') return { users: [], profiles: [] };
  try {
    return JSON.parse(fs.readFileSync(storePath, 'utf8'));
  } catch (error) {
    if (error.code === 'ENOENT') return { users: [], profiles: [] };
    throw error;
  }
}

function writeStore(store) {
  if (process.env.NODE_ENV === 'test') return;
  fs.mkdirSync(path.dirname(storePath), { recursive: true });
  const temporaryPath = `${storePath}.tmp`;
  fs.writeFileSync(temporaryPath, JSON.stringify(store, null, 2));
  fs.renameSync(temporaryPath, storePath);
}

module.exports = { readStore, writeStore };
