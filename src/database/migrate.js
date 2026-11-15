const fs = require('node:fs');
const path = require('node:path');
const { Pool } = require('pg');
const { getDatabaseUrl } = require('./connection');

async function migrate(databaseUrl) {
  const url = databaseUrl || getDatabaseUrl();
  const pool = new Pool({ connectionString: url, connectionTimeoutMillis: 5000 });
  const schemaPath = path.join(process.cwd(), 'database', 'schema.sql');
  const sql = fs.readFileSync(schemaPath, 'utf8');

  console.log(`[Migration] Running schema migration against: ${url.replace(/:[^:@]*@/, ':****@')}`);
  const client = await pool.connect();
  try {
    await client.query('BEGIN;');
    await client.query(sql);
    await client.query('COMMIT;');
    console.log('[Migration] Schema migration applied successfully.');

    const res = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name;
    `);

    const tables = res.rows.map((r) => r.table_name);
    console.log(`[Migration] Verified ${tables.length} tables in schema:`, tables.join(', '));
    return { success: true, tables };
  } catch (error) {
    await client.query('ROLLBACK;').catch(() => {});
    console.error('[Migration Error] Migration failed:', error.message);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

if (require.main === module) {
  migrate()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}

module.exports = { migrate };
