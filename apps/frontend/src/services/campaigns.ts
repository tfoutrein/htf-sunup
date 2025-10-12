import {
  Campaign,
  Challenge,
  Action,
  CampaignWithChallenges,
  ChallengeWithActions,
} from '@/types/campaigns';
import { ApiClient, API_ENDPOINTS } from './api';

class CampaignService {
  // Campaigns
  async getCampaigns(): Promise<Campaign[]> {
    const response = await ApiClient.get(API_ENDPOINTS.CAMPAIGNS);

    if (!response.ok) {
      throw new Error('Failed to fetch campaigns');
    }

    return response.json();
  }

  async getActiveCampaigns(): Promise<Campaign[]> {
    const response = await ApiClient.get(API_ENDPOINTS.CAMPAIGNS_ACTIVE);

    if (!response.ok) {
      throw new Error('Failed to fetch active campaigns');
    }

    return response.json();
  }

  async getCampaign(id: number): Promise<Campaign> {
    const response = await ApiClient.get(API_ENDPOINTS.CAMPAIGNS_BY_ID(id));

    if (!response.ok) {
      throw new Error('Failed to fetch campaign');
    }

    return response.json();
  }

  async getCampaignWithChallenges(id: number): Promise<CampaignWithChallenges> {
    const response = await ApiClient.get(
      API_ENDPOINTS.CAMPAIGNS_WITH_CHALLENGES(id),
    );

    if (!response.ok) {
      throw new Error('Failed to fetch campaign with challenges');
    }

    return response.json();
  }

  async createCampaign(
    campaign: Omit<Campaign, 'id' | 'createdBy' | 'createdAt' | 'updatedAt'>,
  ): Promise<Campaign> {
    const response = await ApiClient.post(API_ENDPOINTS.CAMPAIGNS, campaign);

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
    const response = await ApiClient.patch(
      API_ENDPOINTS.CAMPAIGNS_BY_ID(id),
      campaign,
    );

    if (!response.ok) {
      throw new Error('Failed to update campaign');
    }

    return response.json();
  }

  async deleteCampaign(id: number): Promise<void> {
    const response = await ApiClient.delete(API_ENDPOINTS.CAMPAIGNS_BY_ID(id));

    if (!response.ok) {
      if (response.status === 400) {
        const errorText = await response.text();
        if (errorText.includes('défis')) {
          throw new Error(
            "Impossible de supprimer cette campagne car elle contient des défis. Supprimez d'abord tous les défis de la campagne.",
          );
        }
      }
      throw new Error('Erreur lors de la suppression de la campagne');
    }
  }

  async uploadPresentationVideo(
    campaignId: number,
    file: File,
  ): Promise<Campaign> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await ApiClient.post(
      API_ENDPOINTS.CAMPAIGNS_PRESENTATION_VIDEO(campaignId),
      formData,
      true, // isFormData
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `Failed to upload presentation video: ${response.status} - ${errorText}`,
      );
    }

    return response.json();
  }

  async deletePresentationVideo(campaignId: number): Promise<Campaign> {
    const response = await ApiClient.delete(
      API_ENDPOINTS.CAMPAIGNS_PRESENTATION_VIDEO(campaignId),
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `Failed to delete presentation video: ${response.status} - ${errorText}`,
      );
    }

    return response.json();
  }

  // Challenges
  async getChallenges(
    campaignId?: number,
    date?: string,
  ): Promise<Challenge[]> {
    const params = new URLSearchParams();
    if (campaignId) params.append('campaignId', campaignId.toString());
    if (date) params.append('date', date);

    const endpoint = params.toString()
      ? `${API_ENDPOINTS.CHALLENGES}?${params}`
      : API_ENDPOINTS.CHALLENGES;
    const response = await ApiClient.get(endpoint);

    if (!response.ok) {
      throw new Error('Failed to fetch challenges');
    }

    return response.json();
  }

  async getTodayChallenges(): Promise<Challenge[]> {
    const response = await ApiClient.get(API_ENDPOINTS.CHALLENGES_TODAY);

    if (!response.ok) {
      throw new Error('Failed to fetch today challenges');
    }

    return response.json();
  }

  async getNextChallenge(campaignId?: number): Promise<Challenge | null> {
    const params = new URLSearchParams();
    if (campaignId) params.append('campaignId', campaignId.toString());

    const endpoint = params.toString()
      ? `${API_ENDPOINTS.CHALLENGES_NEXT}?${params}`
      : API_ENDPOINTS.CHALLENGES_NEXT;

    const response = await ApiClient.get(endpoint);

    if (!response.ok) {
      throw new Error('Failed to fetch next challenge');
    }

    return response.json();
  }

  async getChallenge(id: number): Promise<Challenge> {
    const response = await ApiClient.get(API_ENDPOINTS.CHALLENGES_BY_ID(id));

    if (!response.ok) {
      throw new Error('Failed to fetch challenge');
    }

    return response.json();
  }

  async getChallengeWithActions(id: number): Promise<ChallengeWithActions> {
    const response = await ApiClient.get(
      API_ENDPOINTS.CHALLENGES_WITH_ACTIONS(id),
    );

    if (!response.ok) {
      throw new Error('Failed to fetch challenge with actions');
    }

    return response.json();
  }

  async createChallenge(
    challenge: Omit<Challenge, 'id' | 'createdAt' | 'updatedAt'>,
  ): Promise<Challenge> {
    const response = await ApiClient.post(API_ENDPOINTS.CHALLENGES, challenge);

    if (!response.ok) {
      throw new Error('Failed to create challenge');
    }

    return response.json();
  }

  async updateChallenge(
    id: number,
    challenge: Partial<Challenge>,
  ): Promise<Challenge> {
    const response = await ApiClient.patch(
      API_ENDPOINTS.CHALLENGES_BY_ID(id),
      challenge,
    );

    if (!response.ok) {
      throw new Error('Failed to update challenge');
    }

    return response.json();
  }

  async deleteChallenge(id: number): Promise<void> {
    const response = await ApiClient.delete(API_ENDPOINTS.CHALLENGES_BY_ID(id));

    if (!response.ok) {
      throw new Error('Failed to delete challenge');
    }
  }

  // Actions
  async getChallengeActions(challengeId: number): Promise<Action[]> {
    const endpoint = `${API_ENDPOINTS.ACTIONS}?challengeId=${challengeId}`;
    const response = await ApiClient.get(endpoint);

    if (!response.ok) {
      throw new Error('Failed to fetch challenge actions');
    }

    return response.json();
  }

  async createAction(
    action: Omit<Action, 'id' | 'createdAt' | 'updatedAt'>,
  ): Promise<Action> {
    const response = await ApiClient.post(API_ENDPOINTS.ACTIONS, action);

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `Failed to create action: ${response.status} - ${errorText}`,
      );
    }

    return response.json();
  }

  async updateAction(id: number, action: Partial<Action>): Promise<Action> {
    const response = await ApiClient.patch(`/actions/${id}`, action);

    if (!response.ok) {
      throw new Error('Failed to update action');
    }

    return response.json();
  }

  async deleteAction(id: number): Promise<void> {
    const response = await ApiClient.delete(`/actions/${id}`);

    if (!response.ok) {
      throw new Error('Failed to delete action');
    }
  }
}

export const campaignService = new CampaignService();
