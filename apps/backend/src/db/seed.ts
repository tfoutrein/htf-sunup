import { drizzle } from 'drizzle-orm/postgres-js';
const postgres = require('postgres');
import * as bcrypt from 'bcryptjs';
import { users, actions, userActions } from './schema';

const connectionString =
  process.env.DATABASE_URL ||
  'postgresql://postgres:postgres@localhost:5432/template_db';

async function seed() {
  const sql = postgres(connectionString);
  const db = drizzle(sql);

  console.log('🌱 Starting HTF SunUp MVP seed...');

  try {
    // Clear existing data
    await db.delete(userActions);
    await db.delete(actions);
    await db.delete(users);

    // Hash password for all users
    const hashedPassword = await bcrypt.hash('password', 10);

    // Create Marraine (Aurélia)
    const [marraine] = await db
      .insert(users)
      .values({
        name: 'Aurélia',
        email: 'aurelia@htf.com',
        password: hashedPassword,
        role: 'marraine',
      })
      .returning();

    // Create Managers
    const [manager1] = await db
      .insert(users)
      .values({
        name: 'Jéromine',
        email: 'jeromine@htf.com',
        password: hashedPassword,
        role: 'manager',
      })
      .returning();

    const [manager2] = await db
      .insert(users)
      .values({
        name: 'Gaëlle',
        email: 'gaelle@htf.com',
        password: hashedPassword,
        role: 'manager',
      })
      .returning();

    const [manager3] = await db
      .insert(users)
      .values({
        name: 'Audrey',
        email: 'audrey@htf.com',
        password: hashedPassword,
        role: 'manager',
      })
      .returning();

    // Create FBO members for manager1
    const [fbo1] = await db
      .insert(users)
      .values({
        name: 'Marie Dupont',
        email: 'marie@htf.com',
        password: hashedPassword,
        role: 'fbo',
        managerId: manager1.id,
      })
      .returning();

    const [fbo2] = await db
      .insert(users)
      .values({
        name: 'Pierre Martin',
        email: 'pierre@htf.com',
        password: hashedPassword,
        role: 'fbo',
        managerId: manager1.id,
      })
      .returning();

    // Create FBO members for manager2
    const [fbo3] = await db
      .insert(users)
      .values({
        name: 'Sophie Bernard',
        email: 'sophie@htf.com',
        password: hashedPassword,
        role: 'fbo',
        managerId: manager2.id,
      })
      .returning();

    // Create sample actions for today
    const today = new Date().toISOString().split('T')[0];

    const [action1] = await db
      .insert(actions)
      .values({
        title: 'Appel prospection client',
        description:
          'Contacter 3 prospects qualifiés pour présenter nos produits Aloe Vera',
        type: 'vente',
        date: today,
        createdBy: manager1.id,
      })
      .returning();

    const [action2] = await db
      .insert(actions)
      .values({
        title: 'Partage réseau social',
        description:
          'Publier un témoignage client sur Instagram avec hashtags #ForeverLiving #AloeVera',
        type: 'reseaux_sociaux',
        date: today,
        createdBy: manager1.id,
      })
      .returning();

    const [action3] = await db
      .insert(actions)
      .values({
        title: 'Invitation événement',
        description: 'Inviter 2 personnes à la prochaine présentation produit',
        type: 'recrutement',
        date: today,
        createdBy: manager1.id,
      })
      .returning();

    // Assign actions to FBOs
    await db.insert(userActions).values([
      { userId: fbo1.id, actionId: action1.id },
      { userId: fbo1.id, actionId: action2.id },
      { userId: fbo1.id, actionId: action3.id },
      { userId: fbo2.id, actionId: action1.id },
      { userId: fbo2.id, actionId: action2.id },
      { userId: fbo2.id, actionId: action3.id },
    ]);

    console.log('✅ Seed completed successfully!');
    console.log(`Created:
    - 1 Marraine: ${marraine.email}
    - 3 Managers: ${manager1.email}, ${manager2.email}, ${manager3.email}
    - 3 FBOs: ${fbo1.email}, ${fbo2.email}, ${fbo3.email}
    - 3 Actions for ${today}
    - 6 UserActions (assignments)
    `);
  } catch (error) {
    console.error('❌ Seed failed:', error);
  } finally {
    await sql.end();
  }
}

seed();
