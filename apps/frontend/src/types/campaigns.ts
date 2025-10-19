export interface Campaign {
  id: number;
  name: string;
  description: string;
  presentationVideoUrl?: string | null;
  startDate: string;
  endDate: string;
  status: 'draft' | 'active' | 'completed' | 'cancelled';
  bonusesEnabled: boolean; // Permet de désactiver les bonus quotidiens pour cette campagne
  createdBy: number;
  createdAt: string;
  updatedAt: string;
  challengeCount?: number;
  totalDays?: number;
}

export interface Challenge {
  id: number;
  campaignId: number;
  date: string;
  title: string;
  description: string;
  valueInEuro: string;
  createdAt: string;
  updatedAt: string;
  actions?: Action[];
}

export interface Action {
  id: number;
  challengeId: number;
  title: string;
  description: string;
  type: 'vente' | 'recrutement' | 'reseaux_sociaux';
  order: number;
  createdAt: string;
  updatedAt: string;
}

export interface UserAction {
  id: number;
  userId: number;
  actionId: number;
  challengeId: number;
  completed: boolean;
  completedAt: string | null;
  proofUrl: string | null;
}

export interface CampaignWithChallenges extends Campaign {
  challenges: Challenge[];
}

export interface ActionWithProofCount extends Action {
  userActionId?: number;
  completed?: boolean;
  completedAt?: string;
  proofsCount: number;
  hasProofs: boolean;
}

export interface ChallengeWithActions extends Challenge {
  actions: Action[];
}
