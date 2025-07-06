import postgres from 'postgres';

async function diagnoseBatabase() {
  const connectionString =
    process.env.DATABASE_URL ||
    'postgresql://postgres:postgres@localhost:5432/htf_sunup_db';

  console.log('🔍 Diagnostic de la base de données...');
  console.log(
    '📡 URL de connexion:',
    connectionString.replace(/\/\/[^@]*@/, '//***:***@'),
  );

  // Utiliser SSL seulement pour les connexions externes (production)
  const isLocalDatabase =
    connectionString.includes('localhost') ||
    connectionString.includes('127.0.0.1');

  const sql = postgres(connectionString, {
    max: 1,
    ssl: isLocalDatabase ? false : 'require',
  });

  try {
    // Test de connexion
    console.log('\n🔗 Test de connexion...');
    const version = await sql`SELECT version()`;
    console.log('✅ Connexion réussie');
    console.log('📊 Version PostgreSQL:', version[0].version.split(' ')[0]);

    // Vérifier les tables existantes
    console.log('\n📋 Tables existantes:');
    const tables = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name;
    `;

    if (tables.length === 0) {
      console.log('❌ Aucune table trouvée');
    } else {
      tables.forEach((table) => {
        console.log(`  ✅ ${table.table_name}`);
      });
    }

    // Vérifier la structure de la table users
    console.log('\n👤 Structure de la table users:');
    const userColumns = await sql`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'users'
      ORDER BY ordinal_position;
    `;

    if (userColumns.length === 0) {
      console.log('❌ Table users non trouvée');
    } else {
      userColumns.forEach((col) => {
        console.log(
          `  📝 ${col.column_name} (${col.data_type}) - ${col.is_nullable === 'YES' ? 'NULL' : 'NOT NULL'}`,
        );
      });
    }

    // Vérifier les colonnes Facebook spécifiquement
    console.log('\n📱 Colonnes Facebook dans users:');
    const facebookColumns = [
      'facebook_id',
      'facebook_access_token',
      'profile_picture',
      'auth_provider',
    ];

    for (const colName of facebookColumns) {
      const exists = await sql`
        SELECT EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name = 'users' AND column_name = ${colName}
        );
      `;

      if (exists[0].exists) {
        console.log(`  ✅ ${colName} - Présente`);
      } else {
        console.log(`  ❌ ${colName} - Manquante`);
      }
    }

    // Compter les utilisateurs
    console.log('\n📊 Statistiques des utilisateurs:');
    try {
      const userCount = await sql`SELECT COUNT(*) as count FROM users`;
      console.log(`  👥 Total utilisateurs: ${userCount[0].count}`);

      const roleStats = await sql`
        SELECT role, COUNT(*) as count 
        FROM users 
        GROUP BY role 
        ORDER BY role;
      `;

      roleStats.forEach((stat) => {
        console.log(`  📋 ${stat.role}: ${stat.count}`);
      });
    } catch (error) {
      console.log(
        '❌ Erreur lors du comptage des utilisateurs:',
        error.message,
      );
    }

    // Vérifier les contraintes
    console.log('\n🔗 Contraintes de clé étrangère:');
    const constraints = await sql`
      SELECT 
        tc.constraint_name,
        tc.table_name,
        kcu.column_name,
        ccu.table_name AS foreign_table_name,
        ccu.column_name AS foreign_column_name 
      FROM information_schema.table_constraints AS tc 
      JOIN information_schema.key_column_usage AS kcu
        ON tc.constraint_name = kcu.constraint_name
      JOIN information_schema.constraint_column_usage AS ccu
        ON ccu.constraint_name = tc.constraint_name
      WHERE tc.constraint_type = 'FOREIGN KEY'
      ORDER BY tc.table_name, tc.constraint_name;
    `;

    if (constraints.length === 0) {
      console.log('❌ Aucune contrainte de clé étrangère trouvée');
    } else {
      constraints.forEach((constraint) => {
        console.log(
          `  🔗 ${constraint.table_name}.${constraint.column_name} -> ${constraint.foreign_table_name}.${constraint.foreign_column_name}`,
        );
      });
    }

    console.log('\n🎉 Diagnostic terminé avec succès !');
  } catch (error) {
    console.error('❌ Erreur lors du diagnostic:', error.message);
    console.error("📝 Détails de l'erreur:", error);
  } finally {
    await sql.end();
  }
}

// Exécuter le diagnostic si le script est appelé directement
if (require.main === module) {
  diagnoseBatabase();
}

module.exports = diagnoseBatabase;
