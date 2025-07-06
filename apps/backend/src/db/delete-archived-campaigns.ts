const { drizzle: drizzleDelete } = require('drizzle-orm/postgres-js');
const pgDeleteLib = require('postgres');

interface DeleteStats {
  campaignsToDelete: number;
  challengesToDelete: number;
  actionsToDelete: number;
  userActionsToDelete: number;
  dailyBonusesToDelete: number;
  proofsToDelete: number;
  configsToDelete: number;
}

async function deleteArchivedCampaigns(dryRun: boolean = true) {
  const connectionString =
    process.env.DATABASE_URL ||
    'postgresql://postgres:postgres@localhost:5432/htf_sunup_db';

  console.log('🔗 Connecting to database...');
  const isLocalDatabase =
    connectionString.includes('localhost') ||
    connectionString.includes('127.0.0.1');
  const sql = pgDeleteLib(connectionString, {
    max: 1,
    ssl: isLocalDatabase ? false : 'require',
  });

  try {
    console.log('🗑️  Starting archived campaigns deletion process...\n');

    if (dryRun) {
      console.log('🔍 DRY RUN MODE - Aucune suppression ne sera effectuée');
      console.log(
        '   Utilisez --execute pour effectuer les suppressions réelles\n',
      );
    } else {
      console.log(
        '⚠️  EXECUTION MODE - Les suppressions seront IRREVERSIBLES!',
      );
      console.log(
        "   Assurez-vous d'avoir une sauvegarde de la base de données\n",
      );
    }

    // Étape 1 : Analyser ce qui sera supprimé
    console.log('📊 Analyse des données à supprimer...\n');

    // Campagnes archivées
    const archivedCampaigns = await sql`
      SELECT id, name, description, start_date, end_date, status, created_at
      FROM campaigns 
      WHERE archived = true
      ORDER BY created_at DESC
    `;

    if (archivedCampaigns.length === 0) {
      console.log('✅ Aucune campagne archivée trouvée. Rien à supprimer.');
      return;
    }

    console.log(
      `📋 Campagnes archivées trouvées (${archivedCampaigns.length}):`,
    );
    archivedCampaigns.forEach((campaign, index) => {
      console.log(
        `  ${index + 1}. ID: ${campaign.id} - "${campaign.name}" (${campaign.start_date} → ${campaign.end_date})`,
      );
    });
    console.log('');

    // Compter les éléments associés
    const stats: DeleteStats = {
      campaignsToDelete: archivedCampaigns.length,
      challengesToDelete: 0,
      actionsToDelete: 0,
      userActionsToDelete: 0,
      dailyBonusesToDelete: 0,
      proofsToDelete: 0,
      configsToDelete: 0,
    };

    // Challenges
    const challengesCount = await sql`
      SELECT COUNT(*) as count
      FROM challenges c
      INNER JOIN campaigns cam ON c.campaign_id = cam.id
      WHERE cam.archived = true
    `;
    stats.challengesToDelete = parseInt(challengesCount[0].count);

    // Actions
    const actionsCount = await sql`
      SELECT COUNT(*) as count
      FROM actions a
      INNER JOIN challenges c ON a.challenge_id = c.id
      INNER JOIN campaigns cam ON c.campaign_id = cam.id
      WHERE cam.archived = true
    `;
    stats.actionsToDelete = parseInt(actionsCount[0].count);

    // User Actions
    const userActionsCount = await sql`
      SELECT COUNT(*) as count
      FROM user_actions ua
      INNER JOIN challenges c ON ua.challenge_id = c.id
      INNER JOIN campaigns cam ON c.campaign_id = cam.id
      WHERE cam.archived = true
    `;
    stats.userActionsToDelete = parseInt(userActionsCount[0].count);

    // Daily Bonuses
    const dailyBonusCount = await sql`
      SELECT COUNT(*) as count
      FROM daily_bonus db
      INNER JOIN campaigns cam ON db.campaign_id = cam.id
      WHERE cam.archived = true
    `;
    stats.dailyBonusesToDelete = parseInt(dailyBonusCount[0].count);

    // Proofs
    const proofsCount = await sql`
      SELECT COUNT(*) as count
      FROM proofs p
      WHERE p.user_action_id IN (
        SELECT ua.id FROM user_actions ua
        INNER JOIN challenges c ON ua.challenge_id = c.id
        INNER JOIN campaigns cam ON c.campaign_id = cam.id
        WHERE cam.archived = true
      )
      OR p.daily_bonus_id IN (
        SELECT db.id FROM daily_bonus db
        INNER JOIN campaigns cam ON db.campaign_id = cam.id
        WHERE cam.archived = true
      )
    `;
    stats.proofsToDelete = parseInt(proofsCount[0].count);

    // Campaign Bonus Configs
    const configsCount = await sql`
      SELECT COUNT(*) as count
      FROM campaign_bonus_config cbc
      INNER JOIN campaigns cam ON cbc.campaign_id = cam.id
      WHERE cam.archived = true
    `;
    stats.configsToDelete = parseInt(configsCount[0].count);

    // Afficher le résumé
    console.log('📊 Résumé des suppressions prévues:');
    console.log(`   🎯 Campagnes archivées: ${stats.campaignsToDelete}`);
    console.log(`   🏆 Défis: ${stats.challengesToDelete}`);
    console.log(`   ⚡ Actions: ${stats.actionsToDelete}`);
    console.log(`   👤 Actions utilisateur: ${stats.userActionsToDelete}`);
    console.log(`   💰 Bonus quotidiens: ${stats.dailyBonusesToDelete}`);
    console.log(`   📸 Preuves: ${stats.proofsToDelete}`);
    console.log(`   ⚙️  Configurations bonus: ${stats.configsToDelete}`);
    console.log('');

    const totalElements =
      stats.challengesToDelete +
      stats.actionsToDelete +
      stats.userActionsToDelete +
      stats.dailyBonusesToDelete +
      stats.proofsToDelete +
      stats.configsToDelete;

    if (dryRun) {
      console.log(
        `✅ DRY RUN terminé. ${totalElements} éléments seraient supprimés.`,
      );
      console.log('   Pour effectuer les suppressions réelles, utilisez :');
      console.log('   node src/db/delete-archived-campaigns.ts --execute');
      return;
    }

    // Mode exécution - Demander confirmation
    console.log(
      `⚠️  ATTENTION: ${totalElements} éléments vont être DÉFINITIVEMENT supprimés !`,
    );
    console.log('   Cette opération est IRREVERSIBLE !');
    console.log('');
    console.log(
      '   Pour continuer, tapez exactement: "SUPPRIMER LES CAMPAGNES ARCHIVEES"',
    );

    // En production, on peut vouloir demander une confirmation interactive
    // Ici on simule avec une variable d'environnement
    const confirmation = process.env.DELETE_CONFIRMATION;

    if (confirmation !== 'SUPPRIMER LES CAMPAGNES ARCHIVEES') {
      console.log('❌ Suppression annulée. Confirmation non reçue.');
      console.log(
        '   Définissez DELETE_CONFIRMATION="SUPPRIMER LES CAMPAGNES ARCHIVEES" pour confirmer.',
      );
      return;
    }

    console.log('🚀 Confirmation reçue. Début des suppressions...\n');

    // Commencer les suppressions dans l'ordre correct
    let deletedCount = 0;

    // Étape 1 : Supprimer les preuves
    if (stats.proofsToDelete > 0) {
      console.log('🗑️  Suppression des preuves...');
      const result = await sql`
        DELETE FROM proofs 
        WHERE user_action_id IN (
          SELECT ua.id 
          FROM user_actions ua
          INNER JOIN challenges c ON ua.challenge_id = c.id
          INNER JOIN campaigns cam ON c.campaign_id = cam.id
          WHERE cam.archived = true
        )
        OR daily_bonus_id IN (
          SELECT db.id 
          FROM daily_bonus db
          INNER JOIN campaigns cam ON db.campaign_id = cam.id
          WHERE cam.archived = true
        )
      `;
      deletedCount += result.count;
      console.log(`   ✅ ${result.count} preuves supprimées`);
    }

    // Étape 2 : Supprimer les actions utilisateur
    if (stats.userActionsToDelete > 0) {
      console.log('🗑️  Suppression des actions utilisateur...');
      const result = await sql`
        DELETE FROM user_actions 
        WHERE challenge_id IN (
          SELECT c.id 
          FROM challenges c
          INNER JOIN campaigns cam ON c.campaign_id = cam.id
          WHERE cam.archived = true
        )
      `;
      deletedCount += result.count;
      console.log(`   ✅ ${result.count} actions utilisateur supprimées`);
    }

    // Étape 3 : Supprimer les bonus quotidiens
    if (stats.dailyBonusesToDelete > 0) {
      console.log('🗑️  Suppression des bonus quotidiens...');
      const result = await sql`
        DELETE FROM daily_bonus 
        WHERE campaign_id IN (
          SELECT id FROM campaigns WHERE archived = true
        )
      `;
      deletedCount += result.count;
      console.log(`   ✅ ${result.count} bonus quotidiens supprimés`);
    }

    // Étape 4 : Supprimer les configurations de bonus
    if (stats.configsToDelete > 0) {
      console.log('🗑️  Suppression des configurations de bonus...');
      const result = await sql`
        DELETE FROM campaign_bonus_config 
        WHERE campaign_id IN (
          SELECT id FROM campaigns WHERE archived = true
        )
      `;
      deletedCount += result.count;
      console.log(`   ✅ ${result.count} configurations supprimées`);
    }

    // Étape 5 : Supprimer les actions
    if (stats.actionsToDelete > 0) {
      console.log('🗑️  Suppression des actions...');
      const result = await sql`
        DELETE FROM actions 
        WHERE challenge_id IN (
          SELECT c.id 
          FROM challenges c
          INNER JOIN campaigns cam ON c.campaign_id = cam.id
          WHERE cam.archived = true
        )
      `;
      deletedCount += result.count;
      console.log(`   ✅ ${result.count} actions supprimées`);
    }

    // Étape 6 : Supprimer les défis
    if (stats.challengesToDelete > 0) {
      console.log('🗑️  Suppression des défis...');
      const result = await sql`
        DELETE FROM challenges 
        WHERE campaign_id IN (
          SELECT id FROM campaigns WHERE archived = true
        )
      `;
      deletedCount += result.count;
      console.log(`   ✅ ${result.count} défis supprimés`);
    }

    // Étape 7 : Supprimer les campagnes
    if (stats.campaignsToDelete > 0) {
      console.log('🗑️  Suppression des campagnes archivées...');
      const result = await sql`
        DELETE FROM campaigns 
        WHERE archived = true
      `;
      deletedCount += result.count;
      console.log(`   ✅ ${result.count} campagnes supprimées`);
    }

    console.log('\n🎉 Suppression terminée avec succès !');
    console.log(`📊 Total des éléments supprimés : ${deletedCount}`);

    // Vérification post-suppression
    console.log('\n🔍 Vérification post-suppression...');
    const remainingArchived = await sql`
      SELECT COUNT(*) as count FROM campaigns WHERE archived = true
    `;

    if (parseInt(remainingArchived[0].count) === 0) {
      console.log('✅ Aucune campagne archivée restante');
    } else {
      console.log(
        `⚠️  ${remainingArchived[0].count} campagnes archivées restantes (problème potentiel)`,
      );
    }
  } catch (error) {
    console.error('❌ Erreur lors de la suppression:', error.message);
    console.error('Stack trace:', error.stack);
    process.exit(1);
  } finally {
    await sql.end();
  }
}

// Gestion des arguments de ligne de commande
const args = process.argv.slice(2);
const isDryRun = !args.includes('--execute');

// Exécuter seulement si appelé directement
if (require.main === module) {
  deleteArchivedCampaigns(isDryRun);
}

module.exports = { deleteArchivedCampaigns };
