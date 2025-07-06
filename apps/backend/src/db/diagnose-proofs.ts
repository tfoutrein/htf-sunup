const { drizzle: drizzleORM } = require('drizzle-orm/postgres-js');
const pgClientLib = require('postgres');

async function diagnoseProofsIssue() {
  const connectionString =
    process.env.DATABASE_URL ||
    'postgresql://postgres:postgres@localhost:5432/htf_sunup_db';

  console.log('🔗 Connecting to database...');
  const isLocalDatabase =
    connectionString.includes('localhost') ||
    connectionString.includes('127.0.0.1');
  const sql = pgClientLib(connectionString, {
    max: 1,
    ssl: isLocalDatabase ? false : 'require',
  });

  try {
    console.log('🔍 Starting diagnosis of proofs issue...\n');

    // 1. Vérifier l'existence de la table proofs
    console.log('📋 Checking if proofs table exists...');
    const proofsTableExists = await sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'proofs'
      ) as exists
    `;
    console.log(`✅ Proofs table exists: ${proofsTableExists[0].exists}\n`);

    if (!proofsTableExists[0].exists) {
      console.log('❌ Proofs table does not exist! Need to run migrations.');
      return;
    }

    // 2. Vérifier la structure de la table proofs
    console.log('🏗️ Checking proofs table structure...');
    const proofsStructure = await sql`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'proofs' 
      ORDER BY ordinal_position
    `;
    console.log('📊 Proofs table columns:');
    proofsStructure.forEach((col) => {
      console.log(
        `  - ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`,
      );
    });
    console.log('');

    // 3. Vérifier les contraintes de clé étrangère
    console.log('🔗 Checking foreign key constraints...');
    const foreignKeys = await sql`
      SELECT 
        tc.table_name, 
        kcu.column_name, 
        ccu.table_name AS foreign_table_name,
        ccu.column_name AS foreign_column_name 
      FROM 
        information_schema.table_constraints AS tc 
        JOIN information_schema.key_column_usage AS kcu
          ON tc.constraint_name = kcu.constraint_name
          AND tc.table_schema = kcu.table_schema
        JOIN information_schema.constraint_column_usage AS ccu
          ON ccu.constraint_name = tc.constraint_name
      WHERE tc.constraint_type = 'FOREIGN KEY' 
        AND tc.table_name = 'proofs'
    `;
    console.log('🔗 Foreign key constraints:');
    foreignKeys.forEach((fk) => {
      console.log(
        `  - ${fk.column_name} -> ${fk.foreign_table_name}.${fk.foreign_column_name}`,
      );
    });
    console.log('');

    // 4. Vérifier l'user_action_id 24 spécifiquement
    console.log('🎯 Checking user_action_id 24...');
    const userAction24 = await sql`
      SELECT id, user_id, action_id, challenge_id, completed, created_at
      FROM user_actions 
      WHERE id = 24
    `;

    if (userAction24.length === 0) {
      console.log('❌ UserAction with ID 24 does not exist!');
    } else {
      console.log('✅ UserAction 24 exists:');
      console.log(`  - ID: ${userAction24[0].id}`);
      console.log(`  - User ID: ${userAction24[0].user_id}`);
      console.log(`  - Action ID: ${userAction24[0].action_id}`);
      console.log(`  - Challenge ID: ${userAction24[0].challenge_id}`);
      console.log(`  - Completed: ${userAction24[0].completed}`);
      console.log(`  - Created: ${userAction24[0].created_at}`);
    }
    console.log('');

    // 5. Vérifier les preuves existantes pour user_action_id 24
    console.log('📸 Checking existing proofs for user_action_id 24...');
    const proofsFor24 = await sql`
      SELECT id, url, type, original_name, created_at
      FROM proofs 
      WHERE user_action_id = 24
      ORDER BY created_at
    `;

    console.log(`📊 Found ${proofsFor24.length} proofs for user_action_id 24:`);
    proofsFor24.forEach((proof, index) => {
      console.log(
        `  ${index + 1}. ID: ${proof.id}, Type: ${proof.type}, Name: ${proof.original_name}`,
      );
    });
    console.log('');

    // 6. Test de la requête qui pose problème
    console.log('🧪 Testing the problematic count query...');
    try {
      const countResult = await sql`
        SELECT COUNT(*) as count FROM proofs WHERE user_action_id = 24
      `;
      console.log(`✅ Count query successful: ${countResult[0].count} proofs`);
    } catch (error) {
      console.log('❌ Count query failed:');
      console.log(`   Error: ${error.message}`);
      console.log(`   Detail: ${error.detail || 'No additional details'}`);
    }
    console.log('');

    // 7. Vérifier les statistiques générales
    console.log('📈 General statistics...');
    const totalProofs = await sql`SELECT COUNT(*) as count FROM proofs`;
    const totalUserActions =
      await sql`SELECT COUNT(*) as count FROM user_actions`;
    const proofsWithUserActions = await sql`
      SELECT COUNT(*) as count FROM proofs WHERE user_action_id IS NOT NULL
    `;
    const proofsWithDailyBonus = await sql`
      SELECT COUNT(*) as count FROM proofs WHERE daily_bonus_id IS NOT NULL
    `;

    console.log(`📊 Total proofs: ${totalProofs[0].count}`);
    console.log(`🎯 Total user actions: ${totalUserActions[0].count}`);
    console.log(
      `📸 Proofs linked to user actions: ${proofsWithUserActions[0].count}`,
    );
    console.log(
      `💰 Proofs linked to daily bonus: ${proofsWithDailyBonus[0].count}`,
    );
    console.log('');

    // 8. Chercher des orphelins potentiels
    console.log('🔍 Checking for orphaned proofs...');
    const orphanedProofs = await sql`
      SELECT p.id, p.user_action_id, p.daily_bonus_id, p.url
      FROM proofs p
      LEFT JOIN user_actions ua ON p.user_action_id = ua.id
      LEFT JOIN daily_bonus db ON p.daily_bonus_id = db.id
      WHERE (p.user_action_id IS NOT NULL AND ua.id IS NULL)
         OR (p.daily_bonus_id IS NOT NULL AND db.id IS NULL)
    `;

    if (orphanedProofs.length > 0) {
      console.log(`⚠️ Found ${orphanedProofs.length} orphaned proofs:`);
      orphanedProofs.forEach((proof) => {
        console.log(
          `  - Proof ID: ${proof.id}, UserAction: ${proof.user_action_id}, DailyBonus: ${proof.daily_bonus_id}`,
        );
      });
    } else {
      console.log('✅ No orphaned proofs found');
    }

    console.log('\n🎉 Diagnosis completed successfully!');
  } catch (error) {
    console.error('❌ Diagnosis failed:', error.message);
    console.error('Stack trace:', error.stack);
  } finally {
    await sql.end();
  }
}

// Execute only if run directly
if (require.main === module) {
  diagnoseProofsIssue();
}

module.exports = { diagnoseProofsIssue };
