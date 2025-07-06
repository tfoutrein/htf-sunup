import {
  DailyBonus,
  CampaignBonusConfig,
  CreateDailyBonusDto,
  UpdateDailyBonusDto,
  CreateCampaignBonusConfigDto,
  DailyBonusStats,
} from '@/types/daily-bonus';
import { ApiClient, API_ENDPOINTS } from './api';

class DailyBonusService {
  // Daily Bonus CRUD
  async createDailyBonus(bonus: CreateDailyBonusDto): Promise<DailyBonus> {
    const response = await ApiClient.post(API_ENDPOINTS.DAILY_BONUS, bonus);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'Failed to create daily bonus');
    }

    return response.json();
  }

  async getMyBonuses(): Promise<DailyBonus[]> {
    const response = await ApiClient.get(API_ENDPOINTS.DAILY_BONUS_MY_BONUSES);

    if (!response.ok) {
      throw new Error('Failed to fetch my bonuses');
    }

    return response.json();
  }

  async getMyStats(campaignId: number): Promise<DailyBonusStats> {
    const response = await ApiClient.get(
      API_ENDPOINTS.DAILY_BONUS_MY_STATS(campaignId),
    );

    if (!response.ok) {
      throw new Error('Failed to fetch my stats');
    }

    return response.json();
  }

  async getDailyBonus(id: number): Promise<DailyBonus> {
    const response = await ApiClient.get(API_ENDPOINTS.DAILY_BONUS_BY_ID(id));

    if (!response.ok) {
      throw new Error('Failed to fetch daily bonus');
    }

    return response.json();
  }

  async updateDailyBonus(
    id: number,
    updates: UpdateDailyBonusDto,
  ): Promise<DailyBonus> {
    const response = await ApiClient.patch(
      API_ENDPOINTS.DAILY_BONUS_BY_ID(id),
      updates,
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'Failed to update daily bonus');
    }

    return response.json();
  }

  async deleteDailyBonus(id: number): Promise<void> {
    const response = await ApiClient.delete(
      API_ENDPOINTS.DAILY_BONUS_BY_ID(id),
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'Failed to delete daily bonus');
    }
  }

  // Proof management
  async uploadProof(id: number, file: File): Promise<{ url: string }> {
    const token = localStorage.getItem('token');
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'}${API_ENDPOINTS.DAILY_BONUS_PROOF(id)}`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      },
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'Failed to upload proof');
    }

    return response.json();
  }

  async getProofUrl(id: number): Promise<{ url: string }> {
    const response = await ApiClient.get(API_ENDPOINTS.DAILY_BONUS_PROOF(id));

    if (!response.ok) {
      throw new Error('Failed to get proof URL');
    }

    return response.json();
  }

  // Manager functions
  async getCampaignBonuses(campaignId: number): Promise<DailyBonus[]> {
    const response = await ApiClient.get(
      API_ENDPOINTS.DAILY_BONUS_CAMPAIGN_BONUSES(campaignId),
    );

    if (!response.ok) {
      throw new Error('Failed to fetch campaign bonuses');
    }

    return response.json();
  }

  async getUserCampaignBonuses(
    userId: number,
    campaignId: number,
  ): Promise<DailyBonus[]> {
    const response = await ApiClient.get(
      API_ENDPOINTS.DAILY_BONUS_USER_CAMPAIGN_BONUSES(userId, campaignId),
    );

    if (!response.ok) {
      throw new Error('Failed to fetch user campaign bonuses');
    }

    return response.json();
  }

  // Bonus configuration
  async createBonusConfig(
    config: CreateCampaignBonusConfigDto,
  ): Promise<CampaignBonusConfig> {
    const response = await ApiClient.post(
      API_ENDPOINTS.DAILY_BONUS_CONFIG,
      config,
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'Failed to create bonus config');
    }

    return response.json();
  }

  async getBonusConfig(campaignId: number): Promise<CampaignBonusConfig> {
    const response = await ApiClient.get(
      API_ENDPOINTS.DAILY_BONUS_CONFIG_BY_CAMPAIGN(campaignId),
    );

    if (!response.ok) {
      throw new Error('Failed to fetch bonus config');
    }

    return response.json();
  }

  async updateBonusConfig(
    configId: number,
    updates: Partial<CreateCampaignBonusConfigDto>,
  ): Promise<CampaignBonusConfig> {
    const response = await ApiClient.patch(
      `${API_ENDPOINTS.DAILY_BONUS_CONFIG}/${configId}`,
      updates,
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'Failed to update bonus config');
    }

    return response.json();
  }
}

export const dailyBonusService = new DailyBonusService();
