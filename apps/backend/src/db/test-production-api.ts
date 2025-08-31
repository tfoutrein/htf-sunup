import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { campaigns, challenges, actions } from './schema';
import { eq } from 'drizzle-orm';

async function testProductionAPI(databaseUrl: string) {
  console.log("🧪 TEST DE L'API ACTIONS - PRODUCTION");
  console.log('='.repeat(60));

  const client = postgres(databaseUrl, {
    ssl: { rejectUnauthorized: false },
  });
  const db = drizzle(client);

  try {
    // 1. Récupérer le défi du lundi 07 juillet (ID: 2)
    const challengeId = 2;
    console.log(`🎯 Test pour le Challenge ID: ${challengeId}`);
    console.log('');

    // 2. Simuler exactement ce que fait l'API backend
    console.log('📡 SIMULATION DE LA REQUÊTE API:');
    console.log(`   Endpoint simulé: GET /actions?challengeId=${challengeId}`);

    const apiResult = await db
      .select()
      .from(actions)
      .where(eq(actions.challengeId, challengeId))
      .orderBy(actions.order);

    console.log(`   Résultat: ${apiResult.length} actions trouvées`);
    console.log('');

    if (apiResult.length === 0) {
      console.log("❌ PROBLÈME: L'API ne retourne aucune action !");
      console.log('   → Le problème vient du backend');
    } else {
      console.log('✅ API BACKEND OK - Actions trouvées:');
      apiResult.forEach((action) => {
        console.log(
          `   Position ${action.order}: "${action.title}" (ID: ${action.id})`,
        );
        console.log(`     Type: ${action.type}`);
        console.log(`     Créée: ${action.createdAt}`);
      });
      console.log('');
      console.log('   → Le backend fonctionne correctement');
      console.log(
        '   → Le problème vient probablement du frontend (cache, état, etc.)',
      );
    }

    // 3. Vérifier l'intégrité des données
    console.log('');
    console.log("🔍 VÉRIFICATION DE L'INTÉGRITÉ:");

    // Vérifier que le challengeId existe
    const [challenge] = await db
      .select()
      .from(challenges)
      .where(eq(challenges.id, challengeId));

    if (!challenge) {
      console.log(`❌ Challenge ID ${challengeId} n'existe pas !`);
    } else {
      console.log(`✅ Challenge "${challenge.title}" existe`);
    }

    // Vérifier les positions
    const positions = apiResult.map((a) => a.order);
    const duplicates = positions.filter(
      (pos, index) => positions.indexOf(pos) !== index,
    );

    if (duplicates.length > 0) {
      console.log(
        `⚠️  Positions dupliquées détectées: ${duplicates.join(', ')}`,
      );
    } else {
      console.log('✅ Aucun conflit de position');
    }

    // 4. Test de la création d'une nouvelle action
    console.log('');
    console.log("🧪 SIMULATION DE CRÉATION D'ACTION:");

    const nextAvailablePosition = Math.max(...positions, 0) + 1;
    if (nextAvailablePosition <= 6) {
      console.log(
        `✅ Position ${nextAvailablePosition} disponible pour une nouvelle action`,
      );
      console.log(
        '   → Vous devriez pouvoir ajouter une action à cette position',
      );
    } else {
      console.log('❌ Toutes les positions (1-6) sont occupées');
    }

    // 5. Vérifier spécifiquement la position 2
    console.log('');
    console.log('🔍 ANALYSE POSITION 2:');
    const position2Actions = apiResult.filter((a) => a.order === 2);

    if (position2Actions.length === 0) {
      console.log("✅ Position 2 libre - vous pouvez l'utiliser");
    } else if (position2Actions.length === 1) {
      const action = position2Actions[0];
      console.log(
        `❌ Position 2 occupée par: "${action.title}" (ID: ${action.id})`,
      );
      console.log(
        "   → C'est normal que vous ne puissiez pas créer une action à cette position",
      );
    } else {
      console.log(
        `🚨 ERREUR: ${position2Actions.length} actions en position 2 !`,
      );
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
  console.log('❌ Usage: npx tsx test-production-api.ts <DATABASE_URL>');
  process.exit(1);
}

// Exécuter le test
testProductionAPI(databaseUrl).catch(console.error);
