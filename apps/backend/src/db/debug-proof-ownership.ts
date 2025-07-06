import { drizzle } from 'drizzle-orm/postgres-js';
const postgres = require('postgres');
import { eq } from 'drizzle-orm';
import { users, proofs, userActions, dailyBonus } from './schema';

const connectionString =
  process.env.DATABASE_URL ||
  'postgresql://postgres:postgres@localhost:5432/htf_sunup_db';

async function debugProofOwnership() {
  const sql = postgres(connectionString);
  const db = drizzle(sql);

  console.log('🔍 Debug Proof Ownership - Starting...');

  try {
    // 1. Vérifier les utilisateurs et leurs relations
    console.log('\n📊 1. Users and their relationships:');
    const allUsers = await db.select().from(users);

    for (const user of allUsers) {
      const manager = user.managerId
        ? allUsers.find((u) => u.id === user.managerId)
        : null;

      console.log(`👤 ${user.name} (ID: ${user.id}, Role: ${user.role})`);
      console.log(`   Email: ${user.email}`);
      console.log(
        `   Manager: ${manager ? `${manager.name} (ID: ${manager.id})` : 'None'}`,
      );
      console.log('');
    }

    // 2. Vérifier les preuves existantes
    console.log('\n📸 2. Existing proofs:');
    const allProofs = await db.select().from(proofs);

    for (const proof of allProofs) {
      console.log(`🖼️  Proof ID: ${proof.id}`);
      console.log(`   URL: ${proof.url}`);
      console.log(`   Type: ${proof.type}`);
      console.log(`   UserAction ID: ${proof.userActionId || 'None'}`);
      console.log(`   DailyBonus ID: ${proof.dailyBonusId || 'None'}`);
      console.log('');
    }

    // 3. Focus sur la preuve problématique (ID 27)
    console.log('\n🎯 3. Focus on Proof ID 27:');
    const specificProof = await db
      .select()
      .from(proofs)
      .where(eq(proofs.id, 27))
      .limit(1);

    if (specificProof.length > 0) {
      const proof = specificProof[0];
      console.log(`📄 Proof 27 details:`, proof);

      if (proof.userActionId) {
        console.log('\n🔍 Checking UserAction relationship:');
        const userActionResult = await db
          .select({
            userAction: userActions,
            owner: users,
          })
          .from(userActions)
          .leftJoin(users, eq(userActions.userId, users.id))
          .where(eq(userActions.id, proof.userActionId))
          .limit(1);

        if (userActionResult.length > 0) {
          const actionData = userActionResult[0];
          console.log(
            `   UserAction Owner: ${actionData.owner?.name} (ID: ${actionData.userAction.userId})`,
          );
          console.log(
            `   Owner Manager: ${actionData.owner?.managerId || 'None'}`,
          );

          // Trouver le nom du manager
          if (actionData.owner?.managerId) {
            const manager = allUsers.find(
              (u) => u.id === actionData.owner.managerId,
            );
            console.log(
              `   Manager Name: ${manager?.name || 'Unknown'} (ID: ${actionData.owner.managerId})`,
            );
          }
        } else {
          console.log(`   ❌ No UserAction found for ID ${proof.userActionId}`);
        }
      }

      if (proof.dailyBonusId) {
        console.log('\n🔍 Checking DailyBonus relationship:');
        const bonusResult = await db
          .select({
            bonus: dailyBonus,
            owner: users,
          })
          .from(dailyBonus)
          .leftJoin(users, eq(dailyBonus.userId, users.id))
          .where(eq(dailyBonus.id, proof.dailyBonusId))
          .limit(1);

        if (bonusResult.length > 0) {
          const bonusData = bonusResult[0];
          console.log(
            `   DailyBonus Owner: ${bonusData.owner?.name} (ID: ${bonusData.bonus.userId})`,
          );
          console.log(
            `   Owner Manager: ${bonusData.owner?.managerId || 'None'}`,
          );

          // Trouver le nom du manager
          if (bonusData.owner?.managerId) {
            const manager = allUsers.find(
              (u) => u.id === bonusData.owner.managerId,
            );
            console.log(
              `   Manager Name: ${manager?.name || 'Unknown'} (ID: ${bonusData.owner.managerId})`,
            );
          }
        } else {
          console.log(`   ❌ No DailyBonus found for ID ${proof.dailyBonusId}`);
        }
      }
    } else {
      console.log('❌ Proof ID 27 not found');
    }

    // 4. Vérifier spécifiquement les managers
    console.log('\n👔 4. Managers and their FBOs:');
    const managers = allUsers.filter((u) => u.role === 'manager');

    for (const manager of managers) {
      const fbos = allUsers.filter((u) => u.managerId === manager.id);
      console.log(`👔 Manager: ${manager.name} (ID: ${manager.id})`);
      console.log(`   FBOs: ${fbos.length}`);
      for (const fbo of fbos) {
        console.log(`     - ${fbo.name} (ID: ${fbo.id})`);
      }
      console.log('');
    }

    console.log('✅ Debug completed successfully!');
  } catch (error) {
    console.error('❌ Debug failed:', error);
  } finally {
    await sql.end();
  }
}

// Exporter pour pouvoir l'utiliser
export { debugProofOwnership };

// Permettre l'exécution directe
if (require.main === module) {
  debugProofOwnership();
}
