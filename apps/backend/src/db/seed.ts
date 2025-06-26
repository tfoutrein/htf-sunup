import { drizzle } from 'drizzle-orm/postgres-js';
const postgres = require('postgres');
import * as bcrypt from 'bcryptjs';
import { eq } from 'drizzle-orm';
import { users, campaigns, challenges, actions, userActions } from './schema';

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
    const marraine = existingUsers.find((u) => u.role === 'marraine');
    const managers = existingUsers.filter((u) => u.role === 'manager');
    const fbos = existingUsers.filter((u) => u.role === 'fbo');

    if (!marraine || managers.length === 0 || fbos.length === 0) {
      throw new Error('Utilisateurs manquants dans la base de données');
    }

    // Utiliser les managers existants
    const manager1 = managers[0];
    const manager2 = managers[1];
    const manager3 = managers[2];

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
        createdBy: marraine.id,
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

    console.log('✅ Seed completed successfully!');
    console.log(`Created:
    - 1 Marraine: ${marraine.email}
    - 3 Managers: ${manager1.email}, ${manager2.email}, ${manager3.email}
    - 3 FBOs: ${fbo1.email}, ${fbo2.email}, ${fbo3.email}
    - 1 Campaign: ${campaign.name}
    - 1 Challenge for ${today}
    - 3 Actions for today's challenge
    - 6 UserActions (assignments)
    `);
  } catch (error) {
    console.error('❌ Seed failed:', error);
  } finally {
    await sql.end();
  }
}

seed();
