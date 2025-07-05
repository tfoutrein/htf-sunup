const { drizzle } = require('drizzle-orm/postgres-js');
const postgres = require('postgres');
const { users } = require('./schema');
const { eq, and } = require('drizzle-orm');

async function checkAureliaProductionData() {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    console.error('❌ DATABASE_URL not found');
    console.log(
      '💡 Set DATABASE_URL environment variable to production database',
    );
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

  const sql = postgres(connectionString, {
    max: 1,
    ssl: isLocalDatabase ? false : 'require',
  });

  const db = drizzle(sql);

  try {
    console.log('🔍 Checking Aurélia data in production...');
    console.log('='.repeat(60));

    // 1. Rechercher Aurélia par email
    const aureliaByEmail = await db
      .select()
      .from(users)
      .where(eq(users.email, 'aurelia@example.com'));

    if (aureliaByEmail.length === 0) {
      console.log('❌ Aurélia not found with email: aurelia@example.com');

      // Chercher par nom contenant "aurelia"
      console.log('🔍 Searching for users with name containing "aurelia"...');
      const aureliaByName = await db
        .select()
        .from(users)
        .where(eq(users.name, 'Aurélia'));

      if (aureliaByName.length > 0) {
        console.log('✅ Found Aurélia by name:', aureliaByName[0]);
      } else {
        console.log('❌ No user found with name containing "aurelia"');
      }
    } else {
      const aurelia = aureliaByEmail[0];
      console.log('✅ Found Aurélia:');
      console.log('   ID:', aurelia.id);
      console.log('   Name:', aurelia.name);
      console.log('   Email:', aurelia.email);
      console.log('   Role:', aurelia.role);
      console.log('   Manager ID:', aurelia.managerId);
      console.log('   Created At:', aurelia.createdAt);
      console.log('   Updated At:', aurelia.updatedAt);
    }

    console.log('\n🔍 Checking role distribution...');
    console.log('-'.repeat(40));

    // 2. Vérifier la distribution des rôles
    const roleDistribution = await db
      .select({
        role: users.role,
        count: sql`count(*)::integer`,
      })
      .from(users)
      .groupBy(users.role);

    console.log('📊 Role distribution:');
    roleDistribution.forEach(({ role, count }) => {
      console.log(`   ${role}: ${count} users`);
    });

    // 3. Vérifier s'il y a encore des utilisateurs avec le rôle "marraine"
    const marraineUsers = await db
      .select()
      .from(users)
      .where(eq(users.role, 'marraine'));

    console.log('\n🔍 Checking for "marraine" role...');
    console.log('-'.repeat(40));

    if (marraineUsers.length > 0) {
      console.log('⚠️  Found users with "marraine" role:');
      marraineUsers.forEach((user) => {
        console.log(`   - ${user.name} (${user.email}) - ID: ${user.id}`);
      });
    } else {
      console.log('✅ No users found with "marraine" role');
    }

    // 4. Vérifier la hiérarchie des managers
    console.log('\n🔍 Checking manager hierarchy...');
    console.log('-'.repeat(40));

    const managers = await db
      .select()
      .from(users)
      .where(eq(users.role, 'manager'));

    console.log('👥 All managers:');
    for (const manager of managers) {
      const managerName = manager.managerId
        ? await db
            .select()
            .from(users)
            .where(eq(users.id, manager.managerId))
            .limit(1)
        : [];

      console.log(`   - ${manager.name} (ID: ${manager.id})`);
      console.log(`     Email: ${manager.email}`);
      console.log(`     Manager ID: ${manager.managerId || 'None'}`);
      if (managerName.length > 0) {
        console.log(`     Manager Name: ${managerName[0].name}`);
      }
      console.log('');
    }

    // 5. Vérifier combien d'utilisateurs ont Aurélia comme manager
    if (aureliaByEmail.length > 0) {
      const aureliaId = aureliaByEmail[0].id;

      const aureliaSubordinates = await db
        .select()
        .from(users)
        .where(eq(users.managerId, aureliaId));

      console.log(`\n🔍 Users managed by Aurélia (ID: ${aureliaId}):`);
      console.log('-'.repeat(40));

      if (aureliaSubordinates.length > 0) {
        console.log(`✅ Found ${aureliaSubordinates.length} subordinates:`);
        aureliaSubordinates.forEach((user) => {
          console.log(`   - ${user.name} (${user.email}) - Role: ${user.role}`);
        });
      } else {
        console.log('❌ No users found with Aurélia as manager');
      }
    }

    console.log('\n✅ Production data check completed successfully!');
  } catch (error) {
    console.error('❌ Error checking production data:', error);
    process.exit(1);
  } finally {
    await sql.end();
  }
}

// Exécuter la vérification
checkAureliaProductionData();
