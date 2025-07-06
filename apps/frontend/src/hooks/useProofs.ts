import { useState } from 'react';
import { ApiClient, API_ENDPOINTS } from '@/services/api';
import type { Proof } from '@/types/proofs';

export interface UseProofsReturn {
  // États
  proofs: Proof[];
  proofsCount: number;
  isLoading: boolean;
  error: string | null;

  // Modals d'affichage
  viewModalOpen: boolean;
  currentProofUrl: string | null;
  currentProofIndex: number;

  // Actions
  fetchProofsByDailyBonus: (dailyBonusId: number) => Promise<Proof[]>;
  fetchProofsByUserAction: (userActionId: number) => Promise<Proof[]>;
  fetchProofsCount: (
    type: 'daily-bonus' | 'user-action',
    id: number,
  ) => Promise<number>;
  openViewModal: (proofs: Proof[], startIndex?: number) => void;
  closeViewModal: () => void;
  navigateProof: (direction: 'prev' | 'next') => void;
  getSignedUrl: (proofId: number) => Promise<string>;
}

export function useProofs(): UseProofsReturn {
  // États pour les preuves
  const [proofs, setProofs] = useState<Proof[]>([]);
  const [proofsCount, setProofsCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // États pour la modal de visualisation
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [currentProofUrl, setCurrentProofUrl] = useState<string | null>(null);
  const [currentProofIndex, setCurrentProofIndex] = useState(0);

  // Récupérer les preuves d'un bonus quotidien
  const fetchProofsByDailyBonus = async (
    dailyBonusId: number,
  ): Promise<Proof[]> => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await ApiClient.get(
        `/proofs/daily-bonus/${dailyBonusId}`,
      );

      if (response.ok) {
        const proofsData = await response.json();
        setProofs(proofsData);
        setProofsCount(proofsData.length);
        return proofsData;
      } else {
        throw new Error('Erreur lors de la récupération des preuves');
      }
    } catch (err) {
      console.error('Erreur fetchProofsByDailyBonus:', err);
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
      setProofs([]);
      setProofsCount(0);
      return [];
    } finally {
      setIsLoading(false);
    }
  };

  // Récupérer les preuves d'une action utilisateur
  const fetchProofsByUserAction = async (
    userActionId: number,
  ): Promise<Proof[]> => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await ApiClient.get(
        `/proofs/user-action/${userActionId}`,
      );

      if (response.ok) {
        const proofsData = await response.json();
        setProofs(proofsData);
        setProofsCount(proofsData.length);
        return proofsData;
      } else {
        throw new Error('Erreur lors de la récupération des preuves');
      }
    } catch (err) {
      console.error('Erreur fetchProofsByUserAction:', err);
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
      setProofs([]);
      setProofsCount(0);
      return [];
    } finally {
      setIsLoading(false);
    }
  };

  // Récupérer le nombre de preuves sans les charger
  const fetchProofsCount = async (
    type: 'daily-bonus' | 'user-action',
    id: number,
  ): Promise<number> => {
    try {
      const endpoint =
        type === 'daily-bonus'
          ? `/proofs/daily-bonus/${id}/count`
          : `/proofs/user-action/${id}/count`;

      const response = await ApiClient.get(endpoint);

      if (response.ok) {
        const data = await response.json();
        return data.count || 0;
      }

      return 0;
    } catch (err) {
      console.error('Erreur fetchProofsCount:', err);
      return 0;
    }
  };

  // Obtenir l'URL signée d'une preuve
  const getSignedUrl = async (proofId: number): Promise<string> => {
    try {
      const response = await ApiClient.get(`/proofs/${proofId}/signed-url`);

      if (response.ok) {
        const data = await response.json();
        return data.url;
      } else {
        throw new Error("Impossible de récupérer l'URL de la preuve");
      }
    } catch (err) {
      console.error('Erreur getSignedUrl:', err);
      throw err;
    }
  };

  // Ouvrir la modal de visualisation
  const openViewModal = async (
    proofsToView: Proof[],
    startIndex: number = 0,
  ) => {
    if (proofsToView.length === 0) return;

    try {
      setProofs(proofsToView);
      setCurrentProofIndex(startIndex);
      setViewModalOpen(true);

      // Charger l'URL signée de la première preuve
      const firstProof = proofsToView[startIndex];
      if (firstProof) {
        const signedUrl = await getSignedUrl(firstProof.id);
        setCurrentProofUrl(signedUrl);
      }
    } catch (err) {
      console.error("Erreur lors de l'ouverture de la modal:", err);
      setError('Impossible de charger la preuve');
    }
  };

  // Fermer la modal de visualisation
  const closeViewModal = () => {
    setViewModalOpen(false);
    setCurrentProofUrl(null);
    setCurrentProofIndex(0);
  };

  // Naviguer entre les preuves
  const navigateProof = async (direction: 'prev' | 'next') => {
    if (proofs.length === 0) return;

    const newIndex =
      direction === 'prev'
        ? Math.max(0, currentProofIndex - 1)
        : Math.min(proofs.length - 1, currentProofIndex + 1);

    if (newIndex !== currentProofIndex) {
      setCurrentProofIndex(newIndex);

      try {
        const proof = proofs[newIndex];
        const signedUrl = await getSignedUrl(proof.id);
        setCurrentProofUrl(signedUrl);
      } catch (err) {
        console.error('Erreur lors de la navigation:', err);
        setError('Impossible de charger la preuve');
      }
    }
  };

  return {
    // États
    proofs,
    proofsCount,
    isLoading,
    error,

    // Modals
    viewModalOpen,
    currentProofUrl,
    currentProofIndex,

    // Actions
    fetchProofsByDailyBonus,
    fetchProofsByUserAction,
    fetchProofsCount,
    openViewModal,
    closeViewModal,
    navigateProof,
    getSignedUrl,
  };
}

// Hook pour uploader plusieurs preuves en séquence (compatibilité avec l'ancien système)
export function useMultipleProofUpload() {
  const [isUploading, setIsUploading] = useState(false);

  const uploadMultipleProofs = async (
    files: File[],
    target:
      | { type: 'user-action'; id: number }
      | { type: 'daily-bonus'; id: number },
  ): Promise<any[]> => {
    setIsUploading(true);
    const results: any[] = [];
    const errors: string[] = [];

    try {
      for (const file of files) {
        try {
          const formData = new FormData();
          formData.append('file', file);

          const endpoint =
            target.type === 'user-action'
              ? `/proofs/user-action/${target.id}`
              : `/proofs/daily-bonus/${target.id}`;

          const response = await ApiClient.post(endpoint, formData, true);

          if (!response.ok) {
            const error = await response
              .json()
              .catch(() => ({ message: 'Erreur inconnue' }));
            throw new Error(
              error.message || "Erreur lors de l'upload de la preuve",
            );
          }

          const result = await response.json();
          results.push(result);
        } catch (error) {
          errors.push(
            `${file.name}: ${error instanceof Error ? error.message : 'Erreur inconnue'}`,
          );
        }
      }

      if (errors.length > 0) {
        throw new Error(`Erreurs lors de l'upload:\n${errors.join('\n')}`);
      }

      return results;
    } finally {
      setIsUploading(false);
    }
  };

  return {
    uploadMultipleProofs,
    isUploading,
  };
}
