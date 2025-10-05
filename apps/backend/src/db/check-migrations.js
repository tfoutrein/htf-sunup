#!/usr/bin/env node
const postgres = require('postgres');

const PROD_DB_URL =
  'postgresql://htf_sunup_postgres_user:NxW7QrfoU2l7Lry090Q69gj8qDkgFny0@dpg-d1b8fsadbo4c73c9ier0-a.oregon-postgres.render.com/htf_sunup_postgres';

async function checkMigrations() {
  console.log('🔍 Vérification des migrations Drizzle en production...\n');

  const sql = postgres(PROD_DB_URL, {
    max: 1,
    ssl: 'require',
  });

  try {
    const migrations = await sql`
      SELECT id, hash, created_at 
      FROM drizzle.__drizzle_migrations 
      ORDER BY id
    `;

    console.log(`📊 Migrations appliquées: ${migrations.length}\n`);

    migrations.forEach((m) => {
      const date = new Date(parseInt(m.created_at)).toISOString().split('T')[0];
      console.log(`   [${m.id}] ${m.hash} (${date})`);
    });

    console.log('\n📋 Dernière migration:');
    if (migrations.length > 0) {
      const last = migrations[migrations.length - 1];
      console.log(`   ID: ${last.id}`);
      console.log(`   Hash: ${last.hash}`);
      console.log(
        `   Date: ${new Date(parseInt(last.created_at)).toISOString()}`,
      );

      if (last.hash === '0011_add_performance_indexes' || last.id === 11) {
        console.log('\n✅ La migration 0011 est marquée comme appliquée');
        console.log('⚠️  Mais les indexes ne sont pas créés!');
        console.log(
          '⚠️  Il y a eu une erreur silencieuse pendant la migration',
        );
      } else {
        console.log("\n❌ La migration 0011 n'a PAS été appliquée");
        console.log(`   Migration actuelle: ${last.hash || last.id}`);
      }
    }
  } catch (error) {
    console.error('❌ Erreur:', error.message);
    process.exit(1);
  } finally {
    await sql.end();
  }
}

checkMigrations()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('❌ Erreur fatale:', err);
    process.exit(1);
  });
