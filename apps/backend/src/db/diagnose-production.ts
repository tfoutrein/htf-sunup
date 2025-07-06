const { drizzle: drizzleDiagnoseProd } = require('drizzle-orm/postgres-js');
const pgDiagnoseProdClient = require('postgres');

async function diagnoseProduction() {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    console.error('❌ DATABASE_URL not found');
    process.exit(1);
  }

  console.log('🔗 Connecting to production database...');
  const isLocalDatabase =
    connectionString.includes('localhost') ||
    connectionString.includes('127.0.0.1');
  const sql = pgDiagnoseProdClient(connectionString, {
    max: 1,
    ssl: isLocalDatabase ? false : 'require',
  });

  try {
    console.log('🔍 Checking database tables...');

    // Liste des tables essentielles
    const tables = [
      'users',
      'campaigns',
      'challenges',
      'actions',
      'user_actions',
      'daily_bonus',
      'campaign_bonus_config',
      'proofs', // Table manquante
    ];

    for (const tableName of tables) {
      const exists = await sql`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = ${tableName}
        );
      `;

      console.log(
        `${exists[0].exists ? '✅' : '❌'} Table "${tableName}": ${exists[0].exists ? 'EXISTS' : 'MISSING'}`,
      );
    }

    // Vérifier le statut des migrations Drizzle
    console.log('\n🔍 Checking Drizzle migrations...');

    try {
      const drizzleTableExists = await sql`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'drizzle' 
          AND table_name = '__drizzle_migrations'
        );
      `;

      if (drizzleTableExists[0].exists) {
        const migrations = await sql`
          SELECT hash, created_at FROM drizzle.__drizzle_migrations 
          ORDER BY created_at;
        `;

        console.log(
          `✅ Drizzle migration table exists with ${migrations.length} entries:`,
        );
        migrations.forEach((migration, index) => {
          console.log(
            `   ${index + 1}. ${migration.hash} (${new Date(migration.created_at).toISOString()})`,
          );
        });
      } else {
        console.log('❌ Drizzle migration table does not exist');
      }
    } catch (error) {
      console.log('❌ Error checking Drizzle migrations:', error.message);
    }

    // Spécifiquement pour la table proofs
    console.log('\n🎯 Focusing on proofs table...');

    const proofsExists = await sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'proofs'
      );
    `;

    if (!proofsExists[0].exists) {
      console.log('❌ CRITICAL: proofs table is missing!');
      console.log(
        '📝 This table should be created by migration 0007_busy_veda.sql',
      );

      // Vérifier si les tables de référence existent
      const userActionsExists = await sql`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = 'user_actions'
        );
      `;

      const dailyBonusExists = await sql`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = 'daily_bonus'
        );
      `;

      console.log(
        `   Dependencies: user_actions=${userActionsExists[0].exists}, daily_bonus=${dailyBonusExists[0].exists}`,
      );

      if (userActionsExists[0].exists && dailyBonusExists[0].exists) {
        console.log('✅ Dependencies exist - safe to create proofs table');
      } else {
        console.log('❌ Dependencies missing - need to run full migration');
      }
    } else {
      console.log('✅ proofs table exists');

      // Vérifier la structure
      const columns = await sql`
        SELECT column_name, data_type, is_nullable 
        FROM information_schema.columns 
        WHERE table_name = 'proofs' 
        ORDER BY ordinal_position;
      `;

      console.log('📋 Table structure:');
      columns.forEach((col) => {
        console.log(
          `   - ${col.column_name}: ${col.data_type} ${col.is_nullable === 'YES' ? '(nullable)' : '(not null)'}`,
        );
      });
    }

    console.log('\n🎉 Diagnosis completed');
  } catch (error) {
    console.error('❌ Diagnosis failed:', error.message);
    process.exit(1);
  } finally {
    await sql.end();
  }
}

diagnoseProduction();
