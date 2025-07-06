import { useState } from 'react';
import { BonusType, DailyBonus } from '@/types/dashboard';
import { useCreateDailyBonus, useUploadProof } from '@/hooks/useDailyBonus';
import { ApiClient, API_ENDPOINTS } from '@/services/api';

export const useBonusActions = (
  activeCampaignId?: number,
  triggerAnimation?: () => void,
) => {
  // États pour la modal de bonus
  const [bonusModalOpen, setBonusModalOpen] = useState(false);
  const [bonusType, setBonusType] = useState<BonusType | null>(null);
  const [bonusProofFile, setBonusProofFile] = useState<File | null>(null);

  // États pour l'accordéon des bonus déclarés
  const [bonusAccordionOpen, setBonusAccordionOpen] = useState(false);
  const [selectedBonusProof, setSelectedBonusProof] =
    useState<DailyBonus | null>(null);
  const [bonusProofModalOpen, setBonusProofModalOpen] = useState(false);
  const [bonusProofUrl, setBonusProofUrl] = useState<string | null>(null);
  const [loadingBonusProof, setLoadingBonusProof] = useState(false);

  // Mutations TanStack Query
  const createBonusMutation = useCreateDailyBonus();
  const uploadProofMutation = useUploadProof();

  // Fonction pour ouvrir la modal de déclaration de bonus
  const openBonusModal = (type: BonusType) => {
    setBonusType(type);
    setBonusModalOpen(true);
  };

  // Fonction pour fermer la modal de bonus et réinitialiser
  const closeBonusModal = () => {
    setBonusModalOpen(false);
    setBonusType(null);
    setBonusProofFile(null);
  };

  // Fonction pour soumettre un bonus
  const handleBonusSubmit = async (onSuccess?: () => void) => {
    if (!bonusType || !bonusProofFile) {
      console.error('Type de bonus ou fichier de preuve manquant');
      return;
    }

    try {
      if (!activeCampaignId) {
        throw new Error('Aucune campagne active trouvée');
      }

      const currentDate = new Date().toISOString().split('T')[0]; // Format YYYY-MM-DD

      // Déterminer le montant selon le type de bonus
      const amount = bonusType === 'sponsorship' ? '5.00' : '1.00';

      // 1. Créer le bonus avec la mutation TanStack Query
      const bonusData = {
        campaignId: activeCampaignId,
        bonusDate: currentDate,
        bonusType: bonusType,
        amount: amount,
      };

      console.log('🚀 Création du bonus avec TanStack Query:', bonusData);
      const bonus = await createBonusMutation.mutateAsync(bonusData);
      console.log('✅ Bonus créé:', bonus);

      // 2. Upload de la preuve si présente
      if (bonusProofFile && bonus.id) {
        console.log('📤 Upload de la preuve...');
        await uploadProofMutation.mutateAsync({
          id: bonus.id,
          file: bonusProofFile,
        });
        console.log('✅ Preuve uploadée avec succès');
      }

      console.log('✅ Bonus déclaré avec succès');

      // Fermer la modal et réinitialiser
      closeBonusModal();

      // Déclencher l'animation des gains si la fonction est fournie
      // Note: Les données sont déjà mises à jour grâce à l'optimistic update de TanStack Query
      if (triggerAnimation) {
        console.log("🎉 Déclenchement de l'animation des gains pour le bonus");
        triggerAnimation();
      }

      // Callback de succès pour rafraîchir les données
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error('❌ Erreur lors de la déclaration du bonus:', error);
      throw error; // Re-throw pour que le composant puisse gérer l'erreur
    }
  };

  // Fonction pour visualiser la preuve d'un bonus
  const handleViewBonusProof = async (bonus: DailyBonus) => {
    if (!bonus.proofUrl) {
      console.warn('Aucune preuve disponible pour ce bonus');
      return;
    }

    setLoadingBonusProof(true);
    setSelectedBonusProof(bonus);

    try {
      // Utiliser ApiClient pour avoir automatiquement la bonne URL et les headers
      const response = await ApiClient.get(
        API_ENDPOINTS.DAILY_BONUS_PROOF(bonus.id),
      );

      if (!response.ok) {
        throw new Error('Erreur lors de la récupération de la preuve');
      }

      const data = await response.json();
      // Le backend retourne { url: signedUrl } pas { signedUrl }
      setBonusProofUrl(data.url);
      setBonusProofModalOpen(true);
    } catch (error) {
      console.error('Erreur lors de la récupération de la preuve:', error);
    } finally {
      setLoadingBonusProof(false);
    }
  };

  // Fonction pour fermer la modal de preuve
  const closeBonusProofModal = () => {
    setBonusProofModalOpen(false);
    setSelectedBonusProof(null);
    setBonusProofUrl(null);
  };

  return {
    // États pour la modal de bonus
    bonusModalOpen,
    bonusType,
    bonusProofFile,
    bonusSubmitting:
      createBonusMutation.isPending || uploadProofMutation.isPending,

    // États pour l'accordéon des bonus
    bonusAccordionOpen,
    selectedBonusProof,
    bonusProofModalOpen,
    bonusProofUrl,
    loadingBonusProof,

    // Actions pour la déclaration de bonus
    openBonusModal,
    closeBonusModal,
    setBonusProofFile,
    handleBonusSubmit,

    // Actions pour l'accordéon des bonus
    setBonusAccordionOpen,
    handleViewBonusProof,
    closeBonusProofModal,
  };
};
