// Import types from campaigns
import type { Action, Challenge, Campaign } from './campaigns';
import type { DailyBonus } from './daily-bonus';

export interface DashboardUser {
  id: number;
  name: string;
  email: string;
  role: string;
}

export interface UserAction {
  id: number;
  userId: number;
  actionId: number;
  challengeId: number;
  completed: boolean;
  completedAt: string | null;
  proofUrl: string | null;
  action?: Action;
}

export interface CampaignStats {
  campaign: {
    id: number;
    name: string;
    startDate: string;
    endDate: string;
  };
  stats: {
    totalChallenges: number;
    completedChallenges: number;
    challengeCompletionRate: number;
    totalActions: number;
    completedActions: number;
    actionCompletionRate: number;
    totalPointsEarned?: number;
    maxPossiblePoints?: number;
    totalEarnedEuros: number;
    maxPossibleEuros: number;
  };
  challengeDetails: Array<{
    challengeId: number;
    challengeTitle: string;
    challengeDate: string;
    totalActions: number;
    completedActions: number;
    isCompleted: boolean;
    percentage: number;
    valueInEuro?: string;
    earnedValue?: number;
  }>;
}

export interface UserStreaks {
  currentStreak: number;
  longestStreak: number;
  totalActiveDays: number;
  lastActivityDate: string | null;
}

export interface UserBadge {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  earnedAt: string;
}

export interface GameStats {
  totalEarnedEuros: number;
  totalPointsEarned: number;
  totalChallenges: number;
  completedChallenges: number;
  challengeCompletionRate: number;
  currentStreak: number;
  longestStreak: number;
  totalActiveDays: number;
  lastActivityDate: string | null;
}

export interface EarningsData {
  campaignEarnings: number;
  totalBonusAmount: number;
  totalEarnings: number;
  maxPossibleEarnings: number;
}

export interface BonusStats {
  totalBonusAmount: number;
  bonusCount: number;
  basketBonusCount: number;
  sponsorshipBonusCount: number;
}

export type BonusType = 'sponsorship' | 'basket';

export interface ActionTypeConfig {
  label: string;
  color: 'success' | 'primary' | 'secondary';
  icon: string;
  bgColor: string;
  borderColor: string;
}

// Re-export types for external consumption
export type { Action, Challenge, Campaign, DailyBonus };
