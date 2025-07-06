import { useState } from 'react';
import { useProofs } from './useProofs';
import type { ActionWithProofCount } from '@/types/campaigns';

export interface UseActionProofsReturn {
  // Enrichissement des actions avec le comptage de preuves
  enrichActionsWithProofCounts: (
    actions: any[],
  ) => Promise<ActionWithProofCount[]>;

  // Affichage des preuves
  viewActionProofs: (action: { userActionId?: number }) => Promise<void>;

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

export function useActionProofs(): UseActionProofsReturn {
  const proofsHook = useProofs();

  // Cache pour éviter de refaire les appels API à chaque render
  const [proofsCountCache, setProofsCountCache] = useState<
    Record<number, number>
  >({});

  // Enrichir les actions avec le comptage de preuves
  const enrichActionsWithProofCounts = async (
    actions: any[],
  ): Promise<ActionWithProofCount[]> => {
    const enrichedActions: ActionWithProofCount[] = [];

    for (const action of actions) {
      let proofsCount = 0;

      // Si l'action a un userActionId, récupérer le count des preuves
      if (action.userActionId) {
        proofsCount = proofsCountCache[action.userActionId];

        // Si pas en cache, récupérer le count
        if (proofsCount === undefined) {
          proofsCount = await proofsHook.fetchProofsCount(
            'user-action',
            action.userActionId,
          );

          // Mettre en cache
          setProofsCountCache((prev) => ({
            ...prev,
            [action.userActionId]: proofsCount,
          }));
        }
      }

      enrichedActions.push({
        ...action,
        proofsCount,
        hasProofs: proofsCount > 0,
      });
    }

    return enrichedActions;
  };

  // Afficher les preuves d'une action
  const viewActionProofs = async (action: { userActionId?: number }) => {
    if (!action.userActionId) {
      console.warn(
        "Action sans userActionId, impossible d'afficher les preuves",
      );
      return;
    }

    try {
      console.log(
        "🔍 Affichage des preuves pour l'action:",
        action.userActionId,
      );

      // Récupérer toutes les preuves de l'action
      const actionProofs = await proofsHook.fetchProofsByUserAction(
        action.userActionId,
      );

      console.log(
        '📄 Preuves récupérées pour action',
        action.userActionId,
        ':',
        actionProofs.length,
        actionProofs,
      );

      // Ouvrir la modal avec les preuves récupérées
      if (actionProofs.length > 0) {
        await proofsHook.openViewModal(actionProofs, 0);
      } else {
        console.warn('Aucune preuve trouvée pour cette action');
      }
    } catch (error) {
      console.error(
        "Erreur lors de l'affichage des preuves de l'action:",
        error,
      );
    }
  };

  return {
    // Fonctions spécialisées pour les actions
    enrichActionsWithProofCounts,
    viewActionProofs,

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
