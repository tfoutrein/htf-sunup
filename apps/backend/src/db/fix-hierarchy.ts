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

    // Trouver la marraine
    const marraine = allUsers.find((u) => u.role === 'marraine');
    if (!marraine) {
      throw new Error('Aucune marraine trouvée');
    }

    console.log(`Marraine trouvée: ${marraine.name} (ID: ${marraine.id})`);

    // Trouver les managers sans manager_id
    const managersWithoutBoss = allUsers.filter(
      (u) => u.role === 'manager' && !u.managerId,
    );

    console.log(`Managers sans hiérarchie: ${managersWithoutBoss.length}`);

    // Assigner tous les managers à la marraine
    for (const manager of managersWithoutBoss) {
      console.log(`Assignation de ${manager.name} à ${marraine.name}...`);
      await db
        .update(users)
        .set({ managerId: marraine.id })
        .where(eq(users.id, manager.id));
    }

    // Vérification finale
    const updatedUsers = await db.select().from(users);
    console.log('\n📊 Hiérarchie finale:');

    console.log(`\n🎯 Marraine: ${marraine.name}`);

    const managersUnderMarraine = updatedUsers.filter(
      (u) => u.role === 'manager' && u.managerId === marraine.id,
    );
    console.log(`├── Managers (${managersUnderMarraine.length}):`);
    managersUnderMarraine.forEach((manager) => {
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
