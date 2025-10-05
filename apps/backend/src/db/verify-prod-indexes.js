#!/usr/bin/env node
/**
 * Script de vérification des indexes de performance en production
 * Vérifie que la migration 0011 a bien été appliquée
 */

const postgres = require('postgres');

const PROD_DB_URL =
  'postgresql://htf_sunup_postgres_user:NxW7QrfoU2l7Lry090Q69gj8qDkgFny0@dpg-d1b8fsadbo4c73c9ier0-a.oregon-postgres.render.com/htf_sunup_postgres';

// Liste complète des 43 indexes attendus de la migration 0011
const EXPECTED_INDEXES = [
  // users table (5 indexes)
  'idx_users_email',
  'idx_users_role',
  'idx_users_manager_id',
  'idx_users_auth_provider',
  'idx_users_facebook_id',

  // campaigns table (3 indexes)
  'idx_campaigns_status',
  'idx_campaigns_created_by',
  'idx_campaigns_dates',

  // challenges table (2 indexes)
  'idx_challenges_campaign_id',
  'idx_challenges_date',

  // actions table (2 indexes)
  'idx_actions_challenge_id',
  'idx_actions_type',

  // user_actions table (6 indexes)
  'idx_user_actions_user_id',
  'idx_user_actions_action_id',
  'idx_user_actions_challenge_id',
  'idx_user_actions_status',
  'idx_user_actions_completed_at',
  'idx_user_actions_user_challenge',

  // daily_bonus table (7 indexes)
  'idx_daily_bonus_user_id',
  'idx_daily_bonus_campaign_id',
  'idx_daily_bonus_bonus_date',
  'idx_daily_bonus_bonus_type',
  'idx_daily_bonus_status',
  'idx_daily_bonus_user_date',
  'idx_daily_bonus_user_campaign',

  // proofs table (6 indexes)
  'idx_proofs_user_action_id',
  'idx_proofs_user_id',
  'idx_proofs_action_id',
  'idx_proofs_challenge_id',
  'idx_proofs_uploaded_at',
  'idx_proofs_user_challenge',

  // campaign_bonus_config table (1 index)
  'idx_campaign_bonus_config_campaign_id',

  // app_versions table (3 indexes)
  'idx_app_versions_is_active',
  'idx_app_versions_release_date',
  'idx_app_versions_version',

  // campaign_validation table (8 indexes)
  'idx_campaign_validation_campaign_id',
  'idx_campaign_validation_user_id',
  'idx_campaign_validation_manager_id',
  'idx_campaign_validation_status',
  'idx_campaign_validation_start_date',
  'idx_campaign_validation_end_date',
  'idx_campaign_validation_user_campaign',
  'idx_campaign_validation_manager_status',
];

async function verifyIndexes() {
  console.log('🔍 Vérification des indexes de performance en production...\n');

  const sql = postgres(PROD_DB_URL, {
    max: 1,
    ssl: 'require',
  });

  try {
    // Récupérer tous les indexes (hors primary keys et foreign keys)
    const indexes = await sql`
      SELECT 
        schemaname,
        tablename,
        indexname
      FROM pg_indexes
      WHERE schemaname = 'public'
        AND indexname NOT LIKE '%_pkey'
        AND indexname NOT LIKE '%_fkey%'
      ORDER BY tablename, indexname
    `;

    console.log(`📊 Total des indexes en production: ${indexes.length}`);
    console.log(
      `📋 Indexes attendus (migration 0011): ${EXPECTED_INDEXES.length}\n`,
    );

    // Grouper par table
    const indexesByTable = {};
    indexes.forEach((idx) => {
      if (!indexesByTable[idx.tablename]) {
        indexesByTable[idx.tablename] = [];
      }
      indexesByTable[idx.tablename].push(idx.indexname);
    });

    // Vérifier les indexes attendus
    const presentIndexes = [];
    const missingIndexes = [];

    EXPECTED_INDEXES.forEach((expectedIdx) => {
      const found = indexes.some((idx) => idx.indexname === expectedIdx);
      if (found) {
        presentIndexes.push(expectedIdx);
      } else {
        missingIndexes.push(expectedIdx);
      }
    });

    // Afficher le résumé
    console.log('✅ RÉSULTAT DE LA VÉRIFICATION\n');
    console.log(
      `   Indexes présents:  ${presentIndexes.length}/${EXPECTED_INDEXES.length}`,
    );
    console.log(
      `   Indexes manquants: ${missingIndexes.length}/${EXPECTED_INDEXES.length}\n`,
    );

    if (missingIndexes.length === 0) {
      console.log('🎉 ============================================');
      console.log('🎉 SUCCÈS : TOUS LES INDEXES SONT PRÉSENTS !');
      console.log('🎉 ============================================\n');
      console.log('✅ La migration 0011 a été appliquée avec succès');
      console.log('✅ Les 43 indexes de performance sont actifs');
      console.log('✅ Gain de performance attendu: +40%\n');
    } else {
      console.log('⚠️  INDEXES MANQUANTS:\n');
      missingIndexes.forEach((idx) => {
        console.log(`   ❌ ${idx}`);
      });
      console.log('');
    }

    // Afficher le détail par table
    console.log('📋 DÉTAIL PAR TABLE:\n');
    Object.keys(indexesByTable)
      .sort()
      .forEach((table) => {
        const tableIndexes = indexesByTable[table];
        const expectedForTable = EXPECTED_INDEXES.filter((idx) =>
          tableIndexes.includes(idx),
        ).length;
        console.log(`   ${table}: ${tableIndexes.length} indexes`);
        tableIndexes.forEach((idx) => {
          const isExpected = EXPECTED_INDEXES.includes(idx);
          const marker = isExpected ? '✅' : '  ';
          console.log(`      ${marker} ${idx}`);
        });
        console.log('');
      });
  } catch (error) {
    console.error('❌ Erreur lors de la vérification:', error.message);
    process.exit(1);
  } finally {
    await sql.end();
  }
}

verifyIndexes()
  .then(() => {
    console.log('✅ Vérification terminée\n');
    process.exit(0);
  })
  .catch((err) => {
    console.error('❌ Erreur fatale:', err);
    process.exit(1);
  });
