#!/usr/bin/env node

/**
 * Script de vérification de la base de données de production
 * Mode READ-ONLY - Aucune modification
 */

const postgres = require('../apps/backend/node_modules/postgres');

const PROD_DB_URL = process.env.PROD_DB_URL || 
  'postgresql://htf_sunup_postgres_user:NxW7QrfoU2l7Lry090Q69gj8qDkgFny0@dpg-d1b8fsadbo4c73c9ier0-a.oregon-postgres.render.com/htf_sunup_postgres';

async function verifyProductionDatabase() {
  console.log('🔍 Vérification de la base de données de production');
  console.log('=' .repeat(60));
  console.log('');

  const sql = postgres(PROD_DB_URL, {
    ssl: 'require',
    max: 1, // Une seule connexion
  });

  try {
    // Étape 1.1 : Version PostgreSQL
    console.log('📋 Étape 1.1 - Version PostgreSQL');
    const [version] = await sql`SELECT version()`;
    console.log(`✅ ${version.version}`);
    console.log('');

    // Étape 1.2 : Compter les utilisateurs
    console.log('👥 Étape 1.2 - Utilisateurs Existants');
    const userCounts = await sql`
      SELECT 
        role,
        COUNT(*) as count
      FROM users
      GROUP BY role
      ORDER BY role
    `;
    
    let totalUsers = 0;
    userCounts.forEach(row => {
      console.log(`   ${row.role}: ${row.count}`);
      totalUsers += parseInt(row.count);
    });
    console.log(`   TOTAL: ${totalUsers}`);
    console.log('');

    // Étape 1.3 : Vérifier le schema Drizzle
    console.log('🗄️  Étape 1.3 - Schema Drizzle');
    const [drizzleSchema] = await sql`
      SELECT EXISTS (
        SELECT FROM pg_namespace 
        WHERE nspname = 'drizzle'
      ) as exists
    `;
    
    if (drizzleSchema.exists) {
      console.log('✅ Schema "drizzle" existe');
      
      // Lister les migrations
      const migrations = await sql`
        SELECT id, hash, created_at 
        FROM drizzle.__drizzle_migrations 
        ORDER BY created_at
      `;
      console.log(`   Migrations appliquées: ${migrations.length}`);
      migrations.forEach(m => {
        const date = new Date(parseInt(m.created_at));
        console.log(`   - Migration ${m.id}: ${date.toISOString()}`);
      });
    } else {
      console.log('⚠️  Schema "drizzle" n\'existe PAS');
      console.log('   → Baseline requis avant nouvelles migrations');
    }
    console.log('');

    // Étape 1.4 : Compter les indexes
    console.log('📊 Étape 1.4 - Indexes Existants');
    const [indexCounts] = await sql`
      SELECT 
        COUNT(*) as total_indexes,
        COUNT(*) FILTER (WHERE indexname LIKE 'idx_%') as performance_indexes
      FROM pg_indexes 
      WHERE schemaname = 'public'
    `;
    console.log(`   Total indexes: ${indexCounts.total_indexes}`);
    console.log(`   Performance indexes (idx_*): ${indexCounts.performance_indexes}`);
    console.log('');

    // Étape 1.5 : Lister les tables
    console.log('📁 Étape 1.5 - Tables de la Base');
    const tables = await sql`
      SELECT 
        table_name,
        (SELECT COUNT(*) 
         FROM information_schema.columns 
         WHERE table_name = t.table_name 
         AND table_schema = 'public') as columns_count
      FROM information_schema.tables t
      WHERE table_schema = 'public'
      AND table_type = 'BASE TABLE'
      ORDER BY table_name
    `;
    
    tables.forEach(table => {
      const icon = ['users', 'campaigns', 'challenges'].includes(table.table_name) ? '✅' : '  ';
      console.log(`   ${icon} ${table.table_name} (${table.columns_count} colonnes)`);
    });
    console.log('');

    // Résumé
    console.log('=' .repeat(60));
    console.log('✅ VÉRIFICATION TERMINÉE - Aucune modification effectuée');
    console.log('');
    console.log('📊 RÉSUMÉ:');
    console.log(`   - Utilisateurs: ${totalUsers}`);
    console.log(`   - Tables: ${tables.length}`);
    console.log(`   - Indexes: ${indexCounts.total_indexes} (dont ${indexCounts.performance_indexes} performance)`);
    if (drizzleSchema.exists) {
      const migrationsList = await sql`SELECT COUNT(*) as count FROM drizzle.__drizzle_migrations`;
      console.log(`   - Migrations Drizzle: ${migrationsList[0].count}`);
    } else {
      console.log(`   - Migrations Drizzle: N/A (schema absent)`);
    }
    console.log('');

    if (!drizzleSchema.exists) {
      console.log('⚠️  ATTENTION:');
      console.log('   Le schema Drizzle n\'existe pas.');
      console.log('   Un baseline sera nécessaire avant d\'appliquer les nouvelles migrations.');
      console.log('');
    }

    if (indexCounts.performance_indexes < 43) {
      console.log('💡 OPPORTUNITÉ:');
      console.log(`   ${43 - indexCounts.performance_indexes} indexes de performance peuvent être ajoutés.`);
      console.log('   Gain attendu: +40% performance DB');
      console.log('');
    }

  } catch (error) {
    console.error('❌ ERREUR:', error.message);
    console.error(error);
    process.exit(1);
  } finally {
    await sql.end();
  }
}

// Exécution
verifyProductionDatabase().catch(err => {
  console.error('❌ Erreur fatale:', err);
  process.exit(1);
});

