'use client';

import { useState, useEffect } from 'react';
import { Campaign } from '@/types/campaigns';
import {
  useCreateCampaign,
  useUpdateCampaign,
  useUploadPresentationVideo,
  useDeletePresentationVideo,
} from '@/hooks/useCampaigns';
import {
  useCreateUnlockConditions,
  useUnlockConditions,
  useUpdateUnlockCondition,
  useDeleteUnlockCondition,
} from '@/hooks/useUnlockConditions';
import UnlockConditionsManager, {
  UnlockConditionInput,
} from './UnlockConditionsManager';
import CampaignVideoUpload from './CampaignVideoUpload';
import {
  Card,
  Button,
  Input,
  Textarea,
  Select,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
} from '@/components/ui';

interface CampaignFormProps {
  campaign?: Campaign | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function CampaignForm({
  campaign,
  isOpen,
  onClose,
  onSuccess,
}: CampaignFormProps) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    startDate: '',
    endDate: '',
    status: 'draft' as Campaign['status'],
  });
  const [unlockConditions, setUnlockConditions] = useState<
    UnlockConditionInput[]
  >([]);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [shouldDeleteVideo, setShouldDeleteVideo] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // TanStack Query mutations
  const createCampaignMutation = useCreateCampaign();
  const updateCampaignMutation = useUpdateCampaign();
  const createUnlockConditionsMutation = useCreateUnlockConditions();
  const updateUnlockConditionMutation = useUpdateUnlockCondition();
  const deleteUnlockConditionMutation = useDeleteUnlockCondition();
  const uploadVideoMutation = useUploadPresentationVideo();
  const deleteVideoMutation = useDeletePresentationVideo();

  // Charger les conditions existantes si mode édition
  const { data: existingConditions, isLoading: conditionsLoading } =
    useUnlockConditions(campaign?.id);

  const isLoading =
    createCampaignMutation.isPending ||
    updateCampaignMutation.isPending ||
    uploadVideoMutation.isPending ||
    deleteVideoMutation.isPending;

  useEffect(() => {
    if (campaign) {
      setFormData({
        name: campaign.name,
        description: campaign.description,
        startDate: campaign.startDate.split('T')[0],
        endDate: campaign.endDate.split('T')[0],
        status: campaign.status,
      });
      // Reset video state
      setVideoFile(null);
      setShouldDeleteVideo(false);
      // Charger les conditions existantes si disponibles
      if (existingConditions && existingConditions.length > 0) {
        setUnlockConditions(
          existingConditions.map((c) => ({
            id: c.id,
            description: c.description,
            displayOrder: c.displayOrder,
          })),
        );
      } else {
        setUnlockConditions([]);
      }
    } else {
      setFormData({
        name: '',
        description: '',
        startDate: '',
        endDate: '',
        status: 'draft',
      });
      // Réinitialiser sans conditions
      setUnlockConditions([]);
      setVideoFile(null);
      setShouldDeleteVideo(false);
    }
    setError(null);
  }, [campaign, isOpen, existingConditions]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Vérifier que toutes les conditions ont une description
    const hasEmptyCondition = unlockConditions.some(
      (c) => !c.description.trim(),
    );
    if (hasEmptyCondition) {
      setError('Toutes les conditions doivent avoir une description');
      return;
    }

    try {
      const campaignData = {
        ...formData,
        startDate: new Date(formData.startDate).toISOString(),
        endDate: new Date(formData.endDate).toISOString(),
      };

      if (campaign) {
        await updateCampaignMutation.mutateAsync({
          id: campaign.id,
          data: campaignData,
        });

        // Gérer la mise à jour des conditions en mode édition
        const existingIds = (existingConditions || []).map((c) => c.id);
        const currentIds = unlockConditions
          .filter((c) => c.id)
          .map((c) => c.id!);

        // 1. Créer les nouvelles conditions (sans id)
        const newConditions = unlockConditions.filter((c) => !c.id);
        if (newConditions.length > 0) {
          await createUnlockConditionsMutation.mutateAsync({
            campaignId: campaign.id,
            conditions: newConditions.map((c) => ({
              description: c.description,
              displayOrder: c.displayOrder,
            })),
          });
        }

        // 2. Mettre à jour les conditions modifiées
        const conditionsToUpdate = unlockConditions.filter((c) => {
          if (!c.id) return false;
          const existing = existingConditions?.find((e) => e.id === c.id);
          return (
            existing &&
            (existing.description !== c.description ||
              existing.displayOrder !== c.displayOrder)
          );
        });
        for (const condition of conditionsToUpdate) {
          await updateUnlockConditionMutation.mutateAsync({
            conditionId: condition.id!,
            description: condition.description,
            displayOrder: condition.displayOrder,
          });
        }

        // 3. Supprimer les conditions qui ont été retirées
        const conditionsToDelete = existingIds.filter(
          (id) => !currentIds.includes(id),
        );
        for (const conditionId of conditionsToDelete) {
          await deleteUnlockConditionMutation.mutateAsync(conditionId);
        }
      } else {
        // Créer la campagne
        const newCampaign =
          await createCampaignMutation.mutateAsync(campaignData);

        // Créer les conditions de déblocage si on a un campaignId
        if (newCampaign?.id && unlockConditions.length > 0) {
          await createUnlockConditionsMutation.mutateAsync({
            campaignId: newCampaign.id,
            conditions: unlockConditions.map((c) => ({
              description: c.description,
              displayOrder: c.displayOrder,
            })),
          });
        }

        // Uploader la vidéo si fichier sélectionné
        if (newCampaign?.id && videoFile) {
          await uploadVideoMutation.mutateAsync({
            campaignId: newCampaign.id,
            file: videoFile,
          });
        }
      }

      // Gérer la vidéo en mode édition
      if (campaign) {
        // Supprimer la vidéo existante si demandé
        if (shouldDeleteVideo && campaign.presentationVideoUrl) {
          await deleteVideoMutation.mutateAsync(campaign.id);
        }
        // Uploader une nouvelle vidéo si fichier sélectionné
        else if (videoFile) {
          await uploadVideoMutation.mutateAsync({
            campaignId: campaign.id,
            file: videoFile,
          });
        }
      }

      onSuccess();
      onClose();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Erreur lors de la sauvegarde',
      );
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleStartDateChange = (value: string) => {
    setFormData((prev) => {
      const newFormData = { ...prev, startDate: value };

      // Si une date de début est sélectionnée, mettre automatiquement la date de fin au lendemain minimum
      if (value) {
        const startDate = new Date(value);
        const nextDay = new Date(startDate);
        nextDay.setDate(startDate.getDate() + 1);
        const nextDayString = nextDay.toISOString().split('T')[0];

        // Si aucune date de fin n'est définie ou si la date de fin est antérieure à la nouvelle date minimum
        if (!prev.endDate || prev.endDate <= value) {
          newFormData.endDate = nextDayString;
        }
      }

      return newFormData;
    });
  };

  // Calculer la date minimum pour le champ date de fin
  const getMinEndDate = () => {
    if (formData.startDate) {
      const startDate = new Date(formData.startDate);
      const nextDay = new Date(startDate);
      nextDay.setDate(startDate.getDate() + 1);
      return nextDay.toISOString().split('T')[0];
    }
    return '';
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg">
      <ModalContent>
        <ModalHeader>
          <h2 className="text-xl font-semibold text-gray-900">
            {campaign ? 'Modifier la campagne' : 'Nouvelle campagne'}
          </h2>
        </ModalHeader>
        <form onSubmit={handleSubmit}>
          <ModalBody className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nom de la campagne *
              </label>
              <Input
                value={formData.name}
                onChange={(e) => handleChange('name', e.target.value)}
                placeholder="Ex: Défis Happy Team 2025"
                required
              />
            </div>

            <Textarea
              label="Description"
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
              placeholder="Description de la campagne..."
              rows={3}
            />

            {/* Vidéo de présentation */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Vidéo de présentation (optionnel)
              </label>
              <CampaignVideoUpload
                campaignId={campaign?.id}
                videoUrl={
                  shouldDeleteVideo ? null : campaign?.presentationVideoUrl
                }
                onVideoChange={(file) => {
                  setVideoFile(file);
                  setShouldDeleteVideo(false);
                }}
                onDeleteExisting={() => {
                  setShouldDeleteVideo(true);
                  setVideoFile(null);
                }}
                disabled={isLoading}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Date de début *
                </label>
                <Input
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => handleStartDateChange(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Date de fin *
                </label>
                <Input
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => handleChange('endDate', e.target.value)}
                  min={getMinEndDate()}
                  required
                />
              </div>
            </div>

            {/* Conditions de déblocage */}
            <div className="space-y-0 -mx-2">
              <UnlockConditionsManager
                conditions={unlockConditions}
                onChange={setUnlockConditions}
                minConditions={0}
                maxConditions={10}
              />
            </div>

            <Select
              label="Statut"
              value={formData.status}
              onChange={(e) => handleChange('status', e.target.value)}
              options={[
                { value: 'draft', label: 'Brouillon' },
                { value: 'active', label: 'Active' },
                { value: 'completed', label: 'Terminée' },
                { value: 'cancelled', label: 'Annulée' },
              ]}
            />

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            )}
          </ModalBody>
          <ModalFooter>
            <Button
              type="button"
              variant="ghost"
              color="default"
              onClick={onClose}
              disabled={isLoading}
              className="flex-1 border border-gray-300 text-gray-700 hover:bg-gray-50"
            >
              Annuler
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
              isLoading={isLoading}
              className="flex-1 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600"
            >
              {isLoading ? 'Sauvegarde...' : campaign ? 'Modifier' : 'Créer'}
            </Button>
          </ModalFooter>
        </form>
      </ModalContent>
    </Modal>
  );
}
