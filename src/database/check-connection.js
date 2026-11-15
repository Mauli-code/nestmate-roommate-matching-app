const { checkConnection, getDatabaseUrl, getStorageMode } = require('./connection');

async function main() {
  const mode = getStorageMode();
  console.log('============================================================');
  console.log('NestMate Database Connectivity Check');
  console.log('============================================================');
  console.log(`Active STORAGE_MODE: ${mode}`);
  console.log(`Target URL:          ${getDatabaseUrl().replace(/:[^:@]*@/, ':****@')}`);
  console.log('------------------------------------------------------------');

  const status = await checkConnection();
  if (status.connected) {
    console.log('✅ PostgreSQL Status: CONNECTED');
    console.log(`   Connected User:    ${status.user}`);
    console.log(`   Database Name:     ${status.database}`);
    console.log(`   Server Version:    ${status.version.split(',')[0]}`);
    console.log('------------------------------------------------------------');
    return true;
  } else {
    console.log('❌ PostgreSQL Status: NOT CONNECTED');
    console.log(`   Error Message:     ${status.error}`);
    if (status.code) console.log(`   Error Code:        ${status.code}`);
    console.log('------------------------------------------------------------');
    console.log('Troubleshooting tips:');
    if (status.code === '28P01') {
      console.log('• Password authentication failed. Update DATABASE_URL in .env with your PostgreSQL password:');
      console.log('  DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@localhost:5432/nestmate_db');
    } else if (status.code === '3D000') {
      console.log('• Database does not exist yet. Create it by running:');
      console.log('  createdb nestmate_db  (or via psql: CREATE DATABASE nestmate_db;)');
    } else if (status.code === 'ECONNREFUSED') {
      console.log('• PostgreSQL server is not running on port 5432.');
    }
    console.log('============================================================');
    return false;
  }
}

if (require.main === module) {
  main().then((ok) => process.exit(ok ? 0 : 1));
}

module.exports = { main };
