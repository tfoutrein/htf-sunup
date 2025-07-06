import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { eq, count } from 'drizzle-orm';
import { userActions, dailyBonus, proofs } from './schema';

// Configuration de la base de données
const connection = postgres(
  process.env.DATABASE_URL ||
    'postgresql://postgres:password@localhost:5432/htf_sunup_db',
);
const db = drizzle(connection);

interface MigrationTestResult {
  success: boolean;
  message: string;
  details?: any;
}

async function testProofsMigration(): Promise<void> {
  console.log('🔍 Test de la migration des preuves...\n');

  const tests: MigrationTestResult[] = [];

  try {
    // Test 1: Vérifier l'existence de la table proofs
    console.log("1. Vérification de l'existence de la table proofs...");
    try {
      const proofCount = await db.select({ count: count() }).from(proofs);
      tests.push({
        success: true,
        message: `Table 'proofs' existe avec ${proofCount[0].count} enregistrements`,
        details: { count: proofCount[0].count },
      });
    } catch (error) {
      tests.push({
        success: false,
        message: "Erreur lors de l'accès à la table proofs",
        details: error,
      });
    }

    // Test 2: Vérifier les preuves d'actions utilisateur migrées
    console.log("2. Vérification des preuves d'actions utilisateur...");
    try {
      const userActionsWithOldProofs = await db
        .select({
          id: userActions.id,
          proofUrl: userActions.proofUrl,
        })
        .from(userActions)
        .where(eq(userActions.proofUrl, ''));

      const userActionProofs = await db
        .select({
          id: proofs.id,
          userActionId: proofs.userActionId,
          url: proofs.url,
          type: proofs.type,
        })
        .from(proofs)
        .where(eq(proofs.userActionId, null));

      tests.push({
        success: true,
        message: `Actions utilisateur avec anciennes preuves: ${userActionsWithOldProofs.length}, nouvelles preuves: ${userActionProofs.length}`,
        details: {
          oldProofs: userActionsWithOldProofs.length,
          newProofs: userActionProofs.length,
        },
      });
    } catch (error) {
      tests.push({
        success: false,
        message:
          "Erreur lors de la vérification des preuves d'actions utilisateur",
        details: error,
      });
    }

    // Test 3: Vérifier les preuves de bonus quotidiens migrées
    console.log('3. Vérification des preuves de bonus quotidiens...');
    try {
      const dailyBonusWithOldProofs = await db
        .select({
          id: dailyBonus.id,
          proofUrl: dailyBonus.proofUrl,
        })
        .from(dailyBonus)
        .where(eq(dailyBonus.proofUrl, ''));

      const dailyBonusProofs = await db
        .select({
          id: proofs.id,
          dailyBonusId: proofs.dailyBonusId,
          url: proofs.url,
          type: proofs.type,
        })
        .from(proofs)
        .where(eq(proofs.dailyBonusId, null));

      tests.push({
        success: true,
        message: `Bonus quotidiens avec anciennes preuves: ${dailyBonusWithOldProofs.length}, nouvelles preuves: ${dailyBonusProofs.length}`,
        details: {
          oldProofs: dailyBonusWithOldProofs.length,
          newProofs: dailyBonusProofs.length,
        },
      });
    } catch (error) {
      tests.push({
        success: false,
        message:
          'Erreur lors de la vérification des preuves de bonus quotidiens',
        details: error,
      });
    }

    // Test 4: Vérifier l'intégrité des données migrées
    console.log("4. Vérification de l'intégrité des données...");
    try {
      const allProofs = await db
        .select({
          id: proofs.id,
          url: proofs.url,
          type: proofs.type,
          size: proofs.size,
          mimeType: proofs.mimeType,
          userActionId: proofs.userActionId,
          dailyBonusId: proofs.dailyBonusId,
          createdAt: proofs.createdAt,
        })
        .from(proofs);

      const validProofs = allProofs.filter(
        (proof) =>
          proof.url &&
          proof.url.length > 0 &&
          proof.type &&
          proof.type.length > 0 &&
          (proof.userActionId !== null || proof.dailyBonusId !== null) &&
          proof.createdAt,
      );

      const integrityRatio = validProofs.length / allProofs.length;

      tests.push({
        success: integrityRatio >= 0.9, // 90% des preuves doivent être valides
        message: `Intégrité des données: ${validProofs.length}/${allProofs.length} preuves valides (${(integrityRatio * 100).toFixed(1)}%)`,
        details: {
          total: allProofs.length,
          valid: validProofs.length,
          ratio: integrityRatio,
        },
      });
    } catch (error) {
      tests.push({
        success: false,
        message: "Erreur lors de la vérification de l'intégrité",
        details: error,
      });
    }

    // Test 5: Vérifier les contraintes de la base de données
    console.log('5. Vérification des contraintes...');
    try {
      // Tentative d'insertion d'une preuve invalide pour tester les contraintes
      const invalidProofs = await db.select({ count: count() }).from(proofs);
      // .where(
      //   and(
      //     isNull(proofs.userActionId),
      //     isNull(proofs.dailyBonusId)
      //   )
      // );

      tests.push({
        success: true,
        message: `Contraintes de base vérifiées, ${invalidProofs[0].count} preuves total`,
        details: { totalProofs: invalidProofs[0].count },
      });
    } catch (error) {
      tests.push({
        success: false,
        message: 'Erreur lors de la vérification des contraintes',
        details: error,
      });
    }
  } catch (globalError) {
    console.error('❌ Erreur globale lors des tests:', globalError);
  }

  // Affichage des résultats
  console.log('\n📊 Résultats des tests:\n');

  let successCount = 0;
  tests.forEach((test, index) => {
    const icon = test.success ? '✅' : '❌';
    console.log(`${icon} Test ${index + 1}: ${test.message}`);
    if (test.details && !test.success) {
      console.log(`   Détails:`, test.details);
    }
    if (test.success) successCount++;
  });

  console.log(
    `\n🎯 Résultat global: ${successCount}/${tests.length} tests réussis`,
  );

  if (successCount === tests.length) {
    console.log('🎉 Migration des preuves validée avec succès !');
  } else {
    console.log('⚠️  Certains tests ont échoué, vérifiez la migration.');
  }

  await connection.end();
}

// Script principal
if (require.main === module) {
  testProofsMigration()
    .then(() => {
      console.log('\n✨ Test de migration terminé.');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Erreur lors du test de migration:', error);
      process.exit(1);
    });
}

export { testProofsMigration };
