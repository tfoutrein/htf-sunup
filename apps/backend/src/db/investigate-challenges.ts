import { drizzle } from 'drizzle-orm/postgres-js';
const postgres = require('postgres');
import { campaigns, challenges, actions, users } from './schema';
import { eq, gte, lte, and } from 'drizzle-orm';

const connectionString =
  process.env.DATABASE_URL ||
  'postgresql://postgres:postgres@localhost:5432/htf_sunup_db';

async function investigateChallenges() {
  const sql = postgres(connectionString);
  const db = drizzle(sql);

  console.log('🔍 HTF SunUp Challenge Investigation');
  console.log('=====================================');

  try {
    // Get current date in YYYY-MM-DD format
    const today = new Date().toISOString().split('T')[0];
    console.log(`📅 Current Date: ${today}`);
    console.log('');

    // 1. Get all campaigns with their details
    console.log('📊 ALL CAMPAIGNS:');
    console.log('-'.repeat(60));

    const allCampaigns = await db
      .select({
        id: campaigns.id,
        name: campaigns.name,
        description: campaigns.description,
        startDate: campaigns.startDate,
        endDate: campaigns.endDate,
        status: campaigns.status,
        archived: campaigns.archived,
        createdBy: campaigns.createdBy,
      })
      .from(campaigns);

    if (allCampaigns.length === 0) {
      console.log('❌ NO CAMPAIGNS FOUND IN DATABASE');
    } else {
      allCampaigns.forEach((campaign, index) => {
        const isDateInRange =
          today >= campaign.startDate! && today <= campaign.endDate!;
        const isActive = campaign.status === 'active' && !campaign.archived;
        const shouldShowToday = isDateInRange && isActive;

        console.log(`${index + 1}. Campaign: "${campaign.name}"`);
        console.log(`   ID: ${campaign.id}`);
        console.log(
          `   Description: ${campaign.description || 'No description'}`,
        );
        console.log(
          `   Date Range: ${campaign.startDate} → ${campaign.endDate}`,
        );
        console.log(`   Status: ${campaign.status}`);
        console.log(`   Archived: ${campaign.archived}`);
        console.log(`   Created By User ID: ${campaign.createdBy}`);
        console.log(
          `   📍 Date Range Check: ${isDateInRange ? '✅ Today is in range' : '❌ Today is NOT in range'}`,
        );
        console.log(
          `   📍 Active Status: ${isActive ? '✅ Active & not archived' : '❌ Not active or archived'}`,
        );
        console.log(
          `   📍 Should Show Today: ${shouldShowToday ? '✅ YES' : '❌ NO'}`,
        );
        console.log('');
      });
    }

    // 2. Get challenges for today specifically
    console.log('🎯 CHALLENGES FOR TODAY:');
    console.log('-'.repeat(60));

    const todaysChallenges = await db
      .select({
        challengeId: challenges.id,
        challengeTitle: challenges.title,
        challengeDescription: challenges.description,
        challengeDate: challenges.date,
        campaignId: challenges.campaignId,
        campaignName: campaigns.name,
        campaignStatus: campaigns.status,
        campaignArchived: campaigns.archived,
        campaignStartDate: campaigns.startDate,
        campaignEndDate: campaigns.endDate,
      })
      .from(challenges)
      .leftJoin(campaigns, eq(challenges.campaignId, campaigns.id))
      .where(eq(challenges.date, today));

    if (todaysChallenges.length === 0) {
      console.log('❌ NO CHALLENGES FOUND FOR TODAY');
    } else {
      for (let index = 0; index < todaysChallenges.length; index++) {
        const challenge = todaysChallenges[index];
        const campaignIsActive =
          challenge.campaignStatus === 'active' && !challenge.campaignArchived;
        const campaignDateValid =
          today >= challenge.campaignStartDate! &&
          today <= challenge.campaignEndDate!;

        console.log(`${index + 1}. Challenge: "${challenge.challengeTitle}"`);
        console.log(`   Challenge ID: ${challenge.challengeId}`);
        console.log(`   Challenge Date: ${challenge.challengeDate}`);
        console.log(
          `   Description: ${challenge.challengeDescription || 'No description'}`,
        );
        console.log(
          `   ↳ Campaign: "${challenge.campaignName}" (ID: ${challenge.campaignId})`,
        );
        console.log(`   ↳ Campaign Status: ${challenge.campaignStatus}`);
        console.log(`   ↳ Campaign Archived: ${challenge.campaignArchived}`);
        console.log(
          `   ↳ Campaign Date Range: ${challenge.campaignStartDate} → ${challenge.campaignEndDate}`,
        );
        console.log(
          `   📍 Campaign Active: ${campaignIsActive ? '✅ YES' : '❌ NO'}`,
        );
        console.log(
          `   📍 Campaign Date Valid: ${campaignDateValid ? '✅ YES' : '❌ NO'}`,
        );
        console.log(
          `   📍 Should Be Visible: ${campaignIsActive && campaignDateValid ? '✅ YES' : '❌ NO'}`,
        );

        // Get actions for this challenge
        const actionsForChallenge = await db
          .select({
            id: actions.id,
            title: actions.title,
            type: actions.type,
            order: actions.order,
          })
          .from(actions)
          .where(eq(actions.challengeId, challenge.challengeId!));

        if (actionsForChallenge.length > 0) {
          console.log(`   📋 Actions (${actionsForChallenge.length}):`);
          actionsForChallenge.forEach((action) => {
            console.log(
              `      ${action.order}. ${action.title} (${action.type})`,
            );
          });
        }
        console.log('');
      }
    }

    // 3. Get all challenges (not just today's)
    console.log('📋 ALL CHALLENGES:');
    console.log('-'.repeat(60));

    const allChallenges = await db
      .select({
        challengeId: challenges.id,
        challengeTitle: challenges.title,
        challengeDate: challenges.date,
        campaignId: challenges.campaignId,
        campaignName: campaigns.name,
        campaignStatus: campaigns.status,
        campaignArchived: campaigns.archived,
      })
      .from(challenges)
      .leftJoin(campaigns, eq(challenges.campaignId, campaigns.id));

    if (allChallenges.length === 0) {
      console.log('❌ NO CHALLENGES FOUND IN DATABASE');
    } else {
      allChallenges.forEach((challenge, index) => {
        const isToday = challenge.challengeDate === today;
        console.log(
          `${index + 1}. "${challenge.challengeTitle}" (${challenge.challengeDate}) ${isToday ? '👈 TODAY' : ''}`,
        );
        console.log(`   Challenge ID: ${challenge.challengeId}`);
        console.log(
          `   Campaign: "${challenge.campaignName}" (ID: ${challenge.campaignId})`,
        );
        console.log(
          `   Campaign Status: ${challenge.campaignStatus} (Archived: ${challenge.campaignArchived})`,
        );
        console.log('');
      });
    }

    // 4. Look for potential issues
    console.log('🚨 POTENTIAL ISSUES ANALYSIS:');
    console.log('-'.repeat(60));

    const issues: string[] = [];

    // Check for orphaned challenges (challenges without valid campaigns)
    const orphanedChallenges = todaysChallenges.filter(
      (c) =>
        !c.campaignName || c.campaignStatus !== 'active' || c.campaignArchived,
    );

    if (orphanedChallenges.length > 0) {
      issues.push(
        `🔴 Found ${orphanedChallenges.length} challenge(s) for today linked to inactive/archived campaigns`,
      );
      orphanedChallenges.forEach((c) => {
        issues.push(
          `   - Challenge "${c.challengeTitle}" linked to campaign "${c.campaignName}" (status: ${c.campaignStatus}, archived: ${c.campaignArchived})`,
        );
      });
    }

    // Check for challenges outside campaign date ranges
    const challengesOutsideRange = todaysChallenges.filter(
      (c) => today < c.campaignStartDate! || today > c.campaignEndDate!,
    );

    if (challengesOutsideRange.length > 0) {
      issues.push(
        `🔴 Found ${challengesOutsideRange.length} challenge(s) for today outside their campaign date ranges`,
      );
      challengesOutsideRange.forEach((c) => {
        issues.push(
          `   - Challenge "${c.challengeTitle}" for ${c.challengeDate} but campaign runs ${c.campaignStartDate} → ${c.campaignEndDate}`,
        );
      });
    }

    // Check for active campaigns that should have challenges today
    const activeCampaignsForToday = allCampaigns.filter(
      (c) =>
        c.status === 'active' &&
        !c.archived &&
        today >= c.startDate! &&
        today <= c.endDate!,
    );

    const challengesForActiveCampaigns = todaysChallenges.filter(
      (c) => c.campaignStatus === 'active' && !c.campaignArchived,
    );

    if (
      activeCampaignsForToday.length > 0 &&
      challengesForActiveCampaigns.length === 0
    ) {
      issues.push(
        `🟡 Found ${activeCampaignsForToday.length} active campaign(s) that should have challenges today, but no valid challenges found`,
      );
      activeCampaignsForToday.forEach((c) => {
        issues.push(
          `   - Campaign "${c.name}" is active and covers today (${c.startDate} → ${c.endDate})`,
        );
      });
    }

    if (issues.length === 0) {
      console.log('✅ No obvious issues detected');
    } else {
      issues.forEach((issue) => console.log(issue));
    }

    // 5. Summary
    console.log('');
    console.log('📈 SUMMARY:');
    console.log('-'.repeat(60));
    console.log(`📊 Total Campaigns: ${allCampaigns.length}`);
    console.log(
      `📊 Active Campaigns: ${allCampaigns.filter((c) => c.status === 'active' && !c.archived).length}`,
    );
    console.log(
      `📊 Active Campaigns for Today: ${activeCampaignsForToday.length}`,
    );
    console.log(`📊 Total Challenges: ${allChallenges.length}`);
    console.log(`📊 Challenges for Today: ${todaysChallenges.length}`);
    console.log(
      `📊 Valid Challenges for Today: ${challengesForActiveCampaigns.length}`,
    );
    console.log(`🚨 Issues Found: ${issues.length}`);
  } catch (error) {
    console.error('❌ Investigation failed:', error);
  } finally {
    await sql.end();
  }
}

investigateChallenges();
