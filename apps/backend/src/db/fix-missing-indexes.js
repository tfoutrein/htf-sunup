#!/usr/bin/env node
const postgres = require('postgres');

const PROD_DB_URL =
  'postgresql://htf_sunup_postgres_user:NxW7QrfoU2l7Lry090Q69gj8qDkgFny0@dpg-d1b8fsadbo4c73c9ier0-a.oregon-postgres.render.com/htf_sunup_postgres';

// Indexes manquants identifiés
const MISSING_INDEXES = [
  `CREATE INDEX IF NOT EXISTS idx_users_manager_id ON users(manager_id) WHERE manager_id IS NOT NULL`,
  `CREATE INDEX IF NOT EXISTS idx_user_actions_user_id ON user_actions(user_id)`,
  `CREATE INDEX IF NOT EXISTS idx_daily_bonus_user_id ON daily_bonus(user_id)`,
  `CREATE INDEX IF NOT EXISTS idx_challenges_campaign_id ON challenges(campaign_id)`,
  `CREATE INDEX IF NOT EXISTS idx_actions_challenge_id ON actions(challenge_id)`,
  `CREATE INDEX IF NOT EXISTS idx_campaigns_status ON campaigns(status)`,
  `CREATE INDEX IF NOT EXISTS idx_campaign_bonus_config_campaign_id ON campaign_bonus_config(campaign_id)`,
  `CREATE INDEX IF NOT EXISTS idx_campaign_validations_user_id ON campaign_validations(user_id)`,
  `CREATE INDEX IF NOT EXISTS idx_app_versions_is_active ON app_versions(is_active)`,
  `CREATE INDEX IF NOT EXISTS idx_user_version_tracking_user_id ON user_version_tracking(user_id)`,
  `CREATE INDEX IF NOT EXISTS idx_campaigns_active_lookup ON campaigns(status, archived, start_date, end_date) WHERE status = 'active' AND archived = false`,
];

async function fixIndexes() {
  console.log('🔧 Application des indexes manquants...\n');

  const sql = postgres(PROD_DB_URL, {
    max: 1,
    ssl: 'require',
  });

  try {
    let successCount = 0;
    let skipCount = 0;

    for (const command of MISSING_INDEXES) {
      const match = command.match(/idx_([a-z_]+)/);
      const indexName = match ? `idx_${match[1]}` : 'unknown';

      try {
        await sql.unsafe(command);
        console.log(`   ✅ ${indexName}`);
        successCount++;
      } catch (error) {
        if (error.message.includes('already exists')) {
          console.log(`   ⏭️  ${indexName} (existe déjà)`);
          skipCount++;
        } else {
          console.log(`   ❌ ${indexName}: ${error.message}`);
        }
      }
    }

    console.log(`\n📊 RÉSUMÉ:`);
    console.log(`   Créés:    ${successCount}`);
    console.log(`   Existants: ${skipCount}\n`);

    if (successCount > 0) {
      console.log('🎉 Indexes manquants appliqués avec succès !');
      console.log(`✅ Total attendu: 43 indexes\n`);
    }
  } catch (error) {
    console.error('❌ Erreur:', error.message);
    process.exit(1);
  } finally {
    await sql.end();
  }
}

fixIndexes()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('❌ Erreur fatale:', err);
    process.exit(1);
  });
