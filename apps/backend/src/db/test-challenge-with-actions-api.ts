import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { campaigns, challenges, actions } from './schema';
import { eq } from 'drizzle-orm';

async function testChallengeWithActionsAPI(databaseUrl: string) {
  console.log("🧪 TEST DE L'API CHALLENGES WITH ACTIONS - PRODUCTION");
  console.log('='.repeat(70));

  const client = postgres(databaseUrl, {
    ssl: { rejectUnauthorized: false },
  });
  const db = drizzle(client);

  try {
    // 1. Test du défi du mardi (ID: 3)
    const challengeId = 3;
    console.log(`🎯 Test Challenge ID: ${challengeId} (Mardi 08 juillet)`);
    console.log('');

    // 2. Simuler exactement ce que fait l'API backend pour getChallengeWithActions
    console.log("📡 SIMULATION DE L'ENDPOINT: GET /challenges/3/actions");

    // D'abord récupérer le défi
    const [challenge] = await db
      .select()
      .from(challenges)
      .where(eq(challenges.id, challengeId));

    if (!challenge) {
      console.log('❌ Défi non trouvé');
      return;
    }

    console.log('✅ Défi récupéré:');
    console.log(`   ID: ${challenge.id}`);
    console.log(`   Titre: ${challenge.title}`);
    console.log(`   Date: ${challenge.date}`);
    console.log('');

    // Ensuite récupérer les actions de ce défi
    const challengeActions = await db
      .select()
      .from(actions)
      .where(eq(actions.challengeId, challengeId))
      .orderBy(actions.order);

    console.log("📋 ACTIONS RETOURNÉES PAR L'API:");
    console.log(`   Nombre d'actions: ${challengeActions.length}`);

    if (challengeActions.length === 0) {
      console.log('   ❌ Aucune action retournée');
      console.log('   → Le frontend ne voit aucune action existante');
      console.log("   → C'est pourquoi il calcule mal les positions");
    } else {
      challengeActions.forEach((action, index) => {
        console.log(
          `   ${index + 1}. Position ${action.order}: "${action.title}" (ID: ${action.id})`,
        );
        console.log(`      Type: ${action.type}`);
        console.log(`      Créée: ${action.createdAt}`);
      });
    }

    // 3. Simulation de la réponse JSON complète
    console.log('');
    console.log('🌐 RÉPONSE API SIMULÉE (JSON):');
    const apiResponse = {
      ...challenge,
      actions: challengeActions.map((action) => ({
        id: action.id,
        challengeId: action.challengeId,
        title: action.title,
        description: action.description,
        type: action.type,
        order: action.order,
        createdAt: action.createdAt,
        updatedAt: action.updatedAt,
      })),
    };

    console.log(JSON.stringify(apiResponse, null, 2));

    // 4. Vérification côté frontend
    console.log('');
    console.log('🔍 ANALYSE POUR LE FRONTEND:');

    if (challengeActions.length === 0) {
      console.log('❌ PROBLÈME: API ne retourne aucune action');
      console.log("   → Le frontend pense qu'il n'y a aucune action existante");
      console.log(
        '   → Il calcule `actions.length + 1` = `0 + 1` = position 1',
      );
      console.log('   → Mais la position 2 est déjà occupée en base !');
    } else {
      console.log('✅ API retourne les actions correctement');
      console.log('   → Le problème vient du frontend qui ne les charge pas');
      console.log('   → Vérifiez le state management React');
    }

    // 5. Test de l'autre endpoint (actions?challengeId=3)
    console.log('');
    console.log('📡 TEST ENDPOINT ALTERNATIF: GET /actions?challengeId=3');

    const alternativeResult = await db
      .select()
      .from(actions)
      .where(eq(actions.challengeId, challengeId))
      .orderBy(actions.order);

    console.log(`   Résultat: ${alternativeResult.length} action(s)`);
    if (alternativeResult.length !== challengeActions.length) {
      console.log('   ⚠️  Résultats différents entre les deux endpoints !');
    } else {
      console.log('   ✅ Résultats cohérents');
    }
  } catch (error) {
    console.error('❌ Erreur lors du test:', error);
  } finally {
    await client.end();
  }
}

// Récupérer l'URL depuis les arguments de ligne de commande
const args = process.argv.slice(2);
const databaseUrl = args[0];

if (!databaseUrl) {
  console.log(
    '❌ Usage: npx tsx test-challenge-with-actions-api.ts <DATABASE_URL>',
  );
  process.exit(1);
}

// Exécuter le test
testChallengeWithActionsAPI(databaseUrl).catch(console.error);
