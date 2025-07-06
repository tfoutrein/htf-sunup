const { drizzle } = require('drizzle-orm/postgres-js');
const { migrate } = require('drizzle-orm/postgres-js/migrator');
const pgClient = require('postgres');
const path = require('path');

async function runMigrations() {
  const connectionString =
    process.env.DATABASE_URL ||
    'postgresql://postgres:postgres@localhost:5432/htf_sunup_db';

  console.log('🔗 Connecting to database...');
  // Utiliser SSL seulement pour les connexions externes (production)
  const isLocalDatabase =
    connectionString.includes('localhost') ||
    connectionString.includes('127.0.0.1');
  const sql = pgClient(connectionString, {
    max: 1,
    ssl: isLocalDatabase ? false : 'require',
  });
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

    // Vérifier et créer les tables manquantes avant les migrations
    console.log('🔍 Checking for missing tables...');

    // Vérifier si la table users existe
    const usersExists = await sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'users'
      );
    `;

    if (!usersExists[0].exists) {
      console.log('📝 Creating missing users table...');
      await sql`
        CREATE TABLE IF NOT EXISTS "users" (
          "id" serial PRIMARY KEY NOT NULL,
          "name" varchar(255) NOT NULL,
          "email" varchar(255) NOT NULL,
          "created_at" timestamp DEFAULT now() NOT NULL,
          "updated_at" timestamp DEFAULT now() NOT NULL,
          "password" varchar(255) NOT NULL,
          "role" varchar(50) DEFAULT 'fbo' NOT NULL,
          "manager_id" integer,
          CONSTRAINT "users_email_unique" UNIQUE("email")
        );
      `;
    }

    // Vérifier si la table challenges existe
    const challengesExists = await sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'challenges'
      );
    `;

    if (!challengesExists[0].exists) {
      console.log('📝 Creating missing challenges table...');
      await sql`
        CREATE TABLE IF NOT EXISTS "challenges" (
          "id" serial PRIMARY KEY NOT NULL,
          "campaign_id" integer NOT NULL,
          "date" date NOT NULL,
          "title" varchar(255) NOT NULL,
          "description" text,
          "value_in_euro" decimal(10,2) DEFAULT 0.50 NOT NULL,
          "created_at" timestamp DEFAULT now() NOT NULL,
          "updated_at" timestamp DEFAULT now() NOT NULL
        );
      `;
    }

    // Vérifier si la table campaigns existe
    const campaignsExists = await sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'campaigns'
      );
    `;

    if (!campaignsExists[0].exists) {
      console.log('📝 Creating missing campaigns table...');
      await sql`
        CREATE TABLE IF NOT EXISTS "campaigns" (
          "id" serial PRIMARY KEY NOT NULL,
          "name" varchar(255) NOT NULL,
          "description" text,
          "start_date" date NOT NULL,
          "end_date" date NOT NULL,
          "status" varchar(50) DEFAULT 'draft' NOT NULL,
          "created_by" integer NOT NULL,
          "created_at" timestamp DEFAULT now() NOT NULL,
          "updated_at" timestamp DEFAULT now() NOT NULL,
          "archived" boolean DEFAULT false NOT NULL
        );
      `;
    }

    // Vérifier si la table actions existe
    const actionsExists = await sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'actions'
      );
    `;

    if (!actionsExists[0].exists) {
      console.log('📝 Creating missing actions table...');
      await sql`
        CREATE TABLE IF NOT EXISTS "actions" (
          "id" serial PRIMARY KEY NOT NULL,
          "title" varchar(255) NOT NULL,
          "description" text,
          "type" varchar(50) NOT NULL,
          "created_at" timestamp DEFAULT now() NOT NULL,
          "updated_at" timestamp DEFAULT now() NOT NULL,
          "challenge_id" integer NOT NULL,
          "order" integer DEFAULT 1 NOT NULL
        );
      `;
    }

    // Vérifier si la table user_actions existe
    const userActionsExists = await sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'user_actions'
      );
    `;

    if (!userActionsExists[0].exists) {
      console.log('📝 Creating missing user_actions table...');
      await sql`
        CREATE TABLE IF NOT EXISTS "user_actions" (
          "id" serial PRIMARY KEY NOT NULL,
          "user_id" integer NOT NULL,
          "action_id" integer NOT NULL,
          "completed" boolean DEFAULT false NOT NULL,
          "completed_at" timestamp,
          "proof_url" varchar(500),
          "created_at" timestamp DEFAULT now() NOT NULL,
          "updated_at" timestamp DEFAULT now() NOT NULL,
          "challenge_id" integer NOT NULL
        );
      `;
    }

    // Vérifier si la table access_requests existe et la supprimer
    const accessRequestsExists = await sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'access_requests'
      );
    `;

    if (accessRequestsExists[0].exists) {
      console.log('🗑️ Dropping access_requests table (no longer needed)...');
      await sql`DROP TABLE "access_requests" CASCADE;`;
    }

    // temporary_password column check removed - access_requests table no longer exists
    console.log(
      '✅ temporary_password column check skipped (access_requests table removed)',
    );

    // Vérifier et ajouter les colonnes Facebook manquantes dans la table users
    console.log('🔍 Checking for Facebook columns in users table...');

    const facebookColumns = [
      { name: 'facebook_id', type: 'varchar(255)', constraint: 'UNIQUE' },
      { name: 'facebook_access_token', type: 'varchar(1000)' },
      { name: 'profile_picture', type: 'varchar(500)' },
      { name: 'auth_provider', type: 'varchar(50)', default: "'local'" },
    ];

    for (const column of facebookColumns) {
      const columnExists = await sql`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = ${column.name}
      `;

      if (columnExists.length === 0) {
        console.log(
          `📝 Adding missing ${column.name} column to users table...`,
        );
        let alterQuery = `ALTER TABLE users ADD COLUMN ${column.name} ${column.type}`;

        if (column.default) {
          alterQuery += ` DEFAULT ${column.default}`;
        }

        await sql.unsafe(alterQuery);

        // Ajouter la contrainte UNIQUE si nécessaire
        if (column.constraint === 'UNIQUE') {
          try {
            await sql.unsafe(
              `ALTER TABLE users ADD CONSTRAINT users_${column.name}_unique UNIQUE(${column.name})`,
            );
          } catch (error) {
            if (!error.message.includes('already exists')) {
              console.warn(
                `⚠️  Warning adding unique constraint for ${column.name}:`,
                error.message,
              );
            }
          }
        }

        console.log(`✅ Added ${column.name} column successfully`);
      } else {
        console.log(`✅ ${column.name} column already exists`);
      }
    }

    // Vérifier et ajouter les colonnes manquantes dans la table actions
    console.log('🔍 Checking for missing columns in actions table...');

    // Vérifier si challenge_id existe
    const challengeIdExists = await sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'actions' AND column_name = 'challenge_id'
    `;

    if (challengeIdExists.length === 0) {
      console.log('📝 Adding challenge_id column to actions table...');
      await sql`ALTER TABLE actions ADD COLUMN challenge_id INTEGER NOT NULL DEFAULT 1;`;
      console.log('✅ Added challenge_id column successfully');
    }

    // Supprimer la colonne points_value si elle existe (migration vers euro-based system)
    const pointsValueExists = await sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'actions' AND column_name = 'points_value'
    `;

    if (pointsValueExists.length > 0) {
      console.log(
        '📝 Removing obsolete points_value column from actions table...',
      );
      await sql`ALTER TABLE actions DROP COLUMN IF EXISTS points_value CASCADE;`;
      console.log('✅ Removed points_value column successfully');
    }

    // Vérifier et ajouter la colonne value_in_euro dans la table challenges
    console.log('🔍 Checking for value_in_euro column in challenges table...');
    const valueInEuroExists = await sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'challenges' AND column_name = 'value_in_euro'
    `;

    if (valueInEuroExists.length === 0) {
      console.log('📝 Adding value_in_euro column to challenges table...');
      await sql`ALTER TABLE challenges ADD COLUMN value_in_euro DECIMAL(10,2) NOT NULL DEFAULT 0.50;`;
      console.log('✅ Added value_in_euro column successfully');
    }

    // Vérifier si order existe
    const orderExists = await sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'actions' AND column_name = 'order'
    `;

    if (orderExists.length === 0) {
      console.log('📝 Adding order column to actions table...');
      await sql`ALTER TABLE actions ADD COLUMN "order" INTEGER DEFAULT 1 NOT NULL;`;
      console.log('✅ Added order column successfully');
    }

    // Supprimer les colonnes obsolètes qui ne correspondent pas au schéma actuel
    const dateColumnExists = await sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'actions' AND column_name = 'date'
    `;

    const createdByColumnExists = await sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'actions' AND column_name = 'created_by'
    `;

    if (dateColumnExists.length > 0) {
      console.log('📝 Removing obsolete date column from actions table...');
      await sql`ALTER TABLE actions DROP COLUMN IF EXISTS date CASCADE;`;
      console.log('✅ Removed obsolete date column successfully');
    }

    if (createdByColumnExists.length > 0) {
      console.log(
        '📝 Removing obsolete created_by column from actions table...',
      );
      await sql`ALTER TABLE actions DROP COLUMN IF EXISTS created_by CASCADE;`;
      console.log('✅ Removed obsolete created_by column successfully');
    }

    // Créer les contraintes de clé étrangère manquantes
    console.log('🔍 Checking for missing foreign key constraints...');

    const constraints = [
      {
        name: 'actions_challenge_id_challenges_id_fk',
        sql: 'ALTER TABLE "actions" ADD CONSTRAINT "actions_challenge_id_challenges_id_fk" FOREIGN KEY ("challenge_id") REFERENCES "challenges"("id") ON DELETE no action ON UPDATE no action',
      },
      {
        name: 'campaigns_created_by_users_id_fk',
        sql: 'ALTER TABLE "campaigns" ADD CONSTRAINT "campaigns_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action',
      },
      {
        name: 'challenges_campaign_id_campaigns_id_fk',
        sql: 'ALTER TABLE "challenges" ADD CONSTRAINT "challenges_campaign_id_campaigns_id_fk" FOREIGN KEY ("campaign_id") REFERENCES "campaigns"("id") ON DELETE no action ON UPDATE no action',
      },
      {
        name: 'user_actions_user_id_users_id_fk',
        sql: 'ALTER TABLE "user_actions" ADD CONSTRAINT "user_actions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action',
      },
      {
        name: 'user_actions_action_id_actions_id_fk',
        sql: 'ALTER TABLE "user_actions" ADD CONSTRAINT "user_actions_action_id_actions_id_fk" FOREIGN KEY ("action_id") REFERENCES "actions"("id") ON DELETE no action ON UPDATE no action',
      },
      {
        name: 'user_actions_challenge_id_challenges_id_fk',
        sql: 'ALTER TABLE "user_actions" ADD CONSTRAINT "user_actions_challenge_id_challenges_id_fk" FOREIGN KEY ("challenge_id") REFERENCES "challenges"("id") ON DELETE no action ON UPDATE no action',
      },
      {
        name: 'users_manager_id_users_id_fk',
        sql: 'ALTER TABLE "users" ADD CONSTRAINT "users_manager_id_users_id_fk" FOREIGN KEY ("manager_id") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action',
      },
    ];

    for (const constraint of constraints) {
      try {
        // Vérifier si la contrainte existe
        const constraintExists = await sql`
          SELECT EXISTS (
            SELECT 1 FROM information_schema.table_constraints 
            WHERE constraint_name = ${constraint.name}
            AND table_schema = 'public'
          );
        `;

        if (!constraintExists[0].exists) {
          console.log(`📝 Creating missing constraint: ${constraint.name}`);
          await sql.unsafe(constraint.sql);
        }
      } catch (error) {
        // Ignorer les erreurs de contraintes déjà existantes
        if (
          !error.message.includes('already exists') &&
          !error.message.includes('duplicate')
        ) {
          console.warn(
            `⚠️  Warning creating constraint ${constraint.name}:`,
            error.message,
          );
        }
      }
    }

    // Vérifier si toutes les tables principales existent déjà
    const allTablesExist =
      usersExists[0].exists &&
      challengesExists[0].exists &&
      campaignsExists[0].exists &&
      actionsExists[0].exists &&
      userActionsExists[0].exists;

    // Toujours vérifier si on doit lancer les migrations Drizzle
    console.log('🔍 Checking Drizzle migration status...');

    let shouldRunDrizzleMigrations = false;

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
        // Vérifier s'il y a des migrations enregistrées
        const existingMigrations = await sql`
          SELECT COUNT(*) as count FROM drizzle.__drizzle_migrations;
        `;

        // Si pas de migrations enregistrées mais tables existent, marquer comme fait
        if (existingMigrations[0].count === 0 && allTablesExist) {
          console.log(
            '📝 Tables exist but no migrations recorded. Marking as migrated...',
          );
          await sql`
            INSERT INTO drizzle.__drizzle_migrations (hash, created_at) 
            VALUES ('manual_existing_schema_${Date.now()}', ${Date.now()})
            ON CONFLICT DO NOTHING;
          `;
          shouldRunDrizzleMigrations = false;
        } else if (existingMigrations[0].count === 0) {
          shouldRunDrizzleMigrations = true;
        } else {
          shouldRunDrizzleMigrations = false;
        }
      } else {
        // Table de migration n'existe pas, on doit lancer les migrations
        shouldRunDrizzleMigrations = true;
      }
    } catch (error) {
      console.log(
        '⚠️ Could not check migration status, will attempt migrations...',
      );
      shouldRunDrizzleMigrations = !allTablesExist;
    }

    if (!shouldRunDrizzleMigrations) {
      console.log(
        '✅ All main tables exist - skipping Drizzle migrations completely',
      );
    } else {
      console.log('🔄 Some tables are missing, running Drizzle migrations...');
      try {
        await migrate(db, { migrationsFolder });
        console.log('✅ Database migrations completed successfully');
      } catch (error) {
        if (
          error.message.includes('duplicate') ||
          error.message.includes('already exists') ||
          (error.message.includes('relation') &&
            error.message.includes('already exists'))
        ) {
          console.log('✅ Database schema is already up to date');
        } else {
          console.error('❌ Migration error details:', error.message);
          throw error;
        }
      }
    }

    // Vérification finale des colonnes legacy
    console.log('🔍 Checking for legacy schema updates...');

    const finalCheckChallengeId = await sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'actions' AND column_name = 'challenge_id';
    `;

    const finalCheckValueInEuro = await sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'challenges' AND column_name = 'value_in_euro';
    `;

    const finalCheckOrder = await sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'actions' AND column_name = 'order';
    `;

    if (finalCheckChallengeId.length === 0) {
      console.log(
        '📝 Final attempt: Adding challenge_id column to actions table...',
      );
      await sql`ALTER TABLE actions ADD COLUMN challenge_id INTEGER NOT NULL DEFAULT 1;`;
      console.log('✅ Added challenge_id column successfully');
    }

    if (finalCheckValueInEuro.length === 0) {
      console.log(
        '📝 Final attempt: Adding value_in_euro column to challenges table...',
      );
      await sql`ALTER TABLE challenges ADD COLUMN value_in_euro DECIMAL(10,2) NOT NULL DEFAULT 0.50;`;
      console.log('✅ Added value_in_euro column successfully');
    }

    if (finalCheckOrder.length === 0) {
      console.log('📝 Final attempt: Adding order column to actions table...');
      await sql`ALTER TABLE actions ADD COLUMN "order" INTEGER DEFAULT 1 NOT NULL;`;
      console.log('✅ Added order column successfully');
    }

    if (
      finalCheckChallengeId.length > 0 &&
      finalCheckValueInEuro.length > 0 &&
      finalCheckOrder.length > 0
    ) {
      console.log('✅ Schema is up to date');
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
