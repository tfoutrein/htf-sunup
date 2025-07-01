// Test de calcul des gains pour la campagne
const postgres = require('postgres');

const sql = postgres(
  process.env.DATABASE_URL ||
    'postgresql://postgres:postgres@localhost:5432/htf_sunup_db',
);

async function testEarningsCalculation() {
  try {
    console.log('🧪 Test de calcul des gains de campagne...');

    // Créer des défis de test avec des valeurs différentes
    const [challenge1] = await sql`
      INSERT INTO challenges (campaign_id, date, title, description, value_in_euro)
      VALUES (3, '2025-07-09', 'Test défi 1', 'Premier défi test', '1.00')
      RETURNING *
    `;

    const [challenge2] = await sql`
      INSERT INTO challenges (campaign_id, date, title, description, value_in_euro)
      VALUES (3, '2025-07-10', 'Test défi 2', 'Deuxième défi test', '0.75')
      RETURNING *
    `;

    console.log('✅ Défis créés:');
    console.log('   Défi 1: 1.00€, ID:', challenge1.id);
    console.log('   Défi 2: 0.75€, ID:', challenge2.id);

    // Créer des actions pour chaque défi
    const [action1] = await sql`
      INSERT INTO actions (challenge_id, title, description, type, "order")
      VALUES (${challenge1.id}, 'Action défi 1', 'Action test', 'vente', 1)
      RETURNING *
    `;

    const [action2] = await sql`
      INSERT INTO actions (challenge_id, title, description, type, "order")
      VALUES (${challenge2.id}, 'Action défi 2', 'Action test', 'recrutement', 1)
      RETURNING *
    `;

    console.log('✅ Actions créées');

    // Créer un utilisateur FBO de test
    const [testUser] = await sql`
      INSERT INTO users (name, email, password, role)
      VALUES ('Test FBO', 'test.fbo@test.com', 'hashedpassword', 'fbo')
      RETURNING *
    `;

    // Simuler la complétion du premier défi seulement
    const [userAction1] = await sql`
      INSERT INTO user_actions (user_id, action_id, challenge_id, completed, completed_at)
      VALUES (${testUser.id}, ${action1.id}, ${challenge1.id}, true, NOW())
      RETURNING *
    `;

    console.log('✅ Premier défi marqué comme complété');

    // Calculer les gains avec la requête réelle
    const campaignStats = await sql`
      SELECT 
        c.id as challenge_id,
        c.title as challenge_title,
        c.value_in_euro,
        COALESCE(
          (SELECT COUNT(*) 
           FROM actions a 
           WHERE a.challenge_id = c.id), 0
        ) as total_actions,
        COALESCE(
          (SELECT COUNT(*) 
           FROM user_actions ua 
           JOIN actions a ON ua.action_id = a.id 
           WHERE ua.challenge_id = c.id AND ua.user_id = ${testUser.id} AND ua.completed = true), 0
        ) as completed_actions
      FROM challenges c 
      WHERE c.campaign_id = 3 AND c.id IN (${challenge1.id}, ${challenge2.id})
      ORDER BY c.date
    `;

    let totalEarned = 0;
    let totalPossible = 0;

    console.log('\n📊 Calcul des gains:');
    for (const stat of campaignStats) {
      const isCompleted =
        stat.total_actions > 0 && stat.completed_actions === stat.total_actions;
      const earned = isCompleted ? parseFloat(stat.value_in_euro) : 0;

      console.log(`   ${stat.challenge_title}:`);
      console.log(
        `     Actions: ${stat.completed_actions}/${stat.total_actions}`,
      );
      console.log(`     Complété: ${isCompleted ? 'OUI' : 'NON'}`);
      console.log(`     Valeur: ${stat.value_in_euro}€`);
      console.log(`     Gagné: ${earned.toFixed(2)}€`);

      totalEarned += earned;
      totalPossible += parseFloat(stat.value_in_euro);
    }

    console.log(`\n💰 RÉSULTATS FINAUX:`);
    console.log(`   Total gagné: ${totalEarned.toFixed(2)}€`);
    console.log(`   Total possible: ${totalPossible.toFixed(2)}€`);
    console.log(
      `   Pourcentage: ${((totalEarned / totalPossible) * 100).toFixed(1)}%`,
    );

    // Nettoyage
    await sql`DELETE FROM user_actions WHERE id = ${userAction1.id}`;
    await sql`DELETE FROM actions WHERE id IN (${action1.id}, ${action2.id})`;
    await sql`DELETE FROM challenges WHERE id IN (${challenge1.id}, ${challenge2.id})`;
    await sql`DELETE FROM users WHERE id = ${testUser.id}`;

    console.log('\n🎉 Test terminé avec succès - nettoyage effectué');
    console.log(
      '   ✅ Le FBO devrait voir "1.00 € sur 1.75 € possible" dans son header',
    );
  } catch (error) {
    console.error('❌ Erreur lors du test:', error);
  } finally {
    await sql.end();
  }
}

testEarningsCalculation();
