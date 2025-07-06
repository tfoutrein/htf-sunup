// Script de correction de la base de données pour Render
// Ce script peut être exécuté via npm run render:fix-db

const { Client } = require('pg');

async function fixDatabase() {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    console.error('❌ DATABASE_URL not found');
    process.exit(1);
  }

  console.log('🔗 Connecting to Render database...');

  // Configuration SSL pour Render
  const client = new Client({
    connectionString: connectionString,
    ssl: {
      rejectUnauthorized: false,
    },
  });

  try {
    await client.connect();
    console.log('✅ Connected to database');

    // Vérifier si la table proofs existe
    const result = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'proofs'
      );
    `);

    if (result.rows[0].exists) {
      console.log('✅ proofs table already exists - no action needed');
      return;
    }

    console.log('❌ proofs table missing - creating now...');

    // Vérifier les dépendances
    const userActionsCheck = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'user_actions'
      );
    `);

    const dailyBonusCheck = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'daily_bonus'
      );
    `);

    if (!userActionsCheck.rows[0].exists || !dailyBonusCheck.rows[0].exists) {
      console.log(
        '❌ Dependencies missing - cannot create proofs table safely',
      );
      console.log(`   user_actions: ${userActionsCheck.rows[0].exists}`);
      console.log(`   daily_bonus: ${dailyBonusCheck.rows[0].exists}`);
      process.exit(1);
    }

    console.log('✅ Dependencies verified - proceeding with table creation');

    // Créer la table proofs
    await client.query(`
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
    `);

    console.log('✅ proofs table created successfully');

    // Ajouter les contraintes de clés étrangères
    console.log('🔗 Adding foreign key constraints...');

    await client.query(`
      ALTER TABLE "proofs" 
      ADD CONSTRAINT "proofs_user_action_id_user_actions_id_fk" 
      FOREIGN KEY ("user_action_id") 
      REFERENCES "public"."user_actions"("id") 
      ON DELETE cascade ON UPDATE no action;
    `);

    await client.query(`
      ALTER TABLE "proofs" 
      ADD CONSTRAINT "proofs_daily_bonus_id_daily_bonus_id_fk" 
      FOREIGN KEY ("daily_bonus_id") 
      REFERENCES "public"."daily_bonus"("id") 
      ON DELETE cascade ON UPDATE no action;
    `);

    console.log('✅ Foreign key constraints added successfully');

    // Créer des index pour les performances
    console.log('📊 Creating performance indexes...');

    await client.query(`
      CREATE INDEX IF NOT EXISTS "idx_proofs_user_action_id" 
      ON "proofs" ("user_action_id");
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS "idx_proofs_daily_bonus_id" 
      ON "proofs" ("daily_bonus_id");
    `);

    console.log('✅ Performance indexes created successfully');

    // Vérification finale
    console.log('🔍 Final verification...');

    const finalCheck = await client.query(`
      SELECT 
        table_name,
        (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = 'proofs') as column_count,
        (SELECT COUNT(*) FROM information_schema.table_constraints WHERE table_name = 'proofs' AND constraint_type = 'FOREIGN KEY') as fk_count
      FROM information_schema.tables 
      WHERE table_name = 'proofs';
    `);

    if (finalCheck.rows.length > 0) {
      console.log(
        `✅ Table created with ${finalCheck.rows[0].column_count} columns and ${finalCheck.rows[0].fk_count} foreign keys`,
      );
    }

    console.log('🎉 Database fix completed successfully!');
    console.log('🔄 The application should now work correctly');
  } catch (error) {
    console.error('❌ Database fix failed:', error.message);
    console.error('Stack trace:', error.stack);
    process.exit(1);
  } finally {
    await client.end();
  }
}

fixDatabase();
