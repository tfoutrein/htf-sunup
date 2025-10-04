/**
 * Script de synchronisation des migrations
 *
 * Ce script résout le problème de désynchronisation entre les migrations locales (0-11)
 * et les migrations en production (0-7, 283-285).
 *
 * Il met à jour la table __drizzle_migrations en production pour que les hash
 * correspondent aux tags locaux, permettant ainsi à Drizzle de fonctionner normalement.
 *
 * Exécution : Automatique lors du déploiement (start:prod)
 */

import { drizzle } from 'drizzle-orm/postgres-js';

async function syncMigrations() {
  const connectionString =
    process.env.DATABASE_URL ||
    'postgresql://postgres:postgres@localhost:5432/htf_sunup_db';

  console.log('🔄 Synchronisation des migrations...');

  const isLocalDatabase =
    connectionString.includes('localhost') ||
    connectionString.includes('127.0.0.1');

  // Use require directly for CommonJS compatibility in production
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const postgres = require('postgres');
  const sql = postgres(connectionString, {
    max: 1,
    ssl: isLocalDatabase ? false : 'require',
  });

  try {
    // Vérifier si la table de migrations existe
    const [schemaExists] = await sql`
      SELECT EXISTS (
        SELECT FROM pg_namespace 
        WHERE nspname = 'drizzle'
      ) as exists
    `;

    if (!schemaExists.exists) {
      console.log(
        "ℹ️  Schema drizzle n'existe pas encore - première migration",
      );
      await sql.end();
      return;
    }

    // Récupérer les migrations actuelles en prod
    const currentMigrations = await sql`
      SELECT id, hash, created_at 
      FROM drizzle.__drizzle_migrations 
      ORDER BY id
    `;

    console.log(`📊 Migrations actuelles en base: ${currentMigrations.length}`);

    // Vérifier si on est dans le cas de désynchronisation (283-285 présents)
    const hasOldNumbering = currentMigrations.some((m) => m.id >= 283);

    if (!hasOldNumbering) {
      console.log('✅ Numérotation déjà synchronisée - rien à faire');
      await sql.end();
      return;
    }

    console.log('⚠️  Désynchronisation détectée - correction en cours...');

    // Mapping des anciennes migrations vers les nouvelles
    const migrationMapping = [
      { oldId: 283, newId: 8, newTag: '0008_brave_songbird' },
      { oldId: 284, newId: 9, newTag: '0009_daily_chat' },
      { oldId: 285, newId: 10, newTag: '0010_perpetual_magneto' },
    ];

    // Vérifier quelles migrations doivent être mises à jour
    const migrationsToUpdate = migrationMapping.filter((mapping) =>
      currentMigrations.some((m) => m.id === mapping.oldId),
    );

    if (migrationsToUpdate.length === 0) {
      console.log('✅ Aucune mise à jour nécessaire');
      await sql.end();
      return;
    }

    console.log(`🔧 Mise à jour de ${migrationsToUpdate.length} migrations...`);

    // Transaction pour mettre à jour les migrations
    await sql.begin(async (tx) => {
      for (const mapping of migrationsToUpdate) {
        const [oldMigration] = currentMigrations.filter(
          (m) => m.id === mapping.oldId,
        );

        console.log(
          `   ${mapping.oldId} → ${mapping.newId} (${mapping.newTag})`,
        );

        await tx`
          UPDATE drizzle.__drizzle_migrations 
          SET id = ${mapping.newId}, 
              hash = ${mapping.newTag}
          WHERE id = ${mapping.oldId}
        `;
      }
    });

    console.log('✅ Migrations synchronisées avec succès !');
    console.log('');
    console.log('📋 État après synchronisation:');

    const updatedMigrations = await sql`
      SELECT id, hash, created_at 
      FROM drizzle.__drizzle_migrations 
      ORDER BY id
    `;

    updatedMigrations.forEach((m) => {
      const date = new Date(parseInt(m.created_at)).toISOString().split('T')[0];
      console.log(`   [${m.id}] ${m.hash} (${date})`);
    });
    console.log('');

    console.log('🎯 Système de migrations prêt pour Drizzle');
  } catch (error) {
    console.error('❌ Erreur lors de la synchronisation:', error.message);
    console.error('Stack:', error.stack);

    // Ne pas bloquer le déploiement si c'est juste un problème de sync
    // (les migrations Drizzle pourraient quand même fonctionner)
    console.warn("⚠️  Poursuite du déploiement malgré l'erreur de sync");
  } finally {
    await sql.end();
  }
}

// Exécuter le script si appelé directement
syncMigrations()
  .then(() => {
    console.log('✅ Synchronisation terminée');
    process.exit(0);
  })
  .catch((err) => {
    console.error('❌ Erreur fatale:', err);
    process.exit(1);
  });
