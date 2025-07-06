import { BONUS_TYPES, PROGRESS_MESSAGES } from '@/constants/dashboard';
import { BonusStats, EarningsData } from '@/types/dashboard';
import { Action, DailyBonus } from '@/types/dashboard';

/**
 * Obtient le label d'affichage pour un type de bonus
 */
export const getBonusTypeLabel = (type: string): string => {
  switch (type) {
    case 'sponsorship':
      return BONUS_TYPES.sponsorship.label;
    case 'basket':
      return BONUS_TYPES.basket.label;
    default:
      return 'Bonus';
  }
};

/**
 * Formate une date de bonus pour l'affichage
 */
export const formatBonusDate = (dateString: string): string => {
  const date = new Date(dateString);
  const today = new Date();

  // Vérifier si c'est aujourd'hui
  const isToday = date.toDateString() === today.toDateString();

  if (isToday) {
    return "Aujourd'hui";
  }

  // Vérifier si c'est hier
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const isYesterday = date.toDateString() === yesterday.toDateString();

  if (isYesterday) {
    return 'Hier';
  }

  // Sinon, formater la date complète
  return date.toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });
};

/**
 * Calcule les statistiques des bonus
 */
export const calculateBonusStats = (bonuses: DailyBonus[]): BonusStats => {
  const totalBonusAmount = bonuses.reduce(
    (sum, bonus) => sum + parseFloat(bonus.amount || '0'),
    0,
  );
  const bonusCount = bonuses.length;
  const basketBonusCount = bonuses.filter(
    (b) => b.bonusType === 'basket',
  ).length;
  const sponsorshipBonusCount = bonuses.filter(
    (b) => b.bonusType === 'sponsorship',
  ).length;

  return {
    totalBonusAmount,
    bonusCount,
    basketBonusCount,
    sponsorshipBonusCount,
  };
};

/**
 * Calcule les données de gains totaux
 */
export const calculateEarningsData = (
  campaignEarnings: number = 0,
  totalBonusAmount: number = 0,
  maxPossibleCampaignEuros: number = 0,
): EarningsData => {
  const totalEarnings = campaignEarnings + totalBonusAmount;
  const maxPossibleEarnings = maxPossibleCampaignEuros + totalBonusAmount;

  return {
    campaignEarnings,
    totalBonusAmount,
    totalEarnings,
    maxPossibleEarnings,
  };
};

/**
 * Obtient le message de progression en fonction du pourcentage
 */
export const getProgressMessage = (completionPercentage: number): string => {
  if (completionPercentage === 0) {
    return PROGRESS_MESSAGES.START;
  } else if (completionPercentage < 50) {
    return PROGRESS_MESSAGES.HALF;
  } else if (completionPercentage < 100) {
    return PROGRESS_MESSAGES.ALMOST;
  }
  return '';
};

/**
 * Vérifie si une action est complétée
 */
export const isActionCompleted = (
  action: Action,
  userActions: any[],
): boolean => {
  const userAction = userActions.find((ua) => ua.actionId === action.id);
  return userAction?.completed || false;
};

/**
 * Obtient l'action utilisateur pour une action donnée
 */
export const getUserAction = (
  action: Action,
  userActions: any[],
): any | undefined => {
  return userActions.find((ua) => ua.actionId === action.id);
};

/**
 * Vérifie si toutes les actions du jour sont terminées
 */
export const allTodayActionsCompleted = (
  actions: Action[],
  userActions: any[],
): boolean => {
  if (actions.length === 0) return false;
  return actions.every((action) => isActionCompleted(action, userActions));
};

/**
 * Calcule le pourcentage de completion des actions
 */
export const calculateCompletionPercentage = (
  actions: Action[],
  userActions: any[],
): number => {
  if (actions.length === 0) return 0;
  const completedCount = actions.filter((action) =>
    isActionCompleted(action, userActions),
  ).length;
  return (completedCount / actions.length) * 100;
};
