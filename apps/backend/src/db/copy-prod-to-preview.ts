/**
 * Script de copie des données de production vers preview
 *
 * Ce script est exécuté automatiquement lors de la création d'un preview environment.
 * Il copie toutes les données de la base de production vers la base de preview
 * pour permettre des tests iso-prod.
 *
 * ⚠️ IMPORTANT : Ce script ne s'exécute que dans les environnements de preview
 */

import postgres from 'postgres';
// @ts-ignore - Fix pour l'import en production
const postgresClient = postgres || require('postgres');

interface TableRow {
  tablename: string;
}

async function copyProdToPreview() {
  console.log('🔄 Copie des données de production vers preview...\n');

  // Vérifier les variables d'environnement
  const previewDbUrl = process.env.DATABASE_URL;
  const prodDbUrl = process.env.PRODUCTION_DATABASE_URL;

  if (!previewDbUrl) {
    console.error('❌ DATABASE_URL non définie');
    process.exit(1);
  }

  if (!prodDbUrl) {
    console.log('⚠️  PRODUCTION_DATABASE_URL non définie');
    console.log('ℹ️  Ce script nécessite la variable PRODUCTION_DATABASE_URL');
    console.log(
      'ℹ️  Ajoutez-la dans le Dashboard Render avec la connection string de prod',
    );
    process.exit(0);
  }

  // Vérifier que nous sommes dans un environnement de preview
  const serviceName = process.env.RENDER_SERVICE_NAME || '';
  if (!serviceName.includes('PR #') && !serviceName.includes('pr-')) {
    console.log(
      "⚠️  Ce script ne doit s'exécuter que dans un environnement de preview",
    );
    console.log(`   Service actuel: ${serviceName}`);
    process.exit(0);
  }

  // Vérifier que les URLs sont différentes
  if (previewDbUrl === prodDbUrl) {
    console.error(
      '❌ Erreur : DATABASE_URL et PRODUCTION_DATABASE_URL sont identiques !',
    );
    console.error('   Vous ne pouvez pas copier une base sur elle-même.');
    console.error('');
    console.error('💡 Solution :');
    console.error(
      '   1. Configurez PRODUCTION_DATABASE_URL avec sync: false dans render.yaml',
    );
    console.error(
      '   2. Ajoutez manuellement la connection string de prod dans le Dashboard Render',
    );
    console.error('   3. Cette valeur sera héritée par tous les previews');
    process.exit(1);
  }

  console.log(`📊 Source: Base de production`);
  console.log(`🎯 Destination: Base de preview (${serviceName})\n`);

  let prodSql: ReturnType<typeof postgres> | null = null;
  let previewSql: ReturnType<typeof postgres> | null = null;

  try {
    // Connexion aux deux bases
    console.log('🔗 Connexion à la base de production...');
    prodSql = postgresClient(prodDbUrl, {
      max: 1,
      ssl: 'require',
      idle_timeout: 20,
      connect_timeout: 30,
    });

    console.log('🔗 Connexion à la base de preview...');
    previewSql = postgresClient(previewDbUrl, {
      max: 1,
      ssl: 'require',
      idle_timeout: 20,
      connect_timeout: 30,
    });

    // Récupérer la liste des tables à copier
    console.log('\n📋 Récupération de la liste des tables...');
    const tables = await prodSql<TableRow[]>`
      SELECT tablename 
      FROM pg_catalog.pg_tables 
      WHERE schemaname = 'public' 
      ORDER BY tablename
    `;

    console.log(`✅ ${tables.length} tables trouvées\n`);

    // Ordre de copie pour respecter les contraintes de clés étrangères
    const tableOrder = [
      'users',
      'campaigns',
      'actions',
      'challenges',
      'campaign_bonus_config',
      'campaign_unlock_conditions',
      'campaign_validation_conditions',
      'campaign_validations',
      'user_actions',
      'daily_bonus',
      'proofs',
      'user_version_tracking',
      'app_versions',
    ];

    // Filtrer pour ne garder que les tables qui existent
    const orderedTables = tableOrder.filter((table) =>
      tables.some((t) => t.tablename === table),
    );

    // Ajouter les tables non listées
    const remainingTables = tables
      .map((t) => t.tablename)
      .filter((t) => !tableOrder.includes(t));

    const allTables = [...orderedTables, ...remainingTables];

    console.log('📦 Ordre de copie des tables:');
    allTables.forEach((table, i) => console.log(`   ${i + 1}. ${table}`));
    console.log('');

    let totalRows = 0;

    // Copier chaque table
    for (const tableName of allTables) {
      try {
        console.log(`📥 Copie de la table "${tableName}"...`);

        // Compter les lignes dans la prod
        const [{ count: prodCount }] = await prodSql`
          SELECT COUNT(*)::int as count FROM ${prodSql(tableName)}
        `;

        if (prodCount === 0) {
          console.log(`   ℹ️  Table vide, passage à la suivante`);
          continue;
        }

        // Récupérer toutes les données
        const rows = await prodSql`SELECT * FROM ${prodSql(tableName)}`;

        if (rows.length > 0) {
          // Vider la table de preview (CASCADE gère les FK automatiquement)
          await previewSql`TRUNCATE ${previewSql(tableName)} CASCADE`;

          // Insérer les données par batch de 100
          const batchSize = 100;
          for (let i = 0; i < rows.length; i += batchSize) {
            const batch = rows.slice(i, i + batchSize);
            await previewSql`INSERT INTO ${previewSql(tableName)} ${previewSql(batch)}`;
          }

          totalRows += rows.length;
          console.log(`   ✅ ${rows.length} lignes copiées`);
        }
      } catch (error) {
        console.error(
          `   ❌ Erreur lors de la copie de ${tableName}:`,
          error.message,
        );
        // Continuer avec les autres tables
      }
    }

    console.log('\n🎉 Copie terminée avec succès!');
    console.log(`📊 Total: ${totalRows} lignes copiées\n`);

    // Afficher un résumé
    console.log('📈 Résumé de la base de preview:');
    const summary = await previewSql`
      SELECT 
        (SELECT COUNT(*) FROM users) as users,
        (SELECT COUNT(*) FROM campaigns) as campaigns,
        (SELECT COUNT(*) FROM user_actions) as user_actions,
        (SELECT COUNT(*) FROM daily_bonus) as daily_bonus,
        (SELECT COUNT(*) FROM proofs) as proofs
    `;
    console.table(summary);

    console.log('\n⚠️  OPTIONNEL: Anonymisation des données sensibles');
    console.log('   Si nécessaire, ajoutez du code pour anonymiser:');
    console.log('   - Emails des utilisateurs');
    console.log('   - Tokens Facebook');
    console.log('   - Autres données personnelles');
  } catch (error) {
    console.error('\n❌ Erreur fatale:', error);
    process.exit(1);
  } finally {
    // Fermer les connexions
    if (prodSql) await prodSql.end();
    if (previewSql) await previewSql.end();
  }
}

// Exécuter si appelé directement
if (require.main === module) {
  copyProdToPreview()
    .then(() => {
      console.log('\n✅ Script terminé avec succès');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Erreur:', error);
      process.exit(1);
    });
}

export default copyProdToPreview;
