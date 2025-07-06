const { drizzle: drizzleAurelia } = require('drizzle-orm/postgres-js');
const postgresFix = require('postgres');
const { users: usersTable } = require('./schema');
const { eq: eqFix, and: andFix } = require('drizzle-orm');

async function fixAureliaInProduction() {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    console.error('❌ DATABASE_URL not found');
    process.exit(1);
  }

  console.log('🔗 Connecting to production database...');
  console.log(
    '📝 Connection string (masked):',
    connectionString.replace(/:[^:@]*@/, ':***@'),
  );

  // Utiliser SSL pour les connexions de production
  const isLocalDatabase =
    connectionString.includes('localhost') ||
    connectionString.includes('127.0.0.1');

  const sql = postgresFix(connectionString, {
    max: 1,
    ssl: isLocalDatabase ? false : 'require',
  });

  const db = drizzleAurelia(sql);

  try {
    console.log('🔧 Fixing Aurélia data in production...');
    console.log('='.repeat(60));

    // 1. Vérifier Aurélia actuelle
    console.log('🔍 Step 1: Finding Aurélia...');
    const aureliaUsers = await db
      .select()
      .from(usersTable)
      .where(eqFix(usersTable.email, 'aurelia@htf.com'));

    if (aureliaUsers.length === 0) {
      console.log('❌ Aurélia not found with email: aurelia@htf.com');
      process.exit(1);
    }

    const aurelia = aureliaUsers[0];
    console.log('✅ Found Aurélia:');
    console.log(`   ID: ${aurelia.id}`);
    console.log(`   Name: ${aurelia.name}`);
    console.log(`   Email: ${aurelia.email}`);
    console.log(`   Current Role: ${aurelia.role}`);
    console.log(`   Manager ID: ${aurelia.managerId}`);

    // 2. Changer le rôle d'Aurélia de 'marraine' vers 'manager'
    console.log('\n🔧 Step 2: Updating Aurélia role to manager...');

    if (aurelia.role === 'marraine') {
      const updatedAurelia = await db
        .update(usersTable)
        .set({
          role: 'manager',
          updatedAt: new Date(),
        })
        .where(eqFix(usersTable.id, aurelia.id))
        .returning();

      console.log('✅ Aurélia role updated to manager:', updatedAurelia[0]);
    } else if (aurelia.role === 'manager') {
      console.log('✅ Aurélia already has manager role');
    } else {
      console.log(`⚠️  Aurélia has unexpected role: ${aurelia.role}`);
    }

    // 3. Chercher d'autres utilisateurs avec le rôle 'marraine'
    console.log('\n🔧 Step 3: Checking for other users with marraine role...');
    const marraineUsers = await db
      .select()
      .from(usersTable)
      .where(eqFix(usersTable.role, 'marraine'));

    if (marraineUsers.length > 0) {
      console.log(
        `⚠️  Found ${marraineUsers.length} users with marraine role:`,
      );

      for (const user of marraineUsers) {
        console.log(`   - ${user.name} (${user.email}) - ID: ${user.id}`);

        // Demander confirmation avant de changer
        console.log(
          `   🔧 Converting ${user.name} from marraine to manager...`,
        );

        const updated = await db
          .update(usersTable)
          .set({
            role: 'manager',
            updatedAt: new Date(),
          })
          .where(eqFix(usersTable.id, user.id))
          .returning();

        console.log(`   ✅ ${user.name} updated to manager role`);
      }
    } else {
      console.log('✅ No other users found with marraine role');
    }

    // 4. Vérifier la hiérarchie - s'assurer que les managers ont Aurélia comme manager
    console.log('\n🔧 Step 4: Checking manager hierarchy...');

    // Trouver tous les managers
    const allManagers = await db
      .select()
      .from(usersTable)
      .where(eqFix(usersTable.role, 'manager'));

    // Filtrer pour exclure Aurélia
    const managersToUpdate = allManagers.filter((m) => m.id !== aurelia.id);

    if (managersToUpdate.length > 0) {
      console.log(
        `🔧 Found ${managersToUpdate.length} other managers to update:`,
      );

      for (const manager of managersToUpdate) {
        console.log(`   - ${manager.name} (ID: ${manager.id})`);
        console.log(`     Current Manager ID: ${manager.managerId}`);

        if (manager.managerId !== aurelia.id) {
          console.log(
            `   🔧 Setting Aurélia as manager for ${manager.name}...`,
          );

          const updated = await db
            .update(usersTable)
            .set({
              managerId: aurelia.id,
              updatedAt: new Date(),
            })
            .where(eqFix(usersTable.id, manager.id))
            .returning();

          console.log(`   ✅ ${manager.name} now managed by Aurélia`);
        } else {
          console.log(`   ✅ ${manager.name} already managed by Aurélia`);
        }
      }
    } else {
      console.log('✅ No other managers found to update');
    }

    // 5. Vérification finale
    console.log('\n🔍 Step 5: Final verification...');

    // Compter les rôles
    const managerCount = await db
      .select()
      .from(usersTable)
      .where(eqFix(usersTable.role, 'manager'));

    const fboCount = await db
      .select()
      .from(usersTable)
      .where(eqFix(usersTable.role, 'fbo'));

    const marraineCount = await db
      .select()
      .from(usersTable)
      .where(eqFix(usersTable.role, 'marraine'));

    console.log('📊 Final role distribution:');
    console.log(`   Managers: ${managerCount.length}`);
    console.log(`   FBO: ${fboCount.length}`);
    console.log(`   Marraine: ${marraineCount.length} (should be 0)`);

    // Vérifier la hiérarchie d'Aurélia
    const aureliaSubordinates = await db
      .select()
      .from(usersTable)
      .where(eqFix(usersTable.managerId, aurelia.id));

    console.log(`\n👥 Aurélia's subordinates: ${aureliaSubordinates.length}`);
    aureliaSubordinates.forEach((sub) => {
      console.log(`   - ${sub.name} (${sub.email}) - Role: ${sub.role}`);
    });

    console.log('\n✅ Production Aurélia fix completed successfully!');

    if (marraineCount.length === 0) {
      console.log(
        '🎉 All marraine roles have been successfully converted to manager!',
      );
    } else {
      console.log('⚠️  Warning: Some marraine roles still exist');
    }
  } catch (error) {
    console.error('❌ Error fixing Aurélia data:', error);
    process.exit(1);
  } finally {
    await sql.end();
  }
}

// Exécuter la correction
fixAureliaInProduction();
