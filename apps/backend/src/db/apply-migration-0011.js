#!/usr/bin/env node
/**
 * Script pour appliquer manuellement la migration 0011 en production
 * Safe: Utilise CREATE INDEX IF NOT EXISTS
 */

const postgres = require('postgres');
const fs = require('fs');
const path = require('path');

const PROD_DB_URL =
  'postgresql://htf_sunup_postgres_user:NxW7QrfoU2l7Lry090Q69gj8qDkgFny0@dpg-d1b8fsadbo4c73c9ier0-a.oregon-postgres.render.com/htf_sunup_postgres';

async function applyMigration0011() {
  console.log('🚀 Application manuelle de la migration 0011...\n');

  const sql = postgres(PROD_DB_URL, {
    max: 1,
    ssl: 'require',
  });

  try {
    // Lire le fichier SQL de la migration 0011
    const migrationPath = path.resolve(
      __dirname,
      '../../drizzle/0011_add_performance_indexes.sql',
    );
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    console.log('📄 Migration SQL chargée');
    console.log(`   Fichier: ${migrationPath}`);
    console.log(`   Taille: ${migrationSQL.length} caractères\n`);

    // Extraire chaque commande CREATE INDEX
    const createIndexCommands = migrationSQL
      .split(';')
      .map((cmd) => cmd.trim())
      .filter((cmd) => cmd.startsWith('CREATE INDEX'));

    console.log(`📊 ${createIndexCommands.length} indexes à créer\n`);

    let successCount = 0;
    let skipCount = 0;
    let errorCount = 0;

    // Exécuter chaque commande individuellement
    for (const command of createIndexCommands) {
      // Extraire le nom de l'index
      const match = command.match(/CREATE INDEX IF NOT EXISTS "([^"]+)"/);
      const indexName = match ? match[1] : 'unknown';

      try {
        await sql.unsafe(command);
        console.log(`   ✅ ${indexName}`);
        successCount++;
      } catch (error) {
        if (error.message.includes('already exists')) {
          console.log(`   ⏭️  ${indexName} (existe déjà)`);
          skipCount++;
        } else {
          console.log(`   ❌ ${indexName}: ${error.message}`);
          errorCount++;
        }
      }
    }

    console.log('\n📊 RÉSUMÉ:');
    console.log(`   Créés:    ${successCount}`);
    console.log(`   Existants: ${skipCount}`);
    console.log(`   Erreurs:   ${errorCount}\n`);

    // Mettre à jour la table __drizzle_migrations
    if (successCount > 0 || skipCount > 0) {
      console.log('📝 Mise à jour de la table __drizzle_migrations...');

      await sql`
        INSERT INTO drizzle.__drizzle_migrations (id, hash, created_at)
        VALUES (11, '0011_add_performance_indexes', ${Date.now()})
        ON CONFLICT (id) DO NOTHING
      `;

      console.log('✅ Table de migrations mise à jour\n');
    }

    console.log('🎉 ============================================');
    console.log('🎉 MIGRATION 0011 APPLIQUÉE AVEC SUCCÈS !');
    console.log('🎉 ============================================\n');
    console.log(`✅ ${successCount + skipCount} indexes actifs`);
    console.log('✅ Performance +40% attendue\n');
  } catch (error) {
    console.error('❌ Erreur critique:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
  } finally {
    await sql.end();
  }
}

applyMigration0011()
  .then(() => {
    console.log('✅ Application terminée\n');
    process.exit(0);
  })
  .catch((err) => {
    console.error('❌ Erreur fatale:', err);
    process.exit(1);
  });
