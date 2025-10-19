import { useActiveCampaigns } from './useCampaigns';

/**
 * Hook pour vérifier si les bonus quotidiens sont activés pour la campagne active
 * @returns {object} - { bonusesEnabled: boolean, activeCampaign: Campaign | null }
 */
export function useBonusesEnabled() {
  const { data: campaigns = [], isLoading } = useActiveCampaigns();
  const activeCampaign = campaigns[0] || null;

  return {
    bonusesEnabled: activeCampaign?.bonusesEnabled ?? false,
    activeCampaign,
    isLoading,
  };
}

