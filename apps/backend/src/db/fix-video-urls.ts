import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { campaigns } from './schema';
import { sql, isNotNull } from 'drizzle-orm';
import * as dotenv from 'dotenv';

dotenv.config();

const connectionString = process.env.DATABASE_URL || '';

async function fixVideoUrls() {
  const client = postgres(connectionString);
  const db = drizzle(client);

  console.log('🔧 Fixing video URLs to include https:// protocol...\n');

  try {
    // Get all campaigns with video URLs
    const campaignsWithVideos = await db
      .select()
      .from(campaigns)
      .where(isNotNull(campaigns.presentationVideoUrl));

    console.log(`Found ${campaignsWithVideos.length} campaigns with videos\n`);

    let fixedCount = 0;

    for (const campaign of campaignsWithVideos) {
      const oldUrl = campaign.presentationVideoUrl;

      if (oldUrl && !oldUrl.startsWith('http')) {
        const newUrl = `https://${oldUrl}`;

        await db
          .update(campaigns)
          .set({ presentationVideoUrl: newUrl })
          .where(sql`${campaigns.id} = ${campaign.id}`);

        console.log(`✅ Fixed campaign #${campaign.id}:`);
        console.log(`   Old: ${oldUrl}`);
        console.log(`   New: ${newUrl}\n`);

        fixedCount++;
      } else if (oldUrl) {
        console.log(
          `⏭️  Skipped campaign #${campaign.id} (already has protocol)\n`,
        );
      }
    }

    console.log(`\n✨ Done! Fixed ${fixedCount} video URLs.`);
  } catch (error) {
    console.error('❌ Error fixing video URLs:', error);
    throw error;
  } finally {
    await client.end();
  }
}

fixVideoUrls()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
