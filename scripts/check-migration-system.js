#!/usr/bin/env node

/**
 * Script pour vérifier comment Drizzle va gérer les migrations lors du déploiement
 * Analyse le système et donne des recommandations
 */

const postgres = require('../apps/backend/node_modules/postgres');
const fs = require('fs');
const path = require('path');

const PROD_DB_URL = process.env.PROD_DB_URL || 
  'postgresql://htf_sunup_postgres_user:NxW7QrfoU2l7Lry090Q69gj8qDkgFny0@dpg-d1b8fsadbo4c73c9ier0-a.oregon-postgres.render.com/htf_sunup_postgres';

async function checkMigrationSystem() {
  console.log('🔍 Vérification du Système de Migrations pour le Déploiement');
  console.log('=' .repeat(70));
  console.log('');

  const sql = postgres(PROD_DB_URL, {
    ssl: 'require',
    max: 1,
  });

  try {
    // Récupérer les migrations en prod avec les hash complets
    console.log('📊 Migrations en Production:');
    const prodMigrations = await sql`
      SELECT id, hash, created_at 
      FROM drizzle.__drizzle_migrations 
      ORDER BY id
    `;
    
    prodMigrations.forEach(m => {
      const date = new Date(parseInt(m.created_at)).toISOString().split('T')[0];
      console.log(`   [${m.id}] ${m.hash} (${date})`);
    });
    console.log('');

    // Lire les migrations locales
    const journalPath = path.join(__dirname, '../apps/backend/drizzle/meta/_journal.json');
    const localJournal = JSON.parse(fs.readFileSync(journalPath, 'utf8'));
    
    console.log('📁 Migrations Locales:');
    localJournal.entries.forEach(entry => {
      const date = new Date(entry.when).toISOString().split('T')[0];
      console.log(`   [${entry.idx}] ${entry.tag} (${date})`);
    });
    console.log('');

    // Analyse critique
    console.log('=' .repeat(70));
    console.log('🎯 ANALYSE CRITIQUE');
    console.log('-'.repeat(70));
    console.log('');

    console.log('❓ Question Principale:');
    console.log('   Comment Drizzle va-t-il gérer les numéros de migration différents ?');
    console.log('');

    console.log('📝 Observations:');
    console.log('   1. Prod a migrations 0-7, puis 283-285 (IDs non consécutifs)');
    console.log('   2. Local a migrations 0-11 (IDs consécutifs)');
    console.log('   3. Drizzle utilise le "hash" (tag) pour identifier les migrations');
    console.log('   4. Les IDs sont juste des auto-increment dans la table');
    console.log('');

    console.log('🤔 Correspondances Probables:');
    console.log('   - Prod 0-7 = Local 0-7 (même période juin-juillet 2025)');
    console.log('   - Prod 283 = Local 8 (tous deux août 2025)');
    console.log('   - Prod 284 = Local 9 (tous deux 31 août 2025)');
    console.log('   - Prod 285 = Local 10 (tous deux 31 août 2025)');
    console.log('   - Local 11 (0011_add_performance_indexes) = NOUVEAU en prod');
    console.log('');

    console.log('⚠️  PROBLÈME POTENTIEL:');
    console.log('   Si les hash (tags) des migrations 0-7 locales ne correspondent PAS');
    console.log('   exactement aux hash des migrations 0-7 en prod, Drizzle va essayer');
    console.log('   de les réappliquer → ERREUR (tables déjà existantes)');
    console.log('');

    console.log('✅ SI les hash correspondent (cas le plus probable):');
    console.log('   1. Drizzle voit que migrations 0-7 sont déjà appliquées');
    console.log('   2. Drizzle voit que migrations 8-10 locales ne sont PAS en prod');
    console.log('      (car prod a 283-285 avec des hash différents)');
    console.log('   3. Drizzle va essayer d\'appliquer migrations 8-10 locales');
    console.log('   4. Puis appliquer migration 11 (indexes)');
    console.log('');

    console.log('🚨 RISQUE MAJEUR:');
    console.log('   Les migrations 8-10 locales vont probablement essayer de créer');
    console.log('   des tables/colonnes qui EXISTENT DÉJÀ (via migrations 283-285)');
    console.log('   → ÉCHEC DU DÉPLOIEMENT');
    console.log('');

    // Solution
    console.log('=' .repeat(70));
    console.log('💡 SOLUTION RECOMMANDÉE');
    console.log('-'.repeat(70));
    console.log('');

    console.log('🎯 Option 1: Baseline Drizzle en Prod (RECOMMANDÉ)');
    console.log('');
    console.log('   Mettre à jour manuellement la table __drizzle_migrations en prod');
    console.log('   pour "dire" à Drizzle que migrations 8-10 sont déjà appliquées:');
    console.log('');
    console.log('   ```sql');
    console.log('   -- Mettre à jour les IDs des migrations existantes');
    console.log('   UPDATE drizzle.__drizzle_migrations SET id = 8, hash = \'0008_brave_songbird\' WHERE id = 283;');
    console.log('   UPDATE drizzle.__drizzle_migrations SET id = 9, hash = \'0009_daily_chat\' WHERE id = 284;');
    console.log('   UPDATE drizzle.__drizzle_migrations SET id = 10, hash = \'0010_perpetual_magneto\' WHERE id = 285;');
    console.log('   ```');
    console.log('');
    console.log('   Ensuite, lors du déploiement, Drizzle verra:');
    console.log('   - Migrations 0-10: déjà appliquées ✅');
    console.log('   - Migration 11: nouvelle → à appliquer ✅');
    console.log('');
    console.log('   ⚠️  MAIS: Il faut vérifier que 283-285 correspondent bien à 8-10');
    console.log('');

    console.log('🎯 Option 2: Appliquer Uniquement Migration 11 Manuellement');
    console.log('');
    console.log('   1. Appliquer manuellement 0011_add_performance_indexes.sql en prod');
    console.log('   2. Ajouter une entrée dans __drizzle_migrations:');
    console.log('      INSERT INTO drizzle.__drizzle_migrations (id, hash, created_at)');
    console.log('      VALUES (11, \'0011_add_performance_indexes\', <timestamp>);');
    console.log('   3. Déployer normalement');
    console.log('');
    console.log('   ✅ Drizzle verra que tout est à jour et ne fera rien');
    console.log('');

    console.log('🎯 Option 3: Créer une Nouvelle Migration 0012');
    console.log('');
    console.log('   1. Renommer 0011 en 0012 localement');
    console.log('   2. Ajouter manuellement des entrées 8-10-11 dans __drizzle_migrations');
    console.log('      en prod pour correspondre aux 283-285');
    console.log('   3. Déployer - seule la 0012 sera appliquée');
    console.log('');

    // Recommandation finale
    console.log('=' .repeat(70));
    console.log('🚀 RECOMMANDATION FINALE');
    console.log('-'.repeat(70));
    console.log('');
    console.log('✅ MEILLEURE APPROCHE: Option 2 (Application Manuelle)');
    console.log('');
    console.log('📋 Plan d\'action:');
    console.log('   1. Créer un backup complet de la prod');
    console.log('   2. Appliquer manuellement la migration 0011 (indexes):');
    console.log('      psql $PROD_DB_URL -f apps/backend/drizzle/0011_add_performance_indexes.sql');
    console.log('   3. Enregistrer dans Drizzle:');
    console.log('      psql $PROD_DB_URL -c "');
    console.log('        INSERT INTO drizzle.__drizzle_migrations (id, hash, created_at)');
    console.log('        VALUES (11, \'0011_add_performance_indexes\', EXTRACT(EPOCH FROM NOW()) * 1000);');
    console.log('      "');
    console.log('   4. Vérifier que les 43 indexes sont créés');
    console.log('   5. Merger vers main et déployer');
    console.log('   6. Le déploiement verra que tout est à jour');
    console.log('');
    console.log('⏱️  Temps total: 15 minutes');
    console.log('⚠️  Risque: Très faible (CREATE INDEX IF NOT EXISTS)');
    console.log('✅ Avantage: Pas de conflit de migrations');
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
checkMigrationSystem().catch(err => {
  console.error('❌ Erreur fatale:', err);
  process.exit(1);
});

