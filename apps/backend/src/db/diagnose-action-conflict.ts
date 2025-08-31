import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { campaigns, challenges, actions } from './schema';
import { eq } from 'drizzle-orm';

const connectionString =
  process.env.DATABASE_URL ||
  'postgresql://postgres:password@localhost:5432/htf_sunup_db';
const client = postgres(connectionString);
const db = drizzle(client);

async function diagnoseActionConflict() {
  console.log("🔍 DIAGNOSTIC DES CONFLITS D'ACTIONS");
  console.log('='.repeat(50));

  try {
    // 1. Récupérer la campagne "Les défis de l'été 2025"
    const campaign = await db
      .select()
      .from(campaigns)
      .where(eq(campaigns.id, 1));

    if (campaign.length === 0) {
      console.log('❌ Campagne ID 1 non trouvée');
      return;
    }

    console.log('📋 CAMPAGNE:');
    console.log(`   ID: ${campaign[0].id}`);
    console.log(`   Nom: ${campaign[0].name}`);
    console.log(`   Statut: ${campaign[0].status}`);
    console.log('');

    // 2. Récupérer tous les défis de cette campagne
    const campaignChallenges = await db
      .select()
      .from(challenges)
      .where(eq(challenges.campaignId, 1))
      .orderBy(challenges.date);

    console.log('🎯 DÉFIS DE LA CAMPAGNE:');
    campaignChallenges.forEach((challenge, index) => {
      console.log(
        `   ${index + 1}. ID ${challenge.id} - ${challenge.title} (${challenge.date})`,
      );
    });
    console.log('');

    // 3. Pour chaque défi, afficher ses actions avec leurs positions
    for (const challenge of campaignChallenges) {
      console.log(
        `📌 ACTIONS DU DÉFI "${challenge.title}" (ID: ${challenge.id}):`,
      );

      const challengeActions = await db
        .select()
        .from(actions)
        .where(eq(actions.challengeId, challenge.id))
        .orderBy(actions.order);

      if (challengeActions.length === 0) {
        console.log('   ❌ Aucune action trouvée');
      } else {
        challengeActions.forEach((action) => {
          console.log(
            `   Position ${action.order}: "${action.title}" (ID: ${action.id})`,
          );
          console.log(`      Type: ${action.type}`);
          console.log(
            `      Description: ${action.description?.substring(0, 100)}...`,
          );
        });

        // Vérifier s'il y a des doublons de position
        const positions = challengeActions.map((a) => a.order);
        const duplicatePositions = positions.filter(
          (pos, index) => positions.indexOf(pos) !== index,
        );

        if (duplicatePositions.length > 0) {
          console.log(
            `   🚨 CONFLIT DÉTECTÉ! Positions dupliquées: ${duplicatePositions.join(', ')}`,
          );
        }
      }
      console.log('');
    }

    // 4. Identifier le défi spécifique du problème (celui du lundi 07 juillet)
    const mondayChallenge = campaignChallenges.find(
      (c) => c.date === '2025-07-07',
    );
    if (mondayChallenge) {
      console.log('🔥 ANALYSE DU DÉFI PROBLÉMATIQUE (Lundi 07 juillet):');
      console.log(`   Challenge ID: ${mondayChallenge.id}`);
      console.log(`   Titre: ${mondayChallenge.title}`);

      const mondayActions = await db
        .select()
        .from(actions)
        .where(eq(actions.challengeId, mondayChallenge.id))
        .orderBy(actions.order);

      console.log('   Actions actuelles:');
      mondayActions.forEach((action) => {
        console.log(`      Position ${action.order}: "${action.title}"`);
      });

      // Vérifier la position 2 spécifiquement
      const position2Action = mondayActions.find((a) => a.order === 2);
      if (position2Action) {
        console.log(
          `   ⚠️  POSITION 2 OCCUPÉE PAR: "${position2Action.title}" (ID: ${position2Action.id})`,
        );
        console.log(
          "   → C'est pourquoi vous ne pouvez pas ajouter une nouvelle action à la position 2",
        );
      } else {
        console.log('   ✅ Position 2 libre');
      }
    }
  } catch (error) {
    console.error('❌ Erreur lors du diagnostic:', error);
  } finally {
    await client.end();
  }
}

// Exécuter le diagnostic
diagnoseActionConflict().catch(console.error);
