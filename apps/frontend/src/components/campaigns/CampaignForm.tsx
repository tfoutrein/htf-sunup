'use client';

import { useState, useEffect } from 'react';
import { Campaign } from '@/types/campaigns';
import { useCreateCampaign, useUpdateCampaign } from '@/hooks/useCampaigns';
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
  const [error, setError] = useState<string | null>(null);

  // TanStack Query mutations
  const createCampaignMutation = useCreateCampaign();
  const updateCampaignMutation = useUpdateCampaign();

  const isLoading =
    createCampaignMutation.isPending || updateCampaignMutation.isPending;

  useEffect(() => {
    if (campaign) {
      setFormData({
        name: campaign.name,
        description: campaign.description,
        startDate: campaign.startDate.split('T')[0],
        endDate: campaign.endDate.split('T')[0],
        status: campaign.status,
      });
    } else {
      setFormData({
        name: '',
        description: '',
        startDate: '',
        endDate: '',
        status: 'draft',
      });
    }
    setError(null);
  }, [campaign, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

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
      } else {
        await createCampaignMutation.mutateAsync(campaignData);
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
          <h2 className="text-xl font-semibold">
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
                placeholder="Ex: Défis de l'été 2025"
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
