import { drizzle } from 'drizzle-orm/postgres-js';
const postgres = require('postgres');
import { eq } from 'drizzle-orm';
import { users } from './schema';

const connectionString =
  process.env.DATABASE_URL ||
  'postgresql://postgres:postgres@localhost:5432/htf_sunup_db';

async function fixHierarchy() {
  const sql = postgres(connectionString);
  const db = drizzle(sql);

  console.log('🔧 Fixing user hierarchy...');

  try {
    // Récupérer tous les utilisateurs
    const allUsers = await db.select().from(users);
    console.log('Current users:', allUsers);

    // Trouver le manager principal (celui sans manager_id)
    const principalManager = allUsers.find(
      (u) => u.role === 'manager' && !u.managerId,
    );
    if (!principalManager) {
      console.log(
        'Aucun manager principal trouvé, tous les managers ont déjà un manager_id',
      );
      return;
    }

    console.log(
      `Manager principal trouvé: ${principalManager.name} (ID: ${principalManager.id})`,
    );

    // Trouver les autres managers sans manager_id (sauf le principal)
    const managersWithoutBoss = allUsers.filter(
      (u) =>
        u.role === 'manager' && !u.managerId && u.id !== principalManager.id,
    );

    console.log(`Managers sans hiérarchie: ${managersWithoutBoss.length}`);

    // Assigner tous les managers au manager principal
    for (const manager of managersWithoutBoss) {
      console.log(
        `Assignation de ${manager.name} au manager principal ${principalManager.name}...`,
      );
      await db
        .update(users)
        .set({ managerId: principalManager.id })
        .where(eq(users.id, manager.id));
    }

    // Vérification finale
    const updatedUsers = await db.select().from(users);
    console.log('\n📊 Hiérarchie finale:');

    console.log(`\n🎯 Manager Principal: ${principalManager.name}`);

    const managersUnderPrincipal = updatedUsers.filter(
      (u) => u.role === 'manager' && u.managerId === principalManager.id,
    );
    console.log(`├── Managers (${managersUnderPrincipal.length}):`);
    managersUnderPrincipal.forEach((manager) => {
      console.log(`│   ├── ${manager.name}`);

      const fbosUnderManager = updatedUsers.filter(
        (u) => u.role === 'fbo' && u.managerId === manager.id,
      );
      fbosUnderManager.forEach((fbo) => {
        console.log(`│   │   └── ${fbo.name} (FBO)`);
      });
    });

    console.log('\n✅ Hiérarchie corrigée avec succès!');
  } catch (error) {
    console.error('❌ Erreur lors de la correction:', error);
  } finally {
    await sql.end();
  }
}

fixHierarchy();
