const { drizzle: drizzleClient } = require('drizzle-orm/postgres-js');
const postgresClient = require('postgres');
const { users } = require('./schema');
const { eq, and, ne } = require('drizzle-orm');

async function updateAureliaHierarchy() {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    console.error('❌ DATABASE_URL not found');
    process.exit(1);
  }

  // Utiliser SSL seulement pour les connexions externes (production)
  const isLocalDatabase =
    connectionString.includes('localhost') ||
    connectionString.includes('127.0.0.1');
  const sql = postgresClient(connectionString, {
    max: 1,
    ssl: isLocalDatabase ? false : 'require',
  });
  const db = drizzleClient(sql);

  try {
    console.log('🔗 Connecting to database...');

    // 1. Trouver Aurelia
    const aurelia = await db
      .select()
      .from(users)
      .where(eq(users.email, 'aurelia@example.com'))
      .limit(1);

    if (aurelia.length === 0) {
      console.log('❌ Aurelia not found');
      process.exit(1);
    }

    console.log('👑 Found Aurelia:', aurelia[0]);

    // 2. Trouver tous les managers (sauf Aurelia)
    const managers = await db
      .select()
      .from(users)
      .where(
        and(
          eq(users.role, 'manager'),
          ne(users.email, 'aurelia@example.com'), // Exclure Aurelia
        ),
      );

    console.log(
      '👥 Found managers:',
      managers.map((m) => ({ id: m.id, name: m.name, email: m.email })),
    );

    // 3. Mettre à jour tous les managers pour qu'Aurelia soit leur manager
    for (const manager of managers) {
      if (manager.id !== aurelia[0].id) {
        await db
          .update(users)
          .set({ managerId: aurelia[0].id })
          .where(eq(users.id, manager.id));

        console.log(
          `✅ Updated ${manager.name} - managerId set to ${aurelia[0].id}`,
        );
      }
    }

    // 4. S'assurer qu'Aurelia n'a pas de manager (elle est au sommet)
    await db
      .update(users)
      .set({ managerId: null })
      .where(eq(users.id, aurelia[0].id));

    console.log('👑 Aurelia set as top manager (no managerId)');

    // 5. Vérifier la hiérarchie finale
    console.log('\n📋 Final hierarchy:');
    const allUsers = await db.select().from(users);

    for (const user of allUsers) {
      const managerName = user.managerId
        ? allUsers.find((u) => u.id === user.managerId)?.name || 'Unknown'
        : 'Top Manager';

      console.log(`${user.name} (${user.role}) -> Manager: ${managerName}`);
    }

    console.log('\n🎉 Hierarchy update completed successfully!');
  } catch (error) {
    console.error('❌ Error updating hierarchy:', error);
  } finally {
    await sql.end();
  }
}

updateAureliaHierarchy();
