#!/usr/bin/env node

/**
 * Script pour lister les indexes en production et comparer avec la migration 0011
 * Mode READ-ONLY - Aucune modification
 */

const postgres = require('../apps/backend/node_modules/postgres');

const PROD_DB_URL = process.env.PROD_DB_URL || 
  'postgresql://htf_sunup_postgres_user:NxW7QrfoU2l7Lry090Q69gj8qDkgFny0@dpg-d1b8fsadbo4c73c9ier0-a.oregon-postgres.render.com/htf_sunup_postgres';

// Liste des indexes attendus de la migration 0011
const EXPECTED_INDEXES = [
  // Users table
  'idx_users_manager_id',
  'idx_users_role',
  'idx_users_facebook_id',
  // User Actions table
  'idx_user_actions_user_id',
  'idx_user_actions_challenge_id',
  'idx_user_actions_action_id',
  'idx_user_actions_completed',
  'idx_user_actions_user_challenge',
  'idx_user_actions_completed_at',
  // Daily Bonus table
  'idx_daily_bonus_user_id',
  'idx_daily_bonus_campaign_id',
  'idx_daily_bonus_status',
  'idx_daily_bonus_bonus_date',
  'idx_daily_bonus_reviewed_by',
  'idx_daily_bonus_user_campaign',
  'idx_daily_bonus_campaign_status',
  // Challenges table
  'idx_challenges_campaign_id',
  'idx_challenges_date',
  'idx_challenges_campaign_date',
  // Actions table
  'idx_actions_challenge_id',
  'idx_actions_challenge_order',
  // Campaigns table
  'idx_campaigns_status',
  'idx_campaigns_archived',
  'idx_campaigns_created_by',
  'idx_campaigns_start_date',
  'idx_campaigns_end_date',
  'idx_campaigns_status_archived',
  // Proofs table
  'idx_proofs_user_action_id',
  'idx_proofs_daily_bonus_id',
  'idx_proofs_created_at',
  'idx_proofs_type',
  // Campaign Bonus Config
  'idx_campaign_bonus_config_campaign_id',
  // Campaign Validations
  'idx_campaign_validations_user_id',
  'idx_campaign_validations_campaign_id',
  'idx_campaign_validations_status',
  'idx_campaign_validations_validated_by',
  'idx_campaign_validations_user_campaign',
  // App Versions
  'idx_app_versions_is_active',
  'idx_app_versions_release_date',
  // User Version Tracking
  'idx_user_version_tracking_user_id',
  'idx_user_version_tracking_version_id',
  'idx_user_version_tracking_has_seen',
  // Composite indexes
  'idx_campaigns_active_lookup',
];

async function listProductionIndexes() {
  console.log('🔍 Analyse des Indexes en Production');
  console.log('=' .repeat(70));
  console.log('');

  const sql = postgres(PROD_DB_URL, {
    ssl: 'require',
    max: 1,
  });

  try {
    // Lister TOUS les indexes en prod
    console.log('📊 Étape 1 - Liste Complète des Indexes en Prod');
    console.log('-'.repeat(70));
    const allIndexes = await sql`
      SELECT 
        schemaname,
        tablename,
        indexname,
        indexdef
      FROM pg_indexes 
      WHERE schemaname = 'public'
      ORDER BY tablename, indexname
    `;
    
    console.log(`Total indexes en prod: ${allIndexes.length}`);
    console.log('');

    // Grouper par table
    const indexesByTable = {};
    allIndexes.forEach(idx => {
      if (!indexesByTable[idx.tablename]) {
        indexesByTable[idx.tablename] = [];
      }
      indexesByTable[idx.tablename].push(idx);
    });

    // Afficher par table
    Object.keys(indexesByTable).sort().forEach(table => {
      console.log(`📁 ${table} (${indexesByTable[table].length} indexes):`);
      indexesByTable[table].forEach(idx => {
        const isPerfIndex = idx.indexname.startsWith('idx_');
        const icon = isPerfIndex ? '  ✅' : '    ';
        console.log(`${icon} ${idx.indexname}`);
      });
      console.log('');
    });

    // Étape 2 : Vérifier les indexes de performance attendus
    console.log('=' .repeat(70));
    console.log('📋 Étape 2 - Comparaison avec Migration 0011');
    console.log('-'.repeat(70));
    console.log('');

    const existingIndexNames = allIndexes.map(idx => idx.indexname);
    const presentIndexes = [];
    const missingIndexes = [];

    EXPECTED_INDEXES.forEach(expectedIdx => {
      if (existingIndexNames.includes(expectedIdx)) {
        presentIndexes.push(expectedIdx);
      } else {
        missingIndexes.push(expectedIdx);
      }
    });

    console.log(`✅ Indexes PRÉSENTS: ${presentIndexes.length}/${EXPECTED_INDEXES.length}`);
    if (presentIndexes.length > 0) {
      presentIndexes.forEach(idx => {
        console.log(`   ✓ ${idx}`);
      });
    }
    console.log('');

    console.log(`❌ Indexes MANQUANTS: ${missingIndexes.length}/${EXPECTED_INDEXES.length}`);
    if (missingIndexes.length > 0) {
      missingIndexes.forEach(idx => {
        console.log(`   ✗ ${idx}`);
      });
    }
    console.log('');

    // Étape 3 : Déterminer le scénario
    console.log('=' .repeat(70));
    console.log('🎯 Étape 3 - Détermination du Scénario');
    console.log('-'.repeat(70));
    console.log('');

    const percentPresent = (presentIndexes.length / EXPECTED_INDEXES.length) * 100;

    if (missingIndexes.length === 0) {
      console.log('✅ SCÉNARIO B : Tous les indexes sont déjà présents');
      console.log('');
      console.log('📌 Conclusion:');
      console.log('   La migration 285 en prod contient déjà tous les indexes de performance.');
      console.log('   La migration 0011 locale = migration 285 prod');
      console.log('');
      console.log('🎯 Action recommandée:');
      console.log('   ✅ AUCUNE migration nécessaire');
      console.log('   ✅ Documenter la correspondance: local 0011 ↔ prod 285');
      console.log('   ✅ Prêt à merger vers main');
      console.log('');
    } else if (presentIndexes.length === 0) {
      console.log('⚠️  SCÉNARIO A : Aucun index de performance présent');
      console.log('');
      console.log('📌 Conclusion:');
      console.log('   La migration 285 ne contient PAS les indexes de performance.');
      console.log('   Les 41+ indexes doivent être créés.');
      console.log('');
      console.log('🎯 Action recommandée:');
      console.log('   1. Créer un BACKUP complet de la prod');
      console.log('   2. Appliquer la migration 0011 (deviendra 286 en prod)');
      console.log('   3. Vérifier que les 41+ indexes sont créés');
      console.log('   4. Tester les performances (+40% attendu)');
      console.log('');
      console.log('⏱️  Temps estimé: 10-15 minutes');
      console.log('⚠️  Risque: Faible (CREATE INDEX IF NOT EXISTS)');
      console.log('');
    } else {
      console.log(`⚠️  SCÉNARIO C : Indexes partiellement présents (${percentPresent.toFixed(1)}%)`);
      console.log('');
      console.log('📌 Conclusion:');
      console.log(`   ${presentIndexes.length} indexes sur ${EXPECTED_INDEXES.length} sont déjà en prod.`);
      console.log('   Certains indexes manquent encore.');
      console.log('');
      console.log('🎯 Action recommandée:');
      console.log('   1. Créer un BACKUP complet de la prod');
      console.log('   2. Appliquer la migration 0011 complète');
      console.log('   3. Les "CREATE INDEX IF NOT EXISTS" vont:');
      console.log('      - Ignorer les indexes déjà présents');
      console.log(`      - Créer les ${missingIndexes.length} indexes manquants`);
      console.log('   4. Vérifier que tous les indexes sont créés');
      console.log('');
      console.log('⏱️  Temps estimé: 10-15 minutes');
      console.log('⚠️  Risque: Très faible (IF NOT EXISTS protège)');
      console.log('');
    }

    // Résumé final
    console.log('=' .repeat(70));
    console.log('📊 RÉSUMÉ FINAL');
    console.log('-'.repeat(70));
    console.log('');
    console.log(`   Total indexes en prod:        ${allIndexes.length}`);
    console.log(`   Indexes de performance (idx_*): ${existingIndexNames.filter(n => n.startsWith('idx_')).length}`);
    console.log(`   Indexes attendus (migration):   ${EXPECTED_INDEXES.length}`);
    console.log(`   Indexes présents:               ${presentIndexes.length} ✅`);
    console.log(`   Indexes manquants:              ${missingIndexes.length} ${missingIndexes.length > 0 ? '⚠️' : '✅'}`);
    console.log('');

    if (missingIndexes.length === 0) {
      console.log('🎉 Production est déjà optimisée avec tous les indexes de performance !');
    } else {
      console.log(`💡 Gain de performance disponible: ~+40% en ajoutant ${missingIndexes.length} indexes`);
    }
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
listProductionIndexes().catch(err => {
  console.error('❌ Erreur fatale:', err);
  process.exit(1);
});

