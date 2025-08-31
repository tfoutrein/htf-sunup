export interface CampaignValidation {
  id: number;
  userId: number;
  userName: string;
  userEmail: string;
  campaignId: number;
  campaignName: string;
  status: 'pending' | 'approved' | 'rejected';
  validatedBy?: number;
  validatedAt?: string;
  comment?: string;
  totalEarnings: number;
  completedChallenges: number;
  totalChallenges: number;
  completionPercentage: number;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateCampaignValidationRequest {
  status: 'pending' | 'approved' | 'rejected';
  comment?: string;
}

export interface CampaignValidationStats {
  totalFBOs: number;
  approvedFBOs: number;
  rejectedFBOs: number;
  pendingFBOs: number;
  totalEarnings: number;
  averageCompletion: number;
}
