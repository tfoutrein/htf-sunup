import { drizzle } from 'drizzle-orm/postgres-js';
const postgres = require('postgres');
import * as bcrypt from 'bcryptjs';
import { eq } from 'drizzle-orm';
import { sql } from 'drizzle-orm';
import {
  users,
  campaigns,
  challenges,
  actions,
  userActions,
  dailyBonus,
  campaignBonusConfig,
} from './schema';

const connectionString =
  process.env.DATABASE_URL ||
  'postgresql://postgres:postgres@localhost:5432/htf_sunup_db';

async function seed() {
  const sql = postgres(connectionString);
  const db = drizzle(sql);

  console.log('🌱 Starting HTF SunUp MVP seed...');

  try {
    // Clear existing data in correct order (respecting foreign keys)
    await db.delete(userActions);
    await db.delete(actions);
    await db.delete(challenges);
    await db.delete(campaigns);
    // Ne pas supprimer les users qui existent déjà

    // Récupérer les utilisateurs existants
    const existingUsers = await db.select().from(users);
    const allManagers = existingUsers.filter((u) => u.role === 'manager');
    const fbos = existingUsers.filter((u) => u.role === 'fbo');

    if (allManagers.length === 0 || fbos.length === 0) {
      throw new Error('Utilisateurs manquants dans la base de données');
    }

    // Le premier manager sera le manager principal (ex-marraine)
    const principalManager = allManagers[0];
    const otherManagers = allManagers.slice(1);

    // Utiliser les managers existants
    const manager1 = otherManagers[0];
    const manager2 = otherManagers[1];
    const manager3 = otherManagers[2];

    // Assigner les FBO existants aux managers
    const fbo1 = fbos[0];
    const fbo2 = fbos[1];
    const fbo3 = fbos[2];

    // Mettre à jour les manager_id des FBO
    await db
      .update(users)
      .set({ managerId: manager1.id })
      .where(eq(users.id, fbo1.id));
    await db
      .update(users)
      .set({ managerId: manager1.id })
      .where(eq(users.id, fbo2.id));
    if (fbo3) {
      await db
        .update(users)
        .set({ managerId: manager2.id })
        .where(eq(users.id, fbo3.id));
    }

    // Create a sample campaign
    const [campaign] = await db
      .insert(campaigns)
      .values({
        name: "Les défis de l'été de la Happy Team",
        description:
          "Campagne de défis pour booster l'activité pendant l'été 2025",
        startDate: '2025-07-07',
        endDate: '2025-08-31',
        status: 'active',
        createdBy: principalManager.id,
      })
      .returning();

    // Create today's challenge
    const today = new Date().toISOString().split('T')[0];
    const [challenge] = await db
      .insert(challenges)
      .values({
        campaignId: campaign.id,
        date: today,
        title: `Défi du ${today}`,
        description: "Trois actions pour booster votre activité aujourd'hui",
      })
      .returning();

    // Create sample actions for today's challenge
    const [action1] = await db
      .insert(actions)
      .values({
        challengeId: challenge.id,
        title: 'Appel prospection client',
        description:
          'Contacter 3 prospects qualifiés pour présenter nos produits Aloe Vera',
        type: 'vente',
        order: 1,
      })
      .returning();

    const [action2] = await db
      .insert(actions)
      .values({
        challengeId: challenge.id,
        title: 'Partage réseau social',
        description:
          'Publier un témoignage client sur Instagram avec hashtags #ForeverLiving #AloeVera',
        type: 'reseaux_sociaux',
        order: 2,
      })
      .returning();

    const [action3] = await db
      .insert(actions)
      .values({
        challengeId: challenge.id,
        title: 'Invitation événement',
        description: 'Inviter 2 personnes à la prochaine présentation produit',
        type: 'recrutement',
        order: 3,
      })
      .returning();

    // Assign actions to FBOs
    await db.insert(userActions).values([
      { userId: fbo1.id, actionId: action1.id, challengeId: challenge.id },
      { userId: fbo1.id, actionId: action2.id, challengeId: challenge.id },
      { userId: fbo1.id, actionId: action3.id, challengeId: challenge.id },
      { userId: fbo2.id, actionId: action1.id, challengeId: challenge.id },
      { userId: fbo2.id, actionId: action2.id, challengeId: challenge.id },
      { userId: fbo2.id, actionId: action3.id, challengeId: challenge.id },
    ]);

    // Create bonus configuration for the campaign
    const [bonusConfig] = await db
      .insert(campaignBonusConfig)
      .values({
        campaignId: campaign.id,
        basketBonusAmount: '2.50',
        sponsorshipBonusAmount: '10.00',
      })
      .returning();

    // Create some sample daily bonuses with different dates and types
    const threeDaysAgo = new Date();
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    await db.insert(dailyBonus).values([
      // FBO1 bonuses
      {
        userId: fbo1.id,
        campaignId: campaign.id,
        bonusDate: threeDaysAgo.toISOString().split('T')[0],
        bonusType: 'basket',
        amount: '2.50',
        status: 'pending',
        proofUrl: null, // Pas de preuve encore
      },
      {
        userId: fbo1.id,
        campaignId: campaign.id,
        bonusDate: yesterday.toISOString().split('T')[0],
        bonusType: 'sponsorship',
        amount: '10.00',
        status: 'pending',
        proofUrl:
          'https://via.placeholder.com/400x300/4F46E5/FFFFFF?text=Preuve+Parrainage', // URL de test
      },
      {
        userId: fbo1.id,
        campaignId: campaign.id,
        bonusDate: today,
        bonusType: 'basket',
        amount: '2.50',
        status: 'pending',
        proofUrl:
          'https://via.placeholder.com/400x300/10B981/FFFFFF?text=Preuve+Panier', // URL de test
      },

      // FBO2 bonuses
      {
        userId: fbo2.id,
        campaignId: campaign.id,
        bonusDate: yesterday.toISOString().split('T')[0],
        bonusType: 'basket',
        amount: '2.50',
        status: 'pending',
        proofUrl:
          'https://via.placeholder.com/400x300/F59E0B/FFFFFF?text=Preuve+Panier+FBO2',
      },
      {
        userId: fbo2.id,
        campaignId: campaign.id,
        bonusDate: today,
        bonusType: 'sponsorship',
        amount: '10.00',
        status: 'pending',
        proofUrl: null, // Pas de preuve encore
      },
    ]);

    console.log('✅ Seed completed successfully!');
    console.log(`Created:
    - 1 Manager Principal: ${principalManager.email}
    - 3 Managers: ${manager1 ? manager1.email : 'N/A'}, ${manager2 ? manager2.email : 'N/A'}, ${manager3 ? manager3.email : 'N/A'}
    - 3 FBOs: ${fbo1.email}, ${fbo2.email}, ${fbo3.email}
    - 1 Campaign: ${campaign.name}
    - 1 Challenge for ${today}
    - 3 Actions for today's challenge
    - 6 UserActions (assignments)
    - 1 Bonus configuration (Panier: 2.50€, Parrainage: 10.00€)
    - 5 Daily bonuses (with and without proofs)
    `);
  } catch (error) {
    console.error('❌ Seed failed:', error);
  } finally {
    await sql.end();
  }
}

seed();
