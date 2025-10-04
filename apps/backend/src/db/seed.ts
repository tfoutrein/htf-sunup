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
  appVersions,
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
    await db.delete(dailyBonus);
    await db.delete(campaignBonusConfig);
    await db.delete(campaigns);
    await db.delete(appVersions);
    await db.delete(users); // Supprimer aussi les users pour repartir de zéro

    console.log('👥 Creating test users...');

    // Hash du mot de passe "password" pour tous les utilisateurs de test
    const hashedPassword = await bcrypt.hash('password', 10);

    // Créer Aurelia (marraine principale)
    const [principalManager] = await db
      .insert(users)
      .values({
        name: 'Aurelia',
        email: 'aurelia@htf.com',
        password: hashedPassword,
        role: 'manager',
        authProvider: 'local',
      })
      .returning();

    // Créer les autres managers
    const [manager1] = await db
      .insert(users)
      .values({
        name: 'Manager 1',
        email: 'manager1@htf.com',
        password: hashedPassword,
        role: 'manager',
        authProvider: 'local',
      })
      .returning();

    const [manager2] = await db
      .insert(users)
      .values({
        name: 'Manager 2',
        email: 'manager2@htf.com',
        password: hashedPassword,
        role: 'manager',
        authProvider: 'local',
      })
      .returning();

    const [manager3] = await db
      .insert(users)
      .values({
        name: 'Manager 3',
        email: 'manager3@htf.com',
        password: hashedPassword,
        role: 'manager',
        authProvider: 'local',
      })
      .returning();

    // Créer les FBOs
    const [fbo1] = await db
      .insert(users)
      .values({
        name: 'FBO 1',
        email: 'fbo1@htf.com',
        password: hashedPassword,
        role: 'fbo',
        authProvider: 'local',
        managerId: manager3.id, // FBO 1 sous Manager 3
      })
      .returning();

    const [fbo2] = await db
      .insert(users)
      .values({
        name: 'FBO 2',
        email: 'fbo2@htf.com',
        password: hashedPassword,
        role: 'fbo',
        authProvider: 'local',
        managerId: manager3.id, // FBO 2 sous Manager 3
      })
      .returning();

    const [fbo3] = await db
      .insert(users)
      .values({
        name: 'FBO 3',
        email: 'fbo3@htf.com',
        password: hashedPassword,
        role: 'fbo',
        authProvider: 'local',
        managerId: manager2.id, // FBO 3 sous Manager 2
      })
      .returning();

    console.log('✅ Test users created successfully!');

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

      // FBO3 bonuses
      {
        userId: fbo3.id,
        campaignId: campaign.id,
        bonusDate: today,
        bonusType: 'basket',
        amount: '2.50',
        status: 'pending',
        proofUrl:
          'https://via.placeholder.com/400x300/8B5CF6/FFFFFF?text=Preuve+Panier+FBO3',
      },
    ]);

    // Seed App Versions (Release Notes)
    console.log('📝 Seeding app versions...');
    await db.insert(appVersions).values([
      {
        version: '1.2.0',
        title: 'Nouveau système de bonus quotidiens',
        releaseDate: '2025-08-10',
        isActive: true,
        isMajor: true,
        shortDescription:
          '🎉 Nouvelle fonctionnalité : Déclarez vos paniers et parrainages quotidiens ! Système de validation par vos managers et suivi de vos gains en temps réel.',
        fullReleaseNotes: `## 🎉 Nouvelles fonctionnalités

- **Bonus quotidiens** : Déclarez facilement vos paniers et parrainages du jour
- **Upload de preuves** : Photos et vidéos pour valider vos bonus auprès de votre manager
- **Validation manager** : Workflow complet d'approbation des bonus par vos managers
- **Compteur de gains** : Suivez vos euros gagnés en temps réel avec des animations fun

## ✨ Améliorations

- Interface plus fluide et responsive sur mobile
- Animations et effets visuels améliorés pour une expérience plus engageante
- Performance optimisée pour un chargement plus rapide

## 🐛 Corrections

- Correction des problèmes de synchronisation des données
- Amélioration de la stabilité générale de l'application`,
      },
      {
        version: '1.1.0',
        title: 'Système de preuves multiples',
        releaseDate: '2025-07-25',
        isActive: true,
        isMajor: false,
        shortDescription:
          "📸 Vous pouvez maintenant uploader plusieurs photos et vidéos pour vos actions ! Visionneuse améliorée et gestion d'erreurs optimisée.",
        fullReleaseNotes: `## 📸 Nouvelles fonctionnalités

- **Upload multiple** : Ajoutez plusieurs photos/vidéos par action
- **Visionneuse améliorée** : Navigation fluide entre vos preuves
- **Gestion d'erreurs** : Messages plus clairs en cas de problème

## 🔧 Améliorations techniques

- Optimisation du stockage des fichiers
- Amélioration de la vitesse d'upload
- Interface plus intuitive`,
      },
      {
        version: '1.0.0',
        title: "Lancement des défis d'été HTF",
        releaseDate: '2025-07-01',
        isActive: true,
        isMajor: true,
        shortDescription:
          "🚀 Bienvenue dans l'application des défis d'été ! Découvrez vos défis quotidiens, validez vos actions et suivez vos gains.",
        fullReleaseNotes: `## 🚀 Lancement officiel

Bienvenue dans l'application des défis d'été de la Happy Team Factory !

## 🎯 Fonctionnalités principales

- **Défis quotidiens** : Découvrez chaque jour vos nouveaux défis
- **Actions variées** : Vente, recrutement, réseaux sociaux
- **Suivi des gains** : Compteur en temps réel de vos euros gagnés
- **Interface summer** : Design décontracté avec effets Aurora

## 👥 Pour les managers

- **Dashboard équipe** : Vue d'ensemble de votre équipe
- **Gestion des campagnes** : Créez et planifiez vos défis
- **Calendrier interactif** : Organisation visuelle des challenges

Bon été et bons défis ! 🌞`,
      },
    ]);

    console.log('✅ Seed completed successfully!');
    console.log(`
📊 Seed Summary:
================

👥 Users:
  - 1 Manager Principal (Marraine): ${principalManager.email} (password)
  - 3 Managers: 
    * ${manager1.email}
    * ${manager2.email}
    * ${manager3.email}
  - 3 FBOs: 
    * ${fbo1.email} (sous ${manager3.name})
    * ${fbo2.email} (sous ${manager3.name})
    * ${fbo3.email} (sous ${manager2.name})

🎯 Campaign & Challenges:
  - 1 Campaign: ${campaign.name}
  - 1 Challenge for ${today}
  - 3 Actions per challenge
  - 6 UserActions (2 FBOs × 3 actions)

💰 Bonuses:
  - 1 Bonus configuration (Panier: 2.50€, Parrainage: 10.00€)
  - 6 Daily bonuses (various dates and types)

📱 App Versions:
  - 3 Release notes (v1.0.0, v1.1.0, v1.2.0)

🔑 Login Info:
  All users have password: password
`);
  } catch (error) {
    console.error('❌ Seed failed:', error);
  } finally {
    await sql.end();
  }
}

seed();
