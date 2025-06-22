const { drizzle } = require('drizzle-orm/postgres-js');
const { migrate } = require('drizzle-orm/postgres-js/migrator');
const postgres = require('postgres');
const path = require('path');

async function runMigrations() {
  const connectionString =
    process.env.DATABASE_URL ||
    'postgresql://postgres:postgres@localhost:5432/htf_sunup_db';

  console.log('🔗 Connecting to database...');
  const sql = postgres(connectionString, { max: 1 });
  const db = drizzle(sql);

  try {
    console.log('🚀 Running database migrations...');

    // En production, utiliser le dossier drizzle copié dans dist/
    // En développement, utiliser le dossier drizzle à la racine
    const migrationsFolder =
      process.env.NODE_ENV === 'production'
        ? path.resolve(__dirname, '../../dist/drizzle') // apps/backend/dist/drizzle
        : path.resolve(__dirname, '../../drizzle'); // apps/backend/drizzle

    console.log('📁 Migrations folder:', migrationsFolder);

    await migrate(db, { migrationsFolder });
    console.log('✅ Database migrations completed successfully');

    // Check if points_value column exists and add it if not (legacy migration)
    console.log('🔍 Checking for legacy schema updates...');
    const result = await sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'actions' AND column_name = 'points_value';
    `;

    if (result.length === 0) {
      console.log('➕ Adding points_value column to actions table...');
      await sql`ALTER TABLE actions ADD COLUMN points_value INTEGER DEFAULT 10;`;
      console.log('✅ points_value column added successfully');
    } else {
      console.log('✅ Legacy schema is up to date');
    }

    console.log('🎉 All migrations completed successfully');
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  } finally {
    await sql.end();
  }
}

runMigrations();
