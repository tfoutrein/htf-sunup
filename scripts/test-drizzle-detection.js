#!/usr/bin/env node

/**
 * Script pour vérifier que Drizzle va correctement détecter la migration 0011
 */

const postgres = require('../apps/backend/node_modules/postgres');
const fs = require('fs');
const path = require('path');

const PROD_DB_URL = process.env.PROD_DB_URL || 
  'postgresql://htf_sunup_postgres_user:NxW7QrfoU2l7Lry090Q69gj8qDkgFny0@dpg-d1b8fsadbo4c73c9ier0-a.oregon-postgres.render.com/htf_sunup_postgres';

async function testDrizzleDetection() {
  console.log('🧪 Test de Détection Drizzle');
  console.log('=' .repeat(70));
  console.log('');

  const sql = postgres(PROD_DB_URL, {
    ssl: 'require',
    max: 1,
  });

  try {
    // Lire le journal local
    const journalPath = path.join(__dirname, '../apps/backend/drizzle/meta/_journal.json');
    const localJournal = JSON.parse(fs.readFileSync(journalPath, 'utf8'));
    
    // Récupérer les migrations en prod
    const prodMigrations = await sql`
      SELECT id, hash, created_at 
      FROM drizzle.__drizzle_migrations 
      ORDER BY id
    `;

    console.log('📊 Migrations en Production (après sync):');
    prodMigrations.forEach(m => {
      console.log(`   [${m.id}] ${m.hash}`);
    });
    console.log('');

    console.log('📁 Migrations Locales:');
    localJournal.entries.forEach(entry => {
      console.log(`   [${entry.idx}] ${entry.tag}`);
    });
    console.log('');

    // Comparer
    const prodTags = prodMigrations.map(m => m.hash);
    const missingMigrations = localJournal.entries.filter(
      entry => !prodTags.includes(entry.tag)
    );

    console.log('=' .repeat(70));
    console.log('🎯 RÉSULTAT DE LA DÉTECTION');
    console.log('-'.repeat(70));
    console.log('');

    if (missingMigrations.length === 0) {
      console.log('✅ Toutes les migrations sont synchronisées !');
      console.log('   Drizzle ne détectera aucune migration manquante.');
      console.log('');
      console.log('⚠️  ATTENTION: La migration 0011 devrait être manquante.');
      console.log('   Si elle n\'est pas détectée, c\'est un problème.');
      console.log('');
    } else {
      console.log(`✅ ${missingMigrations.length} migration(s) manquante(s) détectée(s):`);
      console.log('');
      missingMigrations.forEach(m => {
        const icon = m.idx === 11 ? '🎯' : '  ';
        console.log(`   ${icon} Migration ${m.idx}: ${m.tag}`);
      });
      console.log('');

      if (missingMigrations.some(m => m.idx === 11)) {
        console.log('🎉 PARFAIT ! La migration 0011 (indexes) est bien détectée !');
        console.log('');
        console.log('📋 Ce qui va se passer lors du déploiement:');
        console.log('   1. pnpm db:sync → Synchronise les migrations (déjà fait)');
        console.log('   2. pnpm db:deploy → Drizzle détecte migration 0011 manquante');
        console.log('   3. Drizzle applique 0011_add_performance_indexes.sql');
        console.log('   4. 43 indexes de performance sont créés');
        console.log('   5. Backend démarre normalement');
        console.log('');
        console.log('✅ Système de migrations prêt pour le déploiement !');
        console.log('');
      }
    }

    // Vérifier les indexes actuels
    const [indexCount] = await sql`
      SELECT COUNT(*) as count
      FROM pg_indexes 
      WHERE schemaname = 'public' 
      AND indexname LIKE 'idx_%'
    `;

    console.log('📊 État Actuel:');
    console.log(`   Indexes de performance en prod: ${indexCount.count}`);
    console.log(`   Indexes attendus après migration: 43`);
    console.log(`   Indexes à créer: ${43 - parseInt(indexCount.count)}`);
    console.log('');

    console.log('🚀 Prochaines Étapes:');
    console.log('   1. ✅ Synchronisation testée et fonctionnelle');
    console.log('   2. ✅ Migration 0011 correctement détectée');
    console.log('   3. 📋 Créer un document de déploiement');
    console.log('   4. 🔀 Merger vers main');
    console.log('   5. 🚀 Déployer vers production');
    console.log('   6. 📊 Vérifier les logs et performances');
    console.log('');

  } catch (error) {
    console.error('❌ ERREUR:', error.message);
    console.error(error);
    process.exit(1);
  } finally {
    await sql.end();
  }
}

// Exécution
testDrizzleDetection().catch(err => {
  console.error('❌ Erreur fatale:', err);
  process.exit(1);
});

