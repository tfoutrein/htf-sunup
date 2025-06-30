const { drizzle: drizzleFixClient } = require('drizzle-orm/postgres-js');
const postgresFixClient = require('postgres');

async function addMissingTemporaryPasswordColumn() {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    console.error('❌ DATABASE_URL not found');
    process.exit(1);
  }

  const isLocalDatabase =
    connectionString.includes('localhost') ||
    connectionString.includes('127.0.0.1');
  const sql = postgresFixClient(connectionString, {
    max: 1,
    ssl: isLocalDatabase ? false : 'require',
  });

  try {
    console.log('🔗 Connecting to database...');

    // Vérifier si la colonne existe déjà
    const columnExists = await sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'access_requests' 
      AND column_name = 'temporary_password'
    `;

    if (columnExists.length > 0) {
      console.log('✅ Column temporary_password already exists');
      return;
    }

    console.log('📝 Adding missing temporary_password column...');
    await sql`ALTER TABLE access_requests ADD COLUMN IF NOT EXISTS temporary_password varchar(255);`;

    console.log('✅ Successfully added temporary_password column');
  } catch (error) {
    console.error('❌ Error adding column:', error);
    process.exit(1);
  } finally {
    await sql.end();
  }
}

addMissingTemporaryPasswordColumn();
