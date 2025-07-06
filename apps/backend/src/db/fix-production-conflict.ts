import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { campaigns, challenges, actions } from './schema';
import { eq, and } from 'drizzle-orm';

async function fixProductionConflict(
  databaseUrl: string,
  dryRun: boolean = true,
) {
  console.log("🔧 CORRECTION DES CONFLITS D'ACTIONS - PRODUCTION");
  console.log('='.repeat(60));
  console.log(
    `🌐 Connexion à: ${databaseUrl.replace(/\/\/[^:]+:[^@]+@/, '//***:***@')}`,
  );
  console.log(
    `🔄 Mode: ${dryRun ? 'DRY RUN (simulation)' : 'EXÉCUTION RÉELLE'}`,
  );
  console.log('');

  const client = postgres(databaseUrl, {
    ssl: { rejectUnauthorized: false },
  });
  const db = drizzle(client);

  try {
    // 1. Identifier les conflits dans la campagne "Les défis de l'été 2025"
    const campaignChallenges = await db
      .select()
      .from(challenges)
      .where(eq(challenges.campaignId, 1))
      .orderBy(challenges.date);

    console.log('🔍 ANALYSE DES CONFLITS:');

    let totalConflicts = 0;
    const fixActions = [];

    for (const challenge of campaignChallenges) {
      const challengeActions = await db
        .select()
        .from(actions)
        .where(eq(actions.challengeId, challenge.id))
        .orderBy(actions.order);

      const positions = challengeActions.map((a) => a.order);
      const duplicatePositions = [
        ...new Set(
          positions.filter((pos, index) => positions.indexOf(pos) !== index),
        ),
      ];

      if (duplicatePositions.length > 0) {
        totalConflicts++;
        console.log(
          `⚠️  CONFLIT dans "${challenge.title}" (ID: ${challenge.id}):`,
        );

        duplicatePositions.forEach((pos) => {
          const conflictingActions = challengeActions.filter(
            (a) => a.order === pos,
          );
          console.log(
            `   Position ${pos} occupée par ${conflictingActions.length} actions:`,
          );

          conflictingActions.forEach((action, index) => {
            console.log(
              `     ${index + 1}. ID ${action.id}: "${action.title}"`,
            );
            console.log(`        Créée: ${action.createdAt}`);

            // Proposer une correction : garder la première action, déplacer les autres
            if (index > 0) {
              const newPosition = Math.max(...positions) + index;
              if (newPosition <= 6) {
                fixActions.push({
                  type: 'move',
                  actionId: action.id,
                  actionTitle: action.title,
                  fromPosition: pos,
                  toPosition: newPosition,
                  challengeId: challenge.id,
                  challengeTitle: challenge.title,
                });
                console.log(
                  `        → Proposé: déplacer vers position ${newPosition}`,
                );
              } else {
                fixActions.push({
                  type: 'cannot_fix',
                  actionId: action.id,
                  actionTitle: action.title,
                  reason: 'Aucune position libre (1-6 toutes occupées)',
                  challengeId: challenge.id,
                  challengeTitle: challenge.title,
                });
                console.log(`        → ❌ Impossible: aucune position libre`);
              }
            } else {
              console.log(`        → ✅ Conservée à la position ${pos}`);
            }
          });
        });
        console.log('');
      }
    }

    if (totalConflicts === 0) {
      console.log('✅ Aucun conflit détecté !');
      return;
    }

    // 2. Proposer le plan de correction
    console.log('📋 PLAN DE CORRECTION:');
    console.log(`   Total des conflits: ${totalConflicts} défi(s)`);

    const moveActions = fixActions.filter((a) => a.type === 'move');
    const cannotFixActions = fixActions.filter((a) => a.type === 'cannot_fix');

    if (moveActions.length > 0) {
      console.log(`   Actions à déplacer: ${moveActions.length}`);
      moveActions.forEach((action) => {
        console.log(`     • "${action.actionTitle}" (ID: ${action.actionId})`);
        console.log(`       Défi: "${action.challengeTitle}"`);
        console.log(`       ${action.fromPosition} → ${action.toPosition}`);
      });
    }

    if (cannotFixActions.length > 0) {
      console.log(`   Actions problématiques: ${cannotFixActions.length}`);
      cannotFixActions.forEach((action) => {
        console.log(`     • "${action.actionTitle}" (ID: ${action.actionId})`);
        console.log(`       Raison: ${action.reason}`);
      });
    }

    // 3. Exécuter les corrections (si pas en dry run)
    if (!dryRun && moveActions.length > 0) {
      console.log('');
      console.log('🔧 EXÉCUTION DES CORRECTIONS:');

      for (const action of moveActions) {
        try {
          const [updatedAction] = await db
            .update(actions)
            .set({
              order: action.toPosition,
              updatedAt: new Date(),
            })
            .where(eq(actions.id, action.actionId))
            .returning();

          console.log(
            `✅ Action "${action.actionTitle}" déplacée: ${action.fromPosition} → ${action.toPosition}`,
          );
        } catch (error) {
          console.log(
            `❌ Erreur lors du déplacement de l'action "${action.actionTitle}":`,
            error.message,
          );
        }
      }

      console.log('');
      console.log('🎉 CORRECTION TERMINÉE !');
    } else if (dryRun) {
      console.log('');
      console.log('💡 MODE DRY RUN - Aucune modification effectuée');
      console.log('   Pour appliquer les corrections, relancez avec: --apply');
    }

    // 4. Vérification post-correction (si exécution réelle)
    if (!dryRun && moveActions.length > 0) {
      console.log('');
      console.log('🔍 VÉRIFICATION POST-CORRECTION:');

      let remainingConflicts = 0;
      for (const challenge of campaignChallenges) {
        const challengeActions = await db
          .select()
          .from(actions)
          .where(eq(actions.challengeId, challenge.id))
          .orderBy(actions.order);

        const positions = challengeActions.map((a) => a.order);
        const duplicates = positions.filter(
          (pos, index) => positions.indexOf(pos) !== index,
        );

        if (duplicates.length > 0) {
          remainingConflicts++;
          console.log(`⚠️  Conflit restant dans "${challenge.title}"`);
        }
      }

      if (remainingConflicts === 0) {
        console.log('✅ Tous les conflits ont été résolus !');
      } else {
        console.log(
          `⚠️  ${remainingConflicts} conflit(s) restant(s) à résoudre manuellement`,
        );
      }
    }
  } catch (error) {
    console.error('❌ Erreur lors de la correction:', error);
  } finally {
    await client.end();
  }
}

// Récupérer les arguments de ligne de commande
const args = process.argv.slice(2);
const databaseUrl = args[0];
const applyFlag = args[1] === '--apply';

if (!databaseUrl) {
  console.log(
    '❌ Usage: npx tsx fix-production-conflict.ts <DATABASE_URL> [--apply]',
  );
  console.log('');
  console.log('Options:');
  console.log(
    '  --apply    Applique réellement les corrections (par défaut: dry run)',
  );
  console.log('');
  console.log('Exemples:');
  console.log(
    '  npx tsx fix-production-conflict.ts "postgresql://..." (simulation)',
  );
  console.log(
    '  npx tsx fix-production-conflict.ts "postgresql://..." --apply (exécution)',
  );
  process.exit(1);
}

// Exécuter la correction
fixProductionConflict(databaseUrl, !applyFlag).catch(console.error);
