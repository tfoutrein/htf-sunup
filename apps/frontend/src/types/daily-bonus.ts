export interface DailyBonus {
  id: number;
  userId: number;
  campaignId: number;
  bonusDate: string;
  bonusType: 'basket' | 'sponsorship';
  amount: string;
  proofUrl?: string;
  status: 'pending' | 'approved' | 'rejected';
  reviewedBy?: number;
  reviewedAt?: string;
  reviewComment?: string;
  createdAt: string;
  updatedAt: string;
  user?: {
    id: number;
    name: string;
    email: string;
  };
  reviewer?: {
    id: number;
    name: string;
    email: string;
  };
}

export interface CampaignBonusConfig {
  id: number;
  campaignId: number;
  basketBonusAmount: string;
  sponsorshipBonusAmount: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateDailyBonusDto {
  campaignId: number;
  bonusDate: string;
  bonusType: 'basket' | 'sponsorship';
  amount?: string;
}

export interface UpdateDailyBonusDto {
  amount?: string;
  proofUrl?: string;
  status?: 'pending' | 'approved' | 'rejected';
  reviewComment?: string;
}

export interface CreateCampaignBonusConfigDto {
  campaignId: number;
  basketBonusAmount: string;
  sponsorshipBonusAmount: string;
}

export interface DailyBonusStats {
  totalBonuses: number;
  totalAmount: number;
  pendingBonuses: number;
  approvedBonuses: number;
  rejectedBonuses: number;
  basketBonuses: number;
  sponsorshipBonuses: number;
  thisMonthAmount: number;
  lastMonthAmount: number;
}

export const BONUS_TYPE_CONFIG = {
  basket: {
    label: 'Dépôt panier',
    emoji: '🛒',
    color: 'success' as const,
    description: "Dépôt d'un panier avec un client",
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200',
  },
  sponsorship: {
    label: 'Parrainage',
    emoji: '🤝',
    color: 'primary' as const,
    description: "Parrainage d'une nouvelle personne",
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
  },
} as const;

export const BONUS_STATUS_CONFIG = {
  pending: {
    label: 'En attente',
    color: 'warning' as const,
    emoji: '⏳',
  },
  approved: {
    label: 'Approuvé',
    color: 'success' as const,
    emoji: '✅',
  },
  rejected: {
    label: 'Rejeté',
    color: 'danger' as const,
    emoji: '❌',
  },
} as const;
