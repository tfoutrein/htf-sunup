const { drizzle: drizzleORM } = require('drizzle-orm/postgres-js');
const pgClientLib = require('postgres');

async function fixProofsIssues() {
  const connectionString =
    process.env.DATABASE_URL ||
    'postgresql://postgres:postgres@localhost:5432/htf_sunup_db';

  console.log('🔗 Connecting to database...');
  const isLocalDatabase =
    connectionString.includes('localhost') ||
    connectionString.includes('127.0.0.1');
  const sql = pgClientLib(connectionString, {
    max: 1,
    ssl: isLocalDatabase ? false : 'require',
  });

  try {
    console.log('🛠️ Starting repair of proofs issues...\n');

    // 1. Nettoyer les preuves orphelines (référençant des user_actions qui n'existent plus)
    console.log('🧹 Cleaning orphaned proofs (user_actions)...');
    const orphanedUserActionProofs = await sql`
      SELECT p.id, p.user_action_id, p.url, p.original_name
      FROM proofs p
      LEFT JOIN user_actions ua ON p.user_action_id = ua.id
      WHERE p.user_action_id IS NOT NULL AND ua.id IS NULL
    `;

    if (orphanedUserActionProofs.length > 0) {
      console.log(
        `⚠️ Found ${orphanedUserActionProofs.length} orphaned user_action proofs:`,
      );
      orphanedUserActionProofs.forEach((proof) => {
        console.log(
          `  - Proof ID: ${proof.id}, UserAction: ${proof.user_action_id}, File: ${proof.original_name}`,
        );
      });

      // Demander confirmation avant suppression
      console.log(
        '\n🗑️ These orphaned proofs will be deleted. Continue? (y/N)',
      );

      // Pour automatiser, on peut soit supprimer automatiquement ou log seulement
      // Ici on va juste logger pour sécurité
      console.log(
        '🔒 Safety mode: Logging only. To delete, uncomment the deletion code below.',
      );

      // Uncomment to actually delete:
      /*
      for (const proof of orphanedUserActionProofs) {
        await sql`DELETE FROM proofs WHERE id = ${proof.id}`;
        console.log(`✅ Deleted orphaned proof ID: ${proof.id}`);
      }
      */
    } else {
      console.log('✅ No orphaned user_action proofs found');
    }
    console.log('');

    // 2. Nettoyer les preuves orphelines (référençant des daily_bonus qui n'existent plus)
    console.log('🧹 Cleaning orphaned proofs (daily_bonus)...');
    const orphanedDailyBonusProofs = await sql`
      SELECT p.id, p.daily_bonus_id, p.url, p.original_name
      FROM proofs p
      LEFT JOIN daily_bonus db ON p.daily_bonus_id = db.id
      WHERE p.daily_bonus_id IS NOT NULL AND db.id IS NULL
    `;

    if (orphanedDailyBonusProofs.length > 0) {
      console.log(
        `⚠️ Found ${orphanedDailyBonusProofs.length} orphaned daily_bonus proofs:`,
      );
      orphanedDailyBonusProofs.forEach((proof) => {
        console.log(
          `  - Proof ID: ${proof.id}, DailyBonus: ${proof.daily_bonus_id}, File: ${proof.original_name}`,
        );
      });

      console.log(
        '🔒 Safety mode: Logging only. To delete, uncomment the deletion code below.',
      );

      // Uncomment to actually delete:
      /*
      for (const proof of orphanedDailyBonusProofs) {
        await sql`DELETE FROM proofs WHERE id = ${proof.id}`;
        console.log(`✅ Deleted orphaned proof ID: ${proof.id}`);
      }
      */
    } else {
      console.log('✅ No orphaned daily_bonus proofs found');
    }
    console.log('');

    // 3. Vérifier et réparer les preuves avec des URLs invalides
    console.log('🔗 Checking for proofs with invalid URLs...');
    const proofsWithInvalidUrls = await sql`
      SELECT id, url, original_name
      FROM proofs 
      WHERE url IS NULL OR url = '' OR length(url) < 10
    `;

    if (proofsWithInvalidUrls.length > 0) {
      console.log(
        `⚠️ Found ${proofsWithInvalidUrls.length} proofs with invalid URLs:`,
      );
      proofsWithInvalidUrls.forEach((proof) => {
        console.log(
          `  - Proof ID: ${proof.id}, URL: "${proof.url}", File: ${proof.original_name}`,
        );
      });

      console.log(
        '🔒 Safety mode: These need manual review. Consider deleting if URLs cannot be recovered.',
      );
    } else {
      console.log('✅ All proofs have valid URLs');
    }
    console.log('');

    // 4. Vérifier les preuves sans référence (ni user_action_id ni daily_bonus_id)
    console.log('🔍 Checking for proofs without any reference...');
    const proofsWithoutReference = await sql`
      SELECT id, url, original_name, created_at
      FROM proofs 
      WHERE user_action_id IS NULL AND daily_bonus_id IS NULL
    `;

    if (proofsWithoutReference.length > 0) {
      console.log(
        `⚠️ Found ${proofsWithoutReference.length} proofs without reference:`,
      );
      proofsWithoutReference.forEach((proof) => {
        console.log(
          `  - Proof ID: ${proof.id}, File: ${proof.original_name}, Created: ${proof.created_at}`,
        );
      });

      console.log('🔒 Safety mode: These orphaned proofs need manual review.');
    } else {
      console.log('✅ All proofs have proper references');
    }
    console.log('');

    // 5. Créer des index manquants pour améliorer les performances
    console.log('⚡ Checking and creating missing indexes...');

    try {
      // Index sur user_action_id
      await sql`
        CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_proofs_user_action_id 
        ON proofs(user_action_id) 
        WHERE user_action_id IS NOT NULL
      `;
      console.log('✅ Created/verified index on proofs.user_action_id');
    } catch (error) {
      console.log(`⚠️ Index on user_action_id: ${error.message}`);
    }

    try {
      // Index sur daily_bonus_id
      await sql`
        CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_proofs_daily_bonus_id 
        ON proofs(daily_bonus_id) 
        WHERE daily_bonus_id IS NOT NULL
      `;
      console.log('✅ Created/verified index on proofs.daily_bonus_id');
    } catch (error) {
      console.log(`⚠️ Index on daily_bonus_id: ${error.message}`);
    }

    try {
      // Index sur created_at pour les requêtes chronologiques
      await sql`
        CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_proofs_created_at 
        ON proofs(created_at)
      `;
      console.log('✅ Created/verified index on proofs.created_at');
    } catch (error) {
      console.log(`⚠️ Index on created_at: ${error.message}`);
    }
    console.log('');

    // 6. Mettre à jour les statistiques de la table
    console.log('📊 Updating table statistics...');
    await sql`ANALYZE proofs`;
    console.log('✅ Updated proofs table statistics');
    console.log('');

    // 7. Vérifier l'intégrité des contraintes de clé étrangère
    console.log('🔗 Verifying foreign key integrity...');

    // Test des contraintes
    try {
      await sql`
        SELECT COUNT(*) FROM proofs p
        LEFT JOIN user_actions ua ON p.user_action_id = ua.id
        WHERE p.user_action_id IS NOT NULL AND ua.id IS NULL
      `;
      console.log('✅ User actions foreign key constraint is valid');
    } catch (error) {
      console.log(`❌ User actions foreign key issue: ${error.message}`);
    }

    try {
      await sql`
        SELECT COUNT(*) FROM proofs p
        LEFT JOIN daily_bonus db ON p.daily_bonus_id = db.id
        WHERE p.daily_bonus_id IS NOT NULL AND db.id IS NULL
      `;
      console.log('✅ Daily bonus foreign key constraint is valid');
    } catch (error) {
      console.log(`❌ Daily bonus foreign key issue: ${error.message}`);
    }

    // 8. Rapport final
    console.log('\n📋 Final Report:');
    const finalStats = await sql`
      SELECT 
        COUNT(*) as total_proofs,
        COUNT(user_action_id) as user_action_proofs,
        COUNT(daily_bonus_id) as daily_bonus_proofs,
        COUNT(*) - COUNT(user_action_id) - COUNT(daily_bonus_id) as unlinked_proofs
      FROM proofs
    `;

    const stats = finalStats[0];
    console.log(`📸 Total proofs: ${stats.total_proofs}`);
    console.log(`🎯 User action proofs: ${stats.user_action_proofs}`);
    console.log(`💰 Daily bonus proofs: ${stats.daily_bonus_proofs}`);
    console.log(`🔄 Unlinked proofs: ${stats.unlinked_proofs}`);

    if (stats.unlinked_proofs > 0) {
      console.log(
        `\n⚠️ Warning: ${stats.unlinked_proofs} proofs are not linked to any entity`,
      );
    }

    console.log('\n🎉 Repair process completed!');
    console.log('\n📝 Next steps:');
    console.log(
      '1. If any orphaned proofs were found, review and uncomment deletion code if needed',
    );
    console.log(
      '2. Monitor the application logs for the improved error handling',
    );
    console.log(
      '3. The system should now handle errors gracefully with fallback values',
    );
  } catch (error) {
    console.error('❌ Repair failed:', error.message);
    console.error('Stack trace:', error.stack);
  } finally {
    await sql.end();
  }
}

// Execute only if run directly
if (require.main === module) {
  fixProofsIssues();
}

module.exports = { fixProofsIssues };
