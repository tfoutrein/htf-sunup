import { ApiClient, API_ENDPOINTS } from './api';
import {
  CampaignValidation,
  UpdateCampaignValidationRequest,
} from '@/types/campaign-validation';

export const campaignValidationService = {
  /**
   * Récupère toutes les validations de campagne pour les FBO sous la hiérarchie du manager
   */
  async getCampaignValidations(
    campaignId: number,
  ): Promise<CampaignValidation[]> {
    const response = await ApiClient.get(
      `${API_ENDPOINTS.CAMPAIGN_VALIDATION}/campaign/${campaignId}`,
    );

    if (!response.ok) {
      throw new Error('Failed to fetch campaign validations');
    }

    return response.json();
  },

  /**
   * Récupère le statut de validation de campagne pour l'utilisateur connecté
   */
  async getMyCampaignValidationStatus(
    campaignId: number,
  ): Promise<CampaignValidation> {
    const response = await ApiClient.get(
      `${API_ENDPOINTS.CAMPAIGN_VALIDATION}/my-status/${campaignId}`,
    );

    if (!response.ok) {
      throw new Error('Failed to fetch my campaign validation status');
    }

    return response.json();
  },

  /**
   * Met à jour une validation de campagne pour un FBO spécifique
   */
  async updateCampaignValidation(
    userId: number,
    campaignId: number,
    data: UpdateCampaignValidationRequest,
  ): Promise<CampaignValidation> {
    const response = await ApiClient.put(
      `${API_ENDPOINTS.CAMPAIGN_VALIDATION}/user/${userId}/campaign/${campaignId}`,
      data,
    );

    if (!response.ok) {
      throw new Error('Failed to update campaign validation');
    }

    return response.json();
  },
};
