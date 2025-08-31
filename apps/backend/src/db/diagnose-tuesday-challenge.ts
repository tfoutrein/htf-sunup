import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { campaigns, challenges, actions } from './schema';
import { eq } from 'drizzle-orm';

async function diagnoseTuesdayChallenge(databaseUrl: string) {
  console.log('🔍 DIAGNOSTIC SPÉCIFIQUE - DÉFI DU MARDI 08 JUILLET 2025');
  console.log('='.repeat(70));
  console.log(
    `🌐 Connexion à: ${databaseUrl.replace(/\/\/[^:]+:[^@]+@/, '//***:***@')}`,
  );
  console.log('');

  const client = postgres(databaseUrl, {
    ssl: { rejectUnauthorized: false },
  });
  const db = drizzle(client);

  try {
    // 1. Trouver le défi du mardi 08 juillet 2025
    console.log('🎯 RECHERCHE DU DÉFI DU MARDI:');

    const tuesdayChallenge = await db
      .select()
      .from(challenges)
      .where(eq(challenges.date, '2025-07-08'));

    if (tuesdayChallenge.length === 0) {
      console.log('❌ Aucun défi trouvé pour le 08/07/2025');
      return;
    }

    const challenge = tuesdayChallenge[0];
    console.log(`✅ Défi trouvé:`);
    console.log(`   ID: ${challenge.id}`);
    console.log(`   Titre: ${challenge.title}`);
    console.log(`   Date: ${challenge.date}`);
    console.log(`   Campagne ID: ${challenge.campaignId}`);
    console.log('');

    // 2. Récupérer toutes les actions de ce défi
    console.log('📋 ACTIONS ACTUELLES DU DÉFI:');

    const challengeActions = await db
      .select()
      .from(actions)
      .where(eq(actions.challengeId, challenge.id))
      .orderBy(actions.order);

    if (challengeActions.length === 0) {
      console.log('❌ Aucune action trouvée pour ce défi');
    } else {
      console.log(`✅ ${challengeActions.length} action(s) trouvée(s):`);
      challengeActions.forEach((action, index) => {
        console.log(
          `   ${index + 1}. Position ${action.order}: "${action.title}" (ID: ${action.id})`,
        );
        console.log(`      Type: ${action.type}`);
        console.log(
          `      Description: ${action.description || 'Aucune description'}`,
        );
        console.log(`      Créée le: ${action.createdAt}`);
        console.log(`      Mise à jour: ${action.updatedAt}`);
        console.log('');
      });
    }

    // 3. Analyser les positions
    console.log('📊 ANALYSE DES POSITIONS:');

    const positions = challengeActions.map((a) => a.order);
    const uniquePositions = [...new Set(positions)];
    const duplicatePositions = positions.filter(
      (pos, index) => positions.indexOf(pos) !== index,
    );

    console.log(`   Positions utilisées: [${positions.join(', ')}]`);
    console.log(`   Positions uniques: [${uniquePositions.join(', ')}]`);

    if (duplicatePositions.length > 0) {
      console.log(
        `   🚨 CONFLITS DÉTECTÉS: Positions dupliquées [${[...new Set(duplicatePositions)].join(', ')}]`,
      );

      // Détailler les conflits
      const conflictPositions = [...new Set(duplicatePositions)];
      conflictPositions.forEach((pos) => {
        const conflictingActions = challengeActions.filter(
          (a) => a.order === pos,
        );
        console.log(
          `      Position ${pos} occupée par ${conflictingActions.length} actions:`,
        );
        conflictingActions.forEach((action) => {
          console.log(`        - ID ${action.id}: "${action.title}"`);
        });
      });
    } else {
      console.log(`   ✅ Aucun conflit de position`);
    }

    // 4. Positions disponibles
    console.log('');
    console.log('🔍 DISPONIBILITÉ DES POSITIONS (1-6):');

    for (let pos = 1; pos <= 6; pos++) {
      const actionsAtPosition = challengeActions.filter((a) => a.order === pos);
      if (actionsAtPosition.length === 0) {
        console.log(`   Position ${pos}: ✅ LIBRE`);
      } else if (actionsAtPosition.length === 1) {
        console.log(
          `   Position ${pos}: ❌ Occupée par "${actionsAtPosition[0].title}"`,
        );
      } else {
        console.log(
          `   Position ${pos}: 🚨 CONFLIT - ${actionsAtPosition.length} actions`,
        );
      }
    }

    // 5. Recommandations
    console.log('');
    console.log('💡 RECOMMANDATIONS:');

    const freePositions = [];
    for (let pos = 1; pos <= 6; pos++) {
      if (!positions.includes(pos)) {
        freePositions.push(pos);
      }
    }

    if (freePositions.length > 0) {
      console.log(
        `   ✅ Positions libres disponibles: [${freePositions.join(', ')}]`,
      );
      console.log(
        `   → Vous pouvez ajouter une nouvelle action à la position ${freePositions[0]}`,
      );
    } else {
      console.log(`   ❌ Aucune position libre (toutes occupées)`);
      console.log(`   → Vous devez supprimer une action existante d'abord`);
    }

    if (duplicatePositions.length > 0) {
      console.log(
        `   🔧 Conflits à résoudre: ${[...new Set(duplicatePositions)].length} position(s)`,
      );
      console.log(`   → Utilisez le script de correction automatique`);
    }

    // 6. Simulation de l'erreur que vous rencontrez
    console.log('');
    console.log("🧪 SIMULATION DE L'ERREUR:");

    if (positions.includes(2)) {
      console.log(
        `   ❌ Position 2 déjà occupée par: "${challengeActions.find((a) => a.order === 2)?.title}"`,
      );
      console.log(
        `   → C'est pourquoi vous obtenez l'erreur "Une action existe déjà à la position 2"`,
      );
      console.log(
        `   → Le frontend essaie probablement d'assigner automatiquement la position 2`,
      );
    } else {
      console.log(`   ✅ Position 2 libre - pas d'erreur attendue`);
    }
  } catch (error) {
    console.error('❌ Erreur lors du diagnostic:', error);
  } finally {
    await client.end();
  }
}

// Récupérer l'URL depuis les arguments de ligne de commande
const args = process.argv.slice(2);
const databaseUrl = args[0];

if (!databaseUrl) {
  console.log('❌ Usage: npx tsx diagnose-tuesday-challenge.ts <DATABASE_URL>');
  process.exit(1);
}

// Exécuter le diagnostic
diagnoseTuesdayChallenge(databaseUrl).catch(console.error);
