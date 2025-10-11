#!/usr/bin/env node

/**
 * Script pour vérifier le contenu de la base de données locale
 * Usage: node scripts/check-local-db-content.js
 */

const { Client } = require('pg');

const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/htf_sunup_db';

async function checkDatabaseContent() {
  const client = new Client({
    connectionString: DATABASE_URL,
  });

  try {
    console.log('🔌 Connexion à la base de données...');
    await client.connect();
    console.log('✅ Connecté à la base de données\n');

    // Fonction helper pour compter les lignes
    const countRows = async (tableName) => {
      const result = await client.query(`SELECT COUNT(*) FROM ${tableName}`);
      return parseInt(result.rows[0].count);
    };

    console.log('📊 Résumé du contenu de la base de données:\n');
    console.log('=' .repeat(60));

    // Users
    const usersCount = await countRows('users');
    console.log(`\n👥 UTILISATEURS: ${usersCount} total`);
    if (usersCount > 0) {
      const users = await client.query(`
        SELECT id, name, email, role, auth_provider, manager_id 
        FROM users 
        ORDER BY role, name
      `);
      console.log('\nDétails:');
      users.rows.forEach(user => {
        const managerInfo = user.manager_id ? ` (Manager: ${user.manager_id})` : '';
        console.log(`  • [${user.id}] ${user.name} (${user.email}) - ${user.role}${managerInfo} - Auth: ${user.auth_provider}`);
      });
    }

    // Campaigns
    const campaignsCount = await countRows('campaigns');
    console.log(`\n📋 CAMPAGNES: ${campaignsCount} total`);
    if (campaignsCount > 0) {
      const campaigns = await client.query(`
        SELECT c.id, c.name, c.status, c.start_date, c.end_date, c.archived, 
               u.name as creator_name
        FROM campaigns c
        LEFT JOIN users u ON c.created_by = u.id
        ORDER BY c.start_date DESC
      `);
      console.log('\nDétails:');
      campaigns.rows.forEach(campaign => {
        const archivedTag = campaign.archived ? ' [ARCHIVÉE]' : '';
        console.log(`  • [${campaign.id}] ${campaign.name} (${campaign.status})${archivedTag}`);
        console.log(`    Du ${campaign.start_date} au ${campaign.end_date}`);
        console.log(`    Créée par: ${campaign.creator_name || 'N/A'}`);
      });
    }

    // Campaign Unlock Conditions
    const unlockConditionsCount = await countRows('campaign_unlock_conditions');
    console.log(`\n🔓 CONDITIONS DE DÉBLOCAGE: ${unlockConditionsCount} total`);
    if (unlockConditionsCount > 0) {
      const conditions = await client.query(`
        SELECT cuc.id, cuc.campaign_id, cuc.description, cuc.display_order,
               c.name as campaign_name
        FROM campaign_unlock_conditions cuc
        LEFT JOIN campaigns c ON cuc.campaign_id = c.id
        ORDER BY cuc.campaign_id, cuc.display_order
      `);
      console.log('\nDétails:');
      conditions.rows.forEach(condition => {
        console.log(`  • [${condition.id}] Campagne "${condition.campaign_name}" (#${condition.display_order})`);
        console.log(`    ${condition.description}`);
      });
    }

    // Campaign Validations
    const validationsCount = await countRows('campaign_validations');
    console.log(`\n✅ VALIDATIONS DE CAMPAGNE: ${validationsCount} total`);
    if (validationsCount > 0) {
      const validations = await client.query(`
        SELECT cv.id, cv.status, cv.validated_at,
               u.name as fbo_name,
               c.name as campaign_name,
               v.name as validator_name
        FROM campaign_validations cv
        LEFT JOIN users u ON cv.user_id = u.id
        LEFT JOIN campaigns c ON cv.campaign_id = c.id
        LEFT JOIN users v ON cv.validated_by = v.id
        ORDER BY cv.created_at DESC
      `);
      console.log('\nDétails:');
      validations.rows.forEach(validation => {
        const validatorInfo = validation.validator_name ? ` par ${validation.validator_name}` : '';
        const dateInfo = validation.validated_at ? ` le ${validation.validated_at}` : '';
        console.log(`  • [${validation.id}] ${validation.fbo_name} - ${validation.campaign_name}`);
        console.log(`    Status: ${validation.status}${validatorInfo}${dateInfo}`);
      });
    }

    // Campaign Validation Conditions
    const validationConditionsCount = await countRows('campaign_validation_conditions');
    console.log(`\n✔️ CONDITIONS DE VALIDATION: ${validationConditionsCount} total`);
    if (validationConditionsCount > 0) {
      const validationConditions = await client.query(`
        SELECT cvc.id, cvc.is_fulfilled, cvc.fulfilled_at,
               cv.id as validation_id,
               cuc.description as condition_description,
               u.name as fulfilled_by_name
        FROM campaign_validation_conditions cvc
        LEFT JOIN campaign_validations cv ON cvc.validation_id = cv.id
        LEFT JOIN campaign_unlock_conditions cuc ON cvc.condition_id = cuc.id
        LEFT JOIN users u ON cvc.fulfilled_by = u.id
        ORDER BY cvc.validation_id, cvc.id
      `);
      console.log('\nDétails:');
      validationConditions.rows.forEach(vc => {
        const fulfilled = vc.is_fulfilled ? '✅' : '❌';
        const fulfilledInfo = vc.fulfilled_by_name ? ` par ${vc.fulfilled_by_name}` : '';
        console.log(`  • [${vc.id}] Validation #${vc.validation_id}: ${fulfilled} ${vc.condition_description}`);
        if (vc.is_fulfilled && vc.fulfilled_at) {
          console.log(`    Remplie le ${vc.fulfilled_at}${fulfilledInfo}`);
        }
      });
    }

    // Challenges
    const challengesCount = await countRows('challenges');
    console.log(`\n🎯 DÉFIS: ${challengesCount} total`);
    if (challengesCount > 0) {
      const challenges = await client.query(`
        SELECT ch.id, ch.title, ch.date, ch.value_in_euro,
               c.name as campaign_name
        FROM challenges ch
        LEFT JOIN campaigns c ON ch.campaign_id = c.id
        ORDER BY ch.date DESC
        LIMIT 10
      `);
      console.log('\nDerniers défis (max 10):');
      challenges.rows.forEach(challenge => {
        console.log(`  • [${challenge.id}] ${challenge.title} - ${challenge.date}`);
        console.log(`    Campagne: ${challenge.campaign_name || 'N/A'} | Valeur: ${challenge.value_in_euro}€`);
      });
    }

    // Actions
    const actionsCount = await countRows('actions');
    console.log(`\n⚡ ACTIONS: ${actionsCount} total`);

    // User Actions
    const userActionsCount = await countRows('user_actions');
    const completedCount = await client.query(`SELECT COUNT(*) FROM user_actions WHERE completed = true`);
    console.log(`\n✔️ ACTIONS UTILISATEUR: ${userActionsCount} total (${completedCount.rows[0].count} complétées)`);

    // Daily Bonus
    const dailyBonusCount = await countRows('daily_bonus');
    console.log(`\n💰 BONUS QUOTIDIENS: ${dailyBonusCount} total`);
    if (dailyBonusCount > 0) {
      const bonusStats = await client.query(`
        SELECT status, COUNT(*) as count
        FROM daily_bonus
        GROUP BY status
        ORDER BY status
      `);
      console.log('\nStatistiques par status:');
      bonusStats.rows.forEach(stat => {
        console.log(`  • ${stat.status}: ${stat.count}`);
      });
    }

    // Proofs
    const proofsCount = await countRows('proofs');
    console.log(`\n📸 PREUVES: ${proofsCount} total`);
    if (proofsCount > 0) {
      const proofStats = await client.query(`
        SELECT type, COUNT(*) as count
        FROM proofs
        GROUP BY type
        ORDER BY type
      `);
      console.log('\nStatistiques par type:');
      proofStats.rows.forEach(stat => {
        console.log(`  • ${stat.type}: ${stat.count}`);
      });
    }

    // Campaign Bonus Config
    const bonusConfigCount = await countRows('campaign_bonus_config');
    console.log(`\n⚙️ CONFIGURATIONS DE BONUS: ${bonusConfigCount} total`);

    // App Versions
    const versionsCount = await countRows('app_versions');
    console.log(`\n📱 VERSIONS DE L'APP: ${versionsCount} total`);
    if (versionsCount > 0) {
      const versions = await client.query(`
        SELECT version, title, release_date, is_active, is_major
        FROM app_versions
        ORDER BY release_date DESC
      `);
      console.log('\nDétails:');
      versions.rows.forEach(version => {
        const tags = [];
        if (version.is_active) tags.push('ACTIVE');
        if (version.is_major) tags.push('MAJEURE');
        const tagStr = tags.length > 0 ? ` [${tags.join(', ')}]` : '';
        console.log(`  • ${version.version} - ${version.title}${tagStr}`);
        console.log(`    Release: ${version.release_date}`);
      });
    }

    console.log('\n' + '='.repeat(60));
    console.log('\n✅ Vérification terminée!\n');

  } catch (error) {
    console.error('❌ Erreur lors de la vérification de la base de données:', error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

checkDatabaseContent();

