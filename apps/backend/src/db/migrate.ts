const { drizzle } = require('drizzle-orm/postgres-js');
const { migrate } = require('drizzle-orm/postgres-js/migrator');
const postgres = require('postgres');
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
  const sql = postgres(connectionString, {
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
          "points_value" integer DEFAULT 10 NOT NULL,
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

    // Vérifier si la table access_requests existe
    const accessRequestsExists = await sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'access_requests'
      );
    `;

    if (!accessRequestsExists[0].exists) {
      console.log('📝 Creating missing access_requests table...');
      await sql`
        CREATE TABLE IF NOT EXISTS "access_requests" (
          "id" serial PRIMARY KEY NOT NULL,
          "name" varchar(255) NOT NULL,
          "email" varchar(255) NOT NULL,
          "requested_role" varchar(50) DEFAULT 'fbo' NOT NULL,
          "requested_manager_id" integer,
          "status" varchar(50) DEFAULT 'pending' NOT NULL,
          "message" text,
          "reviewed_by" integer,
          "reviewed_at" timestamp,
          "review_comment" text,
          "created_at" timestamp DEFAULT now() NOT NULL,
          "updated_at" timestamp DEFAULT now() NOT NULL,
          CONSTRAINT "access_requests_email_unique" UNIQUE("email")
        );
      `;
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

    // Vérifier si points_value existe
    const pointsValueExists = await sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'actions' AND column_name = 'points_value'
    `;

    if (pointsValueExists.length === 0) {
      console.log('📝 Adding points_value column to actions table...');
      await sql`ALTER TABLE actions ADD COLUMN points_value INTEGER DEFAULT 10 NOT NULL;`;
      console.log('✅ Added points_value column successfully');
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
      {
        name: 'access_requests_requested_manager_id_users_id_fk',
        sql: 'ALTER TABLE "access_requests" ADD CONSTRAINT "access_requests_requested_manager_id_users_id_fk" FOREIGN KEY ("requested_manager_id") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action',
      },
      {
        name: 'access_requests_reviewed_by_users_id_fk',
        sql: 'ALTER TABLE "access_requests" ADD CONSTRAINT "access_requests_reviewed_by_users_id_fk" FOREIGN KEY ("reviewed_by") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action',
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
      userActionsExists[0].exists &&
      accessRequestsExists[0].exists;

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

    const finalCheckPointsValue = await sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'actions' AND column_name = 'points_value';
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

    if (finalCheckPointsValue.length === 0) {
      console.log(
        '📝 Final attempt: Adding points_value column to actions table...',
      );
      await sql`ALTER TABLE actions ADD COLUMN points_value INTEGER DEFAULT 10 NOT NULL;`;
      console.log('✅ Added points_value column successfully');
    }

    if (finalCheckOrder.length === 0) {
      console.log('📝 Final attempt: Adding order column to actions table...');
      await sql`ALTER TABLE actions ADD COLUMN "order" INTEGER DEFAULT 1 NOT NULL;`;
      console.log('✅ Added order column successfully');
    }

    if (
      finalCheckChallengeId.length > 0 &&
      finalCheckPointsValue.length > 0 &&
      finalCheckOrder.length > 0
    ) {
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
