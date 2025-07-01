const { drizzle: drizzleFixPasswords } = require('drizzle-orm/postgres-js');
const postgresFixPasswords = require('postgres');
const bcrypt = require('bcryptjs');

async function fixDoubleHashedPasswords() {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    console.error('❌ DATABASE_URL not found');
    process.exit(1);
  }

  const isLocalDatabase =
    connectionString.includes('localhost') ||
    connectionString.includes('127.0.0.1');

  const sql = postgresFixPasswords(connectionString, {
    max: 1,
    ssl: isLocalDatabase ? false : 'require',
  });

  try {
    console.log('🔧 Fixing double-hashed passwords for approved users...');

    // Find approved requests with users who might have double-hashed passwords
    const approvedWithUsers = await sql`
      SELECT 
        ar.id as request_id,
        ar.email,
        ar.temporary_password,
        u.id as user_id,
        u.password as current_password
      FROM access_requests ar
      INNER JOIN users u ON ar.email = u.email
      WHERE ar.status = 'approved' 
      AND ar.temporary_password IS NOT NULL
    `;

    console.log(`📊 Found ${approvedWithUsers.length} users to check`);

    let fixedCount = 0;
    let alreadyFixedCount = 0;

    for (const row of approvedWithUsers) {
      console.log(`\n🔍 Checking user: ${row.email}`);

      // Test if current password works
      const currentlyWorks = await bcrypt.compare(
        row.temporary_password,
        row.current_password,
      );

      if (currentlyWorks) {
        console.log(`  ✅ Password already works correctly - skipping`);
        alreadyFixedCount++;
        continue;
      }

      console.log(`  ❌ Password doesn't work - fixing...`);

      // Hash the temporary password correctly (single hash)
      const correctHash = await bcrypt.hash(row.temporary_password, 10);

      // Update the user's password
      await sql`
        UPDATE users 
        SET password = ${correctHash}, updated_at = NOW()
        WHERE id = ${row.user_id}
      `;

      // Verify the fix
      const fixWorks = await bcrypt.compare(
        row.temporary_password,
        correctHash,
      );

      if (fixWorks) {
        console.log(`  ✅ Password fixed successfully`);
        fixedCount++;
      } else {
        console.log(`  ❌ Fix failed - something went wrong`);
      }
    }

    console.log(
      `\n🎉 Results: ${fixedCount} fixed, ${alreadyFixedCount} already working, ${approvedWithUsers.length} total`,
    );

    if (fixedCount > 0) {
      console.log(
        '✅ Double-hashed password fix completed. Affected users can now login.',
      );
    } else if (alreadyFixedCount === approvedWithUsers.length) {
      console.log('✅ All users already have working passwords.');
    }
  } catch (error) {
    console.error('❌ Error during fix:', error);
    process.exit(1);
  } finally {
    await sql.end();
  }
}

// Run the fix if this file is executed directly
if (require.main === module) {
  fixDoubleHashedPasswords();
}
