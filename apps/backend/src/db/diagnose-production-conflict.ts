import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { campaigns, challenges, actions } from './schema';
import { eq } from 'drizzle-orm';

async function diagnoseProductionConflict(databaseUrl: string) {
  console.log("🔍 DIAGNOSTIC DES CONFLITS D'ACTIONS - PRODUCTION");
  console.log('='.repeat(60));
  console.log(
    `🌐 Connexion à: ${databaseUrl.replace(/\/\/[^:]+:[^@]+@/, '//***:***@')}`,
  );
  console.log('');

  const client = postgres(databaseUrl, {
    ssl: { rejectUnauthorized: false }, // Pour les connexions SSL de production
  });
  const db = drizzle(client);

  try {
    // 1. Récupérer la campagne "Les défis de l'été 2025" (ID 1)
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
    console.log(`   Archivée: ${campaign[0].archived}`);
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
        `📌 ACTIONS DU DÉFI "${challenge.title}" (ID: ${challenge.id}, Date: ${challenge.date}):`,
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
            `      Description: ${action.description?.substring(0, 80)}...`,
          );
          console.log(`      Créée le: ${action.createdAt}`);
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

          // Montrer les actions en conflit
          duplicatePositions.forEach((pos) => {
            const conflictingActions = challengeActions.filter(
              (a) => a.order === pos,
            );
            console.log(`      Position ${pos} occupée par:`);
            conflictingActions.forEach((action) => {
              console.log(`        - ID ${action.id}: "${action.title}"`);
            });
          });
        }
      }
      console.log('');
    }

    // 4. Focus sur le défi du lundi 07 juillet (probable source du problème)
    const mondayChallenge = campaignChallenges.find(
      (c) => c.date === '2025-07-07',
    );
    if (mondayChallenge) {
      console.log('🔥 ANALYSE SPÉCIFIQUE - DÉFI DU LUNDI 07 JUILLET:');
      console.log(`   Challenge ID: ${mondayChallenge.id}`);
      console.log(`   Titre: ${mondayChallenge.title}`);
      console.log(`   Date: ${mondayChallenge.date}`);

      const mondayActions = await db
        .select()
        .from(actions)
        .where(eq(actions.challengeId, mondayChallenge.id))
        .orderBy(actions.order);

      console.log('   Actions actuelles:');
      mondayActions.forEach((action) => {
        console.log(
          `      Position ${action.order}: "${action.title}" (ID: ${action.id})`,
        );
        console.log(`        Créée le: ${action.createdAt}`);
      });

      // Vérifier les positions spécifiques
      for (let pos = 1; pos <= 6; pos++) {
        const actionsAtPosition = mondayActions.filter((a) => a.order === pos);
        if (actionsAtPosition.length > 1) {
          console.log(`   🚨 CONFLIT POSITION ${pos}:`);
          actionsAtPosition.forEach((action) => {
            console.log(`      - ID ${action.id}: "${action.title}"`);
          });
        } else if (actionsAtPosition.length === 1) {
          console.log(
            `   ✅ Position ${pos}: Occupée par "${actionsAtPosition[0].title}"`,
          );
        } else {
          console.log(`   ⭕ Position ${pos}: LIBRE`);
        }
      }
    }

    // 5. Récapitulatif et recommandations
    console.log('');
    console.log('📊 RÉCAPITULATIF:');
    console.log(`   - Total des défis: ${campaignChallenges.length}`);

    let totalActions = 0;
    let totalConflicts = 0;

    for (const challenge of campaignChallenges) {
      const challengeActions = await db
        .select()
        .from(actions)
        .where(eq(actions.challengeId, challenge.id));

      totalActions += challengeActions.length;

      const positions = challengeActions.map((a) => a.order);
      const duplicates = positions.filter(
        (pos, index) => positions.indexOf(pos) !== index,
      );
      if (duplicates.length > 0) {
        totalConflicts++;
      }
    }

    console.log(`   - Total des actions: ${totalActions}`);
    console.log(`   - Défis avec conflits: ${totalConflicts}`);

    if (totalConflicts > 0) {
      console.log('');
      console.log('🛠️  RECOMMANDATIONS:');
      console.log('   1. Identifier les actions dupliquées');
      console.log('   2. Décider quelles actions garder/supprimer');
      console.log('   3. Réorganiser les positions si nécessaire');
      console.log('   4. Créer un script de correction pour la production');
    }
  } catch (error) {
    console.error('❌ Erreur lors du diagnostic:', error);

    if (error.message.includes('password authentication failed')) {
      console.log('💡 Conseil: Vérifiez les credentials de la base de données');
    } else if (error.message.includes('connect')) {
      console.log(
        "💡 Conseil: Vérifiez la connectivité réseau et l'URL de la base",
      );
    }
  } finally {
    await client.end();
  }
}

// Récupérer l'URL depuis les arguments de ligne de commande
const args = process.argv.slice(2);
const databaseUrl = args[0];

if (!databaseUrl) {
  console.log(
    '❌ Usage: npx tsx diagnose-production-conflict.ts <DATABASE_URL>',
  );
  console.log('');
  console.log('Exemple:');
  console.log(
    'npx tsx diagnose-production-conflict.ts "postgresql://user:password@host:port/database"',
  );
  process.exit(1);
}

// Exécuter le diagnostic
diagnoseProductionConflict(databaseUrl).catch(console.error);
