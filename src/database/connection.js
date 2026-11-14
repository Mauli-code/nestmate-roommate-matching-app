const { Pool } = require('pg');

let pool = null;

function getStorageMode() {
  if (process.env.STORAGE_MODE) {
    return process.env.STORAGE_MODE.toLowerCase();
  }
  // Default to memory mode in test environment unless explicitly set to postgres
  if (process.env.NODE_ENV === 'test') {
    return 'memory';
  }
  return process.env.DATABASE_URL ? 'postgres' : 'memory';
}

function isPostgres() {
  return getStorageMode() === 'postgres';
}

function getDatabaseUrl() {
  if (process.env.NODE_ENV === 'test' && process.env.TEST_DATABASE_URL) {
    return process.env.TEST_DATABASE_URL;
  }
  return (
    process.env.DATABASE_URL ||
    'postgresql://postgres:postgres@localhost:5432/nestmate_db'
  );
}

function getPool() {
  if (!pool) {
    const connectionString = getDatabaseUrl();
    pool = new Pool({
      connectionString,
      max: Number(process.env.PG_POOL_MAX) || 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000,
    });

    pool.on('error', (err) => {
      console.error('Unexpected error on idle PostgreSQL client:', err.message);
    });
  }
  return pool;
}

async function query(text, params) {
  const mode = getStorageMode();
  if (mode !== 'postgres') {
    throw new Error(
      `Cannot execute PostgreSQL query in '${mode}' mode. Set STORAGE_MODE=postgres and DATABASE_URL in .env.`
    );
  }

  const start = Date.now();
  try {
    const p = getPool();
    const result = await p.query(text, params);
    const duration = Date.now() - start;
    if (process.env.DEBUG_SQL === 'true') {
      console.log('Executed query', { text, duration: `${duration}ms`, rows: result.rowCount });
    }
    return result;
  } catch (error) {
    error.message = `[PostgreSQL Query Error] ${error.message} (Query: ${text.substring(0, 80)}...)`;
    throw error;
  }
}

async function getClient() {
  const mode = getStorageMode();
  if (mode !== 'postgres') {
    throw new Error(
      `Cannot acquire PostgreSQL client in '${mode}' mode. Set STORAGE_MODE=postgres.`
    );
  }
  return getPool().connect();
}

async function checkConnection(urlOverride) {
  const connectionString = urlOverride || getDatabaseUrl();
  const testPool = new Pool({
    connectionString,
    connectionTimeoutMillis: 3000,
  });

  try {
    const result = await testPool.query('SELECT version(), current_database(), current_user;');
    await testPool.end();
    return {
      connected: true,
      database: result.rows[0].current_database,
      user: result.rows[0].current_user,
      version: result.rows[0].version,
      connectionString: connectionString.replace(/:[^:@]*@/, ':****@'),
    };
  } catch (error) {
    await testPool.end().catch(() => {});
    return {
      connected: false,
      error: error.message,
      code: error.code,
      connectionString: connectionString.replace(/:[^:@]*@/, ':****@'),
    };
  }
}

async function closePool() {
  if (pool) {
    await pool.end();
    pool = null;
  }
}

module.exports = {
  getStorageMode,
  isPostgres,
  getDatabaseUrl,
  getPool,
  query,
  getClient,
  checkConnection,
  closePool,
};
