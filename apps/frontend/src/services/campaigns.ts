import {
  Campaign,
  Challenge,
  Action,
  CampaignWithChallenges,
  ChallengeWithActions,
} from '@/types/campaigns';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

class CampaignService {
  private getAuthHeaders() {
    const token = localStorage.getItem('token');
    return {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    };
  }

  // Campaigns
  async getCampaigns(): Promise<Campaign[]> {
    const response = await fetch(`${API_URL}/campaigns`, {
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error('Failed to fetch campaigns');
    }

    return response.json();
  }

  async getActiveCampaigns(): Promise<Campaign[]> {
    const response = await fetch(`${API_URL}/campaigns/active`, {
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error('Failed to fetch active campaigns');
    }

    return response.json();
  }

  async getCampaign(id: number): Promise<Campaign> {
    const response = await fetch(`${API_URL}/campaigns/${id}`, {
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error('Failed to fetch campaign');
    }

    return response.json();
  }

  async getCampaignWithChallenges(id: number): Promise<CampaignWithChallenges> {
    const response = await fetch(`${API_URL}/campaigns/${id}/challenges`, {
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error('Failed to fetch campaign with challenges');
    }

    return response.json();
  }

  async createCampaign(
    campaign: Omit<Campaign, 'id' | 'createdBy' | 'createdAt' | 'updatedAt'>,
  ): Promise<Campaign> {
    const response = await fetch(`${API_URL}/campaigns`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(campaign),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `Failed to create campaign: ${response.status} - ${errorText}`,
      );
    }

    return response.json();
  }

  async updateCampaign(
    id: number,
    campaign: Partial<Campaign>,
  ): Promise<Campaign> {
    const response = await fetch(`${API_URL}/campaigns/${id}`, {
      method: 'PATCH',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(campaign),
    });

    if (!response.ok) {
      throw new Error('Failed to update campaign');
    }

    return response.json();
  }

  async deleteCampaign(id: number): Promise<void> {
    const response = await fetch(`${API_URL}/campaigns/${id}`, {
      method: 'DELETE',
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error('Failed to delete campaign');
    }
  }

  // Challenges
  async getChallenges(
    campaignId?: number,
    date?: string,
  ): Promise<Challenge[]> {
    const params = new URLSearchParams();
    if (campaignId) params.append('campaignId', campaignId.toString());
    if (date) params.append('date', date);

    const response = await fetch(`${API_URL}/challenges?${params}`, {
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error('Failed to fetch challenges');
    }

    return response.json();
  }

  async getTodayChallenges(): Promise<Challenge[]> {
    const response = await fetch(`${API_URL}/challenges/today`, {
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error('Failed to fetch today challenges');
    }

    return response.json();
  }

  async getChallenge(id: number): Promise<Challenge> {
    const response = await fetch(`${API_URL}/challenges/${id}`, {
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error('Failed to fetch challenge');
    }

    return response.json();
  }

  async getChallengeWithActions(id: number): Promise<ChallengeWithActions> {
    const response = await fetch(`${API_URL}/challenges/${id}/actions`, {
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error('Failed to fetch challenge with actions');
    }

    return response.json();
  }

  async createChallenge(
    challenge: Omit<Challenge, 'id' | 'createdAt' | 'updatedAt'>,
  ): Promise<Challenge> {
    const response = await fetch(`${API_URL}/challenges`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(challenge),
    });

    if (!response.ok) {
      throw new Error('Failed to create challenge');
    }

    return response.json();
  }

  async updateChallenge(
    id: number,
    challenge: Partial<Challenge>,
  ): Promise<Challenge> {
    const response = await fetch(`${API_URL}/challenges/${id}`, {
      method: 'PATCH',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(challenge),
    });

    if (!response.ok) {
      throw new Error('Failed to update challenge');
    }

    return response.json();
  }

  async deleteChallenge(id: number): Promise<void> {
    const response = await fetch(`${API_URL}/challenges/${id}`, {
      method: 'DELETE',
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error('Failed to delete challenge');
    }
  }

  // Actions
  async getChallengeActions(challengeId: number): Promise<Action[]> {
    const response = await fetch(
      `${API_URL}/actions/challenge/${challengeId}`,
      {
        headers: this.getAuthHeaders(),
      },
    );

    if (!response.ok) {
      throw new Error('Failed to fetch challenge actions');
    }

    return response.json();
  }

  async createAction(
    action: Omit<Action, 'id' | 'createdAt' | 'updatedAt'>,
  ): Promise<Action> {
    console.log('Sending action data:', action);

    const response = await fetch(`${API_URL}/actions`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(action),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Error creating action:', response.status, errorText);
      throw new Error(
        `Failed to create action: ${response.status} - ${errorText}`,
      );
    }

    return response.json();
  }

  async updateAction(id: number, action: Partial<Action>): Promise<Action> {
    const response = await fetch(`${API_URL}/actions/${id}`, {
      method: 'PATCH',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(action),
    });

    if (!response.ok) {
      throw new Error('Failed to update action');
    }

    return response.json();
  }

  async deleteAction(id: number): Promise<void> {
    const response = await fetch(`${API_URL}/actions/${id}`, {
      method: 'DELETE',
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error('Failed to delete action');
    }
  }
}

export const campaignService = new CampaignService();
