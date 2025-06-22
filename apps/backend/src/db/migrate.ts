const { drizzle } = require('drizzle-orm/postgres-js');
const { migrate } = require('drizzle-orm/postgres-js/migrator');
const postgres = require('postgres');
const path = require('path');
const fs = require('fs');

async function runMigrations() {
  const connectionString =
    process.env.DATABASE_URL ||
    'postgresql://postgres:postgres@localhost:5432/htf_sunup_db';

  console.log('🔗 Connecting to database...');
  const sql = postgres(connectionString, { max: 1 });
  const db = drizzle(sql);

  try {
    console.log('🚀 Running database migrations...');

    // Essayer différents chemins pour trouver le dossier drizzle
    const possiblePaths = [
      path.resolve(process.cwd(), 'drizzle'),
      path.resolve(__dirname, '../../drizzle'),
      path.resolve(process.cwd(), 'apps/backend/drizzle'),
    ];

    let migrationsFolder = null;
    for (const possiblePath of possiblePaths) {
      console.log('🔍 Checking path:', possiblePath);
      if (fs.existsSync(path.join(possiblePath, 'meta', '_journal.json'))) {
        migrationsFolder = possiblePath;
        break;
      }
    }

    if (!migrationsFolder) {
      throw new Error('Could not find migrations folder with _journal.json');
    }

    console.log('📁 Migrations folder found:', migrationsFolder);

    await migrate(db, { migrationsFolder });
    console.log('✅ Database migrations completed successfully');

    // Check if points_value column exists and add it if not (legacy migration)
    console.log('🔍 Checking for legacy schema updates...');
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
      console.log('✅ Legacy column added successfully');
    } else {
      console.log('✅ Legacy schema is up to date');
    }

    console.log('🎉 All migrations completed successfully');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await sql.end();
  }
}

module.exports = { runMigrations };

// If run directly
if (require.main === module) {
  runMigrations();
}
