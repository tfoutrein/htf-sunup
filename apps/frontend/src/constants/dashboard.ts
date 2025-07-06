import { ActionTypeConfig } from '@/types/dashboard';

export const ACTION_TYPE_CONFIG: Record<string, ActionTypeConfig> = {
  vente: {
    label: 'Vente',
    color: 'success' as const,
    icon: '💰',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200',
  },
  recrutement: {
    label: 'Recrutement',
    color: 'primary' as const,
    icon: '🤝',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
  },
  reseaux_sociaux: {
    label: 'Réseaux Sociaux',
    color: 'secondary' as const,
    icon: '📱',
    bgColor: 'bg-purple-50',
    borderColor: 'border-purple-200',
  },
};

export const BONUS_TYPES = {
  sponsorship: {
    label: 'Parrainage',
    amount: 5,
    icon: '🤝',
    color: 'from-blue-500 to-purple-500',
  },
  basket: {
    label: 'Dépôt de Panier',
    amount: 1,
    icon: '🛒',
    color: 'from-amber-500 to-orange-500',
  },
} as const;

export const CONFETTI_COLORS = [
  '#FFC700',
  '#FF0000',
  '#2E3191',
  '#41BBC7',
  '#FFD700',
  '#32CD32',
];

export const ANIMATION_DURATIONS = {
  MONEY_UPDATE: 3000,
  CONFETTI: 4000,
  NEXT_CHALLENGE_EMPHASIS: 2000,
} as const;

export const PROGRESS_MESSAGES = {
  START: "C'est parti ! 🚀",
  HALF: 'Continue comme ça ! 🔥',
  ALMOST: 'Tu y es presque ! 💪',
  COMPLETE: '🎉 Félicitations ! Tu as terminé tous tes défis du jour !',
} as const;
