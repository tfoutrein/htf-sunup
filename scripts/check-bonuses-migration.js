#!/usr/bin/env node

/**
 * Script de vérification de la migration bonuses_enabled
 * Mode READ-ONLY
 */

const postgres = require('../apps/backend/node_modules/postgres');

const PROD_DB_URL = process.env.PROD_DB_URL || 
  'postgresql://htf_sunup_postgres_user:NxW7QrfoU2l7Lry090Q69gj8qDkgFny0@dpg-d1b8fsadbo4c73c9ier0-a.oregon-postgres.render.com/htf_sunup_postgres';

async function checkBonusesMigration() {
  console.log('🔍 Vérification de la migration bonuses_enabled');
  console.log('=' .repeat(60));
  console.log('');

  const sql = postgres(PROD_DB_URL, {
    ssl: 'require',
    max: 1,
  });

  try {
    // Vérifier si la colonne bonuses_enabled existe
    console.log('📋 Vérification de la colonne bonuses_enabled dans la table campaigns');
    const [columnCheck] = await sql`
      SELECT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'campaigns' 
        AND column_name = 'bonuses_enabled'
      ) as exists
    `;

    if (columnCheck.exists) {
      console.log('✅ La colonne bonuses_enabled existe dans la table campaigns');
      
      // Obtenir les détails de la colonne
      const [columnDetails] = await sql`
        SELECT 
          column_name,
          data_type,
          is_nullable,
          column_default
        FROM information_schema.columns
        WHERE table_name = 'campaigns'
        AND column_name = 'bonuses_enabled'
      `;
      
      console.log('   Détails:');
      console.log(`   - Type: ${columnDetails.data_type}`);
      console.log(`   - Nullable: ${columnDetails.is_nullable}`);
      console.log(`   - Default: ${columnDetails.column_default}`);
      console.log('');

      // Vérifier les valeurs dans les campagnes existantes
      const campaigns = await sql`
        SELECT id, name, bonuses_enabled
        FROM campaigns
        ORDER BY id
      `;
      
      console.log(`📊 Valeurs bonuses_enabled dans les ${campaigns.length} campagnes existantes:`);
      campaigns.forEach(c => {
        const status = c.bonuses_enabled ? '✓ Activés' : '✗ Désactivés';
        console.log(`   - Campagne #${c.id} (${c.name}): ${status}`);
      });
      console.log('');
      
    } else {
      console.log('❌ La colonne bonuses_enabled N\'EXISTE PAS dans la table campaigns');
      console.log('   → La migration 0014 n\'a pas encore été appliquée');
      console.log('');
    }

    // Vérifier les migrations Drizzle
    console.log('🗄️  Vérification des migrations Drizzle');
    const [drizzleSchema] = await sql`
      SELECT EXISTS (
        SELECT FROM pg_namespace 
        WHERE nspname = 'drizzle'
      ) as exists
    `;

    if (drizzleSchema.exists) {
      const migrations = await sql`
        SELECT id, hash, created_at 
        FROM drizzle.__drizzle_migrations 
        ORDER BY created_at DESC
        LIMIT 5
      `;
      
      console.log(`   Dernières migrations appliquées (${migrations.length} sur total):`);
      migrations.forEach(m => {
        const date = new Date(parseInt(m.created_at));
        const isMigration14 = m.id === '0014' || m.id.includes('0014');
        const icon = isMigration14 ? '✅' : '  ';
        console.log(`   ${icon} Migration ${m.id}: ${date.toISOString()}`);
      });
      console.log('');

      // Chercher spécifiquement la migration 0014
      const [migration14] = await sql`
        SELECT id, hash, created_at 
        FROM drizzle.__drizzle_migrations 
        WHERE id LIKE '%0014%'
      `;

      if (migration14) {
        console.log('✅ Migration 0014 trouvée dans la base:');
        const date = new Date(parseInt(migration14.created_at));
        console.log(`   - ID: ${migration14.id}`);
        console.log(`   - Date: ${date.toISOString()}`);
        console.log(`   - Hash: ${migration14.hash}`);
      } else {
        console.log('❌ Migration 0014 NON trouvée dans la base');
        console.log('   → La migration n\'a pas encore été appliquée en production');
      }
    } else {
      console.log('❌ Schema drizzle n\'existe pas');
    }

    console.log('');
    console.log('=' .repeat(60));
    console.log('✅ VÉRIFICATION TERMINÉE');
    console.log('');

  } catch (error) {
    console.error('❌ ERREUR:', error.message);
    console.error(error);
    process.exit(1);
  } finally {
    await sql.end();
  }
}

checkBonusesMigration().catch(err => {
  console.error('❌ Erreur fatale:', err);
  process.exit(1);
});

