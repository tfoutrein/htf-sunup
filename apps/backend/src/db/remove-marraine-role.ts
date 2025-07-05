const { drizzle } = require('drizzle-orm/postgres-js');
const { eq } = require('drizzle-orm');
const postgres = require('postgres');
const { users } = require('./schema');

// Configuration base de données
const connectionString =
  process.env.DATABASE_URL ||
  'postgresql://postgres:postgres@localhost:5432/htf_sunup_db';

const sql = postgres(connectionString);
const db = drizzle(sql);

async function removeMarraineRole() {
  try {
    console.log('🔄 Début de la migration : suppression du rôle marraine...');

    // 1. Vérifier s'il y a des utilisateurs avec le rôle marraine
    const marraineUsers = await db
      .select()
      .from(users)
      .where(eq(users.role, 'marraine'));

    console.log(
      `📊 Nombre d'utilisateurs avec le rôle marraine: ${marraineUsers.length}`,
    );

    if (marraineUsers.length > 0) {
      console.log('👥 Utilisateurs marraine trouvés:');
      marraineUsers.forEach((user) => {
        console.log(`  - ${user.name} (${user.email})`);
      });

      // 2. Convertir tous les utilisateurs marraine en manager
      const result = await db
        .update(users)
        .set({
          role: 'manager',
          updatedAt: new Date(),
        })
        .where(eq(users.role, 'marraine'))
        .returning();

      console.log(
        `✅ ${result.length} utilisateurs convertis de marraine vers manager`,
      );

      // 3. Vérifier la conversion
      const remainingMarraines = await db
        .select()
        .from(users)
        .where(eq(users.role, 'marraine'));

      if (remainingMarraines.length === 0) {
        console.log('✅ Aucune marraine restante - migration réussie');
      } else {
        console.log(
          `❌ ${remainingMarraines.length} marraine(s) restante(s) - migration échouée`,
        );
        return false;
      }

      // 4. Afficher la nouvelle hiérarchie des managers
      const allManagers = await db
        .select()
        .from(users)
        .where(eq(users.role, 'manager'));

      console.log('\n📋 Hiérarchie des managers après migration:');
      allManagers.forEach((manager) => {
        console.log(
          `  - ${manager.name} (${manager.email}) - Manager ID: ${manager.managerId || 'Top Level'}`,
        );
      });
    } else {
      console.log('ℹ️ Aucun utilisateur avec le rôle marraine trouvé');
    }

    console.log('🎉 Migration terminée avec succès');
    return true;
  } catch (error) {
    console.error('❌ Erreur lors de la migration:', error);
    return false;
  } finally {
    await sql.end();
  }
}

// Exécuter la migration si le script est appelé directement
if (require.main === module) {
  removeMarraineRole()
    .then((success) => {
      if (success) {
        console.log('✅ Migration terminée avec succès');
        process.exit(0);
      } else {
        console.log('❌ Migration échouée');
        process.exit(1);
      }
    })
    .catch((error) => {
      console.error('❌ Erreur fatale:', error);
      process.exit(1);
    });
}

export { removeMarraineRole };
