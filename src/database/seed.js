const fs = require('node:fs');
const path = require('node:path');
const { Pool } = require('pg');
const { getDatabaseUrl } = require('./connection');

async function seed(databaseUrl) {
  const url = databaseUrl || getDatabaseUrl();
  const pool = new Pool({ connectionString: url, connectionTimeoutMillis: 5000 });
  const seedPath = path.join(process.cwd(), 'database', 'seed.sql');
  const sql = fs.readFileSync(seedPath, 'utf8');

  console.log(`[Seed] Seeding database at: ${url.replace(/:[^:@]*@/, ':****@')}`);
  const client = await pool.connect();
  try {
    await client.query('BEGIN;');
    await client.query(sql);
    await client.query('COMMIT;');
    console.log('[Seed] Seed script executed successfully.');

    const counts = {};
    const tables = [
      'users',
      'roommate_preferences',
      'amenities',
      'accommodations',
      'accommodation_amenities',
      'virtual_tour_scenes',
      'booking_requests',
      'connection_requests',
      'saved_accommodations',
      'saved_roommates',
      'reviews',
      'conversations',
      'messages',
      'notifications',
      'notification_preferences',
      'privacy_settings',
    ];
    for (const table of tables) {
      const res = await client.query(`SELECT COUNT(*)::int AS count FROM ${table};`);
      counts[table] = res.rows[0].count;
    }
    console.log('[Seed] Row counts:', counts);
    return { success: true, counts };
  } catch (error) {
    await client.query('ROLLBACK;').catch(() => {});
    console.error('[Seed Error] Seeding failed:', error.message);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

if (require.main === module) {
  seed()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}

module.exports = { seed };
