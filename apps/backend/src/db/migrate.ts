const { drizzle } = require('drizzle-orm/postgres-js');
const { migrate } = require('drizzle-orm/postgres-js/migrator');
const postgres = require('postgres');

async function ensurePointsValueColumn() {
  const connectionString =
    process.env.DATABASE_URL ||
    'postgresql://postgres:postgres@localhost:5432/htf_sunup_db';

  console.log('🔗 Connecting to database...');
  const sql = postgres(connectionString, { max: 1 });

  try {
    console.log('🔍 Checking database schema...');

    // Check if points_value column exists
    const result = await sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'actions' 
      AND column_name = 'points_value'
    `;

    if (result.length === 0) {
      console.log('➕ Adding points_value column to actions table...');
      await sql`
        ALTER TABLE actions 
        ADD COLUMN points_value integer DEFAULT 10 NOT NULL
      `;
      console.log('✅ Column added successfully');
    } else {
      console.log('✅ Database schema is up to date');
    }
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await sql.end();
  }
}

export async function runMigrations() {
  await ensurePointsValueColumn();
  console.log('🎉 All migrations completed successfully');
}

// If run directly
if (require.main === module) {
  runMigrations();
}
