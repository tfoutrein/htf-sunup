const { drizzle } = require('drizzle-orm/postgres-js');
const pgClient = require('postgres');

async function fixProofsTable() {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    console.error('❌ DATABASE_URL not found');
    process.exit(1);
  }

  console.log('🔗 Connecting to database...');
  const isLocalDatabase =
    connectionString.includes('localhost') ||
    connectionString.includes('127.0.0.1');
  const sql = pgClient(connectionString, {
    max: 1,
    ssl: isLocalDatabase ? false : 'require',
  });

  try {
    console.log('🔍 Checking proofs table...');

    const proofsExists = await sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'proofs'
      );
    `;

    if (proofsExists[0].exists) {
      console.log('✅ proofs table already exists - no action needed');
      return;
    }

    console.log('❌ proofs table missing - creating now...');

    // Vérifier les dépendances
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

    if (!userActionsExists[0].exists || !dailyBonusExists[0].exists) {
      console.log(
        '❌ Dependencies missing - cannot create proofs table safely',
      );
      console.log(`   user_actions: ${userActionsExists[0].exists}`);
      console.log(`   daily_bonus: ${dailyBonusExists[0].exists}`);
      process.exit(1);
    }

    console.log('✅ Dependencies verified - proceeding with table creation');

    // Créer la table proofs (contenu de 0007_busy_veda.sql)
    await sql`
      CREATE TABLE "proofs" (
        "id" serial PRIMARY KEY NOT NULL,
        "url" varchar(500) NOT NULL,
        "type" varchar(50) NOT NULL,
        "original_name" varchar(255) NOT NULL,
        "size" integer NOT NULL,
        "mime_type" varchar(100) NOT NULL,
        "user_action_id" integer,
        "daily_bonus_id" integer,
        "created_at" timestamp DEFAULT now() NOT NULL,
        "updated_at" timestamp DEFAULT now() NOT NULL
      );
    `;

    console.log('✅ proofs table created successfully');

    // Ajouter les contraintes de clés étrangères
    console.log('🔗 Adding foreign key constraints...');

    await sql`
      ALTER TABLE "proofs" 
      ADD CONSTRAINT "proofs_user_action_id_user_actions_id_fk" 
      FOREIGN KEY ("user_action_id") 
      REFERENCES "public"."user_actions"("id") 
      ON DELETE cascade ON UPDATE no action;
    `;

    await sql`
      ALTER TABLE "proofs" 
      ADD CONSTRAINT "proofs_daily_bonus_id_daily_bonus_id_fk" 
      FOREIGN KEY ("daily_bonus_id") 
      REFERENCES "public"."daily_bonus"("id") 
      ON DELETE cascade ON UPDATE no action;
    `;

    console.log('✅ Foreign key constraints added successfully');

    // Créer des index pour les performances
    console.log('📊 Creating performance indexes...');

    await sql`
      CREATE INDEX IF NOT EXISTS "idx_proofs_user_action_id" 
      ON "proofs" ("user_action_id");
    `;

    await sql`
      CREATE INDEX IF NOT EXISTS "idx_proofs_daily_bonus_id" 
      ON "proofs" ("daily_bonus_id");
    `;

    console.log('✅ Performance indexes created successfully');

    // Marquer la migration comme effectuée dans Drizzle
    console.log('📝 Recording migration in Drizzle...');

    try {
      // Vérifier si la table de migration Drizzle existe
      const drizzleTableExists = await sql`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'drizzle' 
          AND table_name = '__drizzle_migrations'
        );
      `;

      if (drizzleTableExists[0].exists) {
        // Enregistrer la migration 0007
        await sql`
          INSERT INTO drizzle.__drizzle_migrations (hash, created_at) 
          VALUES ('0007_busy_veda', ${Date.now()})
          ON CONFLICT DO NOTHING;
        `;
        console.log('✅ Migration 0007_busy_veda recorded in Drizzle');
      } else {
        console.log('⚠️ Drizzle migration table not found - skipping record');
      }
    } catch (error) {
      console.log('⚠️ Could not record migration in Drizzle:', error.message);
    }

    // Vérification finale
    console.log('🔍 Final verification...');

    const finalCheck = await sql`
      SELECT 
        table_name,
        (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = 'proofs') as column_count,
        (SELECT COUNT(*) FROM information_schema.table_constraints WHERE table_name = 'proofs' AND constraint_type = 'FOREIGN KEY') as fk_count
      FROM information_schema.tables 
      WHERE table_name = 'proofs';
    `;

    if (finalCheck.length > 0) {
      console.log(
        `✅ Table created with ${finalCheck[0].column_count} columns and ${finalCheck[0].fk_count} foreign keys`,
      );
    }

    console.log('🎉 proofs table fix completed successfully!');
    console.log('🔄 The application should now work correctly');
  } catch (error) {
    console.error('❌ Fix failed:', error.message);
    console.error('Stack trace:', error.stack);
    process.exit(1);
  } finally {
    await sql.end();
  }
}

fixProofsTable();
