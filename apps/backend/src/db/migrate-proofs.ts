const { drizzle: drizzleMigrateProofs } = require('drizzle-orm/postgres-js');
const pgMigrateProofsLib = require('postgres');

async function migrateExistingProofs() {
  const connectionString =
    process.env.DATABASE_URL ||
    'postgresql://postgres:postgres@localhost:5432/htf_sunup_db';

  console.log('🔗 Connecting to database...');
  const isLocalDatabase =
    connectionString.includes('localhost') ||
    connectionString.includes('127.0.0.1');
  const sql = pgMigrateProofsLib(connectionString, {
    max: 1,
    ssl: isLocalDatabase ? false : 'require',
  });

  try {
    console.log('🔄 Starting migration of existing proofs...');

    // 1. Migrer les preuves de user_actions
    console.log('📤 Migrating user_actions proofs...');
    const userActionsWithProofs = await sql`
      SELECT id, proof_url 
      FROM user_actions 
      WHERE proof_url IS NOT NULL AND proof_url != ''
    `;

    console.log(
      `Found ${userActionsWithProofs.length} user actions with proofs`,
    );

    for (const userAction of userActionsWithProofs) {
      const proofUrl = userAction.proof_url;

      // Extraire les métadonnées du fichier depuis l'URL
      const fileName = proofUrl.split('/').pop() || 'unknown';
      const fileExtension = fileName.split('.').pop()?.toLowerCase() || '';

      // Déterminer le type de fichier
      const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
      const videoExtensions = ['mp4', 'mov', 'avi', 'webm'];
      const type = imageExtensions.includes(fileExtension)
        ? 'image'
        : videoExtensions.includes(fileExtension)
          ? 'video'
          : 'image';

      // Déterminer le MIME type
      const mimeTypeMap: Record<string, string> = {
        jpg: 'image/jpeg',
        jpeg: 'image/jpeg',
        png: 'image/png',
        gif: 'image/gif',
        webp: 'image/webp',
        mp4: 'video/mp4',
        mov: 'video/quicktime',
        avi: 'video/x-msvideo',
        webm: 'video/webm',
      };
      const mimeType = mimeTypeMap[fileExtension] || 'application/octet-stream';

      // Vérifier si la preuve n'existe pas déjà
      const existingProof = await sql`
        SELECT id FROM proofs 
        WHERE user_action_id = ${userAction.id} AND url = ${proofUrl}
      `;

      if (existingProof.length === 0) {
        await sql`
          INSERT INTO proofs (
            url, type, original_name, size, mime_type, user_action_id, created_at, updated_at
          ) VALUES (
            ${proofUrl}, 
            ${type}, 
            ${fileName}, 
            ${0}, -- Taille inconnue pour les preuves existantes
            ${mimeType}, 
            ${userAction.id}, 
            NOW(), 
            NOW()
          )
        `;
        console.log(
          `✅ Migrated proof for user_action ${userAction.id}: ${fileName}`,
        );
      } else {
        console.log(`⏭️ Proof already exists for user_action ${userAction.id}`);
      }
    }

    // 2. Migrer les preuves de daily_bonus
    console.log('📤 Migrating daily_bonus proofs...');
    const dailyBonusWithProofs = await sql`
      SELECT id, proof_url 
      FROM daily_bonus 
      WHERE proof_url IS NOT NULL AND proof_url != ''
    `;

    console.log(
      `Found ${dailyBonusWithProofs.length} daily bonuses with proofs`,
    );

    for (const dailyBonus of dailyBonusWithProofs) {
      const proofUrl = dailyBonus.proof_url;

      // Extraire les métadonnées du fichier depuis l'URL
      const fileName = proofUrl.split('/').pop() || 'unknown';
      const fileExtension = fileName.split('.').pop()?.toLowerCase() || '';

      // Déterminer le type de fichier
      const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
      const videoExtensions = ['mp4', 'mov', 'avi', 'webm'];
      const type = imageExtensions.includes(fileExtension)
        ? 'image'
        : videoExtensions.includes(fileExtension)
          ? 'video'
          : 'image';

      // Déterminer le MIME type
      const mimeTypeMap: Record<string, string> = {
        jpg: 'image/jpeg',
        jpeg: 'image/jpeg',
        png: 'image/png',
        gif: 'image/gif',
        webp: 'image/webp',
        mp4: 'video/mp4',
        mov: 'video/quicktime',
        avi: 'video/x-msvideo',
        webm: 'video/webm',
      };
      const mimeType = mimeTypeMap[fileExtension] || 'application/octet-stream';

      // Vérifier si la preuve n'existe pas déjà
      const existingProof = await sql`
        SELECT id FROM proofs 
        WHERE daily_bonus_id = ${dailyBonus.id} AND url = ${proofUrl}
      `;

      if (existingProof.length === 0) {
        await sql`
          INSERT INTO proofs (
            url, type, original_name, size, mime_type, daily_bonus_id, created_at, updated_at
          ) VALUES (
            ${proofUrl}, 
            ${type}, 
            ${fileName}, 
            ${0}, -- Taille inconnue pour les preuves existantes
            ${mimeType}, 
            ${dailyBonus.id}, 
            NOW(), 
            NOW()
          )
        `;
        console.log(
          `✅ Migrated proof for daily_bonus ${dailyBonus.id}: ${fileName}`,
        );
      } else {
        console.log(`⏭️ Proof already exists for daily_bonus ${dailyBonus.id}`);
      }
    }

    // 3. Afficher un résumé
    const totalProofs = await sql`SELECT COUNT(*) as count FROM proofs`;
    const userActionProofs =
      await sql`SELECT COUNT(*) as count FROM proofs WHERE user_action_id IS NOT NULL`;
    const dailyBonusProofs =
      await sql`SELECT COUNT(*) as count FROM proofs WHERE daily_bonus_id IS NOT NULL`;

    console.log('\n📊 Migration Summary:');
    console.log(`📸 Total proofs migrated: ${totalProofs[0].count}`);
    console.log(`🎯 User action proofs: ${userActionProofs[0].count}`);
    console.log(`💰 Daily bonus proofs: ${dailyBonusProofs[0].count}`);

    console.log('\n🎉 Proof migration completed successfully!');
    console.log(
      '\n⚠️  Note: Original proofUrl columns are kept for backward compatibility.',
    );
    console.log(
      '    They can be removed in a future migration once the new system is stable.',
    );
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  } finally {
    await sql.end();
  }
}

// Execute only if run directly
if (require.main === module) {
  migrateExistingProofs();
}

module.exports = { migrateExistingProofs };
