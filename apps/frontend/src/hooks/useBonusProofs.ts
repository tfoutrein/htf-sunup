import { useState, useEffect } from 'react';
import { useProofs } from './useProofs';
import type { DailyBonus } from '@/types/daily-bonus';

export interface BonusWithProofCount extends DailyBonus {
  proofsCount: number;
  hasProofs: boolean;
}

export interface UseBonusProofsReturn {
  // Enrichissement des bonus avec le comptage de preuves
  enrichBonusesWithProofCounts: (
    bonuses: DailyBonus[],
  ) => Promise<BonusWithProofCount[]>;

  // Affichage des preuves
  viewBonusProofs: (bonus: DailyBonus) => Promise<void>;

  // États du hook useProofs
  viewModalOpen: boolean;
  currentProofUrl: string | null;
  currentProofIndex: number;
  proofs: any[];
  isLoading: boolean;
  error: string | null;

  // Actions du hook useProofs
  closeViewModal: () => void;
  navigateProof: (direction: 'prev' | 'next') => void;
}

export function useBonusProofs(): UseBonusProofsReturn {
  const proofsHook = useProofs();

  // Cache pour éviter de refaire les appels API à chaque render
  const [proofsCountCache, setProofsCountCache] = useState<
    Record<number, number>
  >({});

  // Enrichir les bonus avec le comptage de preuves
  const enrichBonusesWithProofCounts = async (
    bonuses: DailyBonus[],
  ): Promise<BonusWithProofCount[]> => {
    const enrichedBonuses: BonusWithProofCount[] = [];

    for (const bonus of bonuses) {
      let proofsCount = proofsCountCache[bonus.id];

      // Si pas en cache, récupérer le count
      if (proofsCount === undefined) {
        proofsCount = await proofsHook.fetchProofsCount(
          'daily-bonus',
          bonus.id,
        );

        // Mettre en cache
        setProofsCountCache((prev) => ({
          ...prev,
          [bonus.id]: proofsCount,
        }));
      }

      enrichedBonuses.push({
        ...bonus,
        proofsCount,
        hasProofs: proofsCount > 0,
      });
    }

    return enrichedBonuses;
  };

  // Afficher les preuves d'un bonus
  const viewBonusProofs = async (bonus: DailyBonus) => {
    try {
      console.log('🔍 Affichage des preuves pour le bonus:', bonus.id);

      // Récupérer toutes les preuves du bonus
      const bonusProofs = await proofsHook.fetchProofsByDailyBonus(bonus.id);

      console.log(
        '📄 Preuves récupérées pour bonus',
        bonus.id,
        ':',
        bonusProofs.length,
        bonusProofs,
      );

      // Ouvrir la modal avec les preuves récupérées
      if (bonusProofs.length > 0) {
        await proofsHook.openViewModal(bonusProofs, 0);
      } else {
        console.warn('Aucune preuve trouvée pour ce bonus');
      }
    } catch (error) {
      console.error("Erreur lors de l'affichage des preuves du bonus:", error);
    }
  };

  return {
    // Fonctions spécialisées pour les bonus
    enrichBonusesWithProofCounts,
    viewBonusProofs,

    // États et actions du hook useProofs
    viewModalOpen: proofsHook.viewModalOpen,
    currentProofUrl: proofsHook.currentProofUrl,
    currentProofIndex: proofsHook.currentProofIndex,
    proofs: proofsHook.proofs,
    isLoading: proofsHook.isLoading,
    error: proofsHook.error,
    closeViewModal: proofsHook.closeViewModal,
    navigateProof: proofsHook.navigateProof,
  };
}
