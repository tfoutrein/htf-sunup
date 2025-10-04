import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import postgres from 'postgres';
import * as path from 'path';

async function runMigrations() {
  const connectionString =
    process.env.DATABASE_URL ||
    'postgresql://postgres:postgres@localhost:5432/htf_sunup_db';

  console.log('🔗 Connecting to database...');

  // Configuration SSL : désactiver pour localhost, activer pour production
  const isLocalDatabase =
    connectionString.includes('localhost') ||
    connectionString.includes('127.0.0.1');

  const sql = postgres(connectionString, {
    max: 1,
    ssl: isLocalDatabase ? false : 'require',
  });

  try {
    console.log('🚀 Running Drizzle migrations...');

    // Déterminer le dossier de migrations
    const migrationsFolder =
      process.env.NODE_ENV === 'production'
        ? path.resolve(__dirname, '../../dist/drizzle')
        : path.resolve(__dirname, '../../drizzle');

    console.log('📁 Migrations folder:', migrationsFolder);

    // Créer l'instance Drizzle
    const db = drizzle(sql);

    // Lancer les migrations Drizzle
    await migrate(db, { migrationsFolder });

    console.log('✅ Database migrations completed successfully');
    console.log('🎉 All tables and indexes created via Drizzle migrations');
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
  } finally {
    await sql.end();
  }
}

runMigrations();
