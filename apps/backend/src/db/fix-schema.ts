import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

const connectionString =
  process.env.DATABASE_URL ||
  'postgresql://postgres:postgres@localhost:5432/htf_sunup_db';
const client = postgres(connectionString, { prepare: false });
const db = drizzle(client);

async function fixSchema() {
  console.log('🔧 Correction du schéma de base de données...');

  try {
    // Vérifier et ajouter les colonnes manquantes dans la table actions
    console.log('🔍 Vérification des colonnes de la table actions...');

    // Vérifier si challenge_id existe
    const challengeIdExists = await client`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'actions' AND column_name = 'challenge_id'
    `;

    if (challengeIdExists.length === 0) {
      console.log('➕ Ajout de la colonne challenge_id...');
      await client`
        ALTER TABLE actions 
        ADD COLUMN challenge_id integer
      `;
      console.log('✅ Colonne challenge_id ajoutée');
    } else {
      console.log('✅ Colonne challenge_id existe déjà');
    }

    // Vérifier si points_value existe
    const pointsValueExists = await client`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'actions' AND column_name = 'points_value'
    `;

    if (pointsValueExists.length === 0) {
      console.log('➕ Ajout de la colonne points_value...');
      await client`
        ALTER TABLE actions 
        ADD COLUMN points_value integer DEFAULT 10 NOT NULL
      `;
      console.log('✅ Colonne points_value ajoutée');
    } else {
      console.log('✅ Colonne points_value existe déjà');
    }

    // Ajouter les contraintes NOT NULL si les colonnes existent mais ne sont pas NOT NULL
    console.log('🔍 Vérification des contraintes...');

    const challengeIdNotNull = await client`
      SELECT column_name, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'actions' AND column_name = 'challenge_id'
    `;

    if (
      challengeIdNotNull.length > 0 &&
      challengeIdNotNull[0].is_nullable === 'YES'
    ) {
      console.log(
        '⚠️  La colonne challenge_id permet NULL, vérification des données...',
      );

      // Compter les enregistrements avec challenge_id NULL
      const nullCount = await client`
        SELECT COUNT(*) as count FROM actions WHERE challenge_id IS NULL
      `;

      if (parseInt(nullCount[0].count) > 0) {
        console.error(
          `❌ ${nullCount[0].count} enregistrements ont challenge_id NULL. Correction manuelle nécessaire.`,
        );
      } else {
        console.log('➕ Ajout de la contrainte NOT NULL sur challenge_id...');
        await client`
          ALTER TABLE actions 
          ALTER COLUMN challenge_id SET NOT NULL
        `;
        console.log('✅ Contrainte NOT NULL ajoutée sur challenge_id');
      }
    }

    // Vérifier et ajouter les contraintes de clé étrangère
    console.log('🔍 Vérification des contraintes de clé étrangère...');

    const fkExists = await client`
      SELECT constraint_name 
      FROM information_schema.table_constraints 
      WHERE table_name = 'actions' 
      AND constraint_name = 'actions_challenge_id_challenges_id_fk'
    `;

    if (fkExists.length === 0 && challengeIdExists.length > 0) {
      console.log('➕ Ajout de la contrainte de clé étrangère...');
      await client`
        ALTER TABLE actions 
        ADD CONSTRAINT actions_challenge_id_challenges_id_fk 
        FOREIGN KEY (challenge_id) REFERENCES challenges(id)
      `;
      console.log('✅ Contrainte de clé étrangère ajoutée');
    } else {
      console.log('✅ Contrainte de clé étrangère existe déjà');
    }

    console.log('🎉 Correction du schéma terminée avec succès !');
  } catch (error) {
    console.error('❌ Erreur lors de la correction du schéma:', error);
    throw error;
  } finally {
    await client.end();
  }
}

if (require.main === module) {
  fixSchema().catch(console.error);
}

export { fixSchema };
