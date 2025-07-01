'use client';

import { useState, useEffect } from 'react';
import { Challenge, Campaign } from '@/types/campaigns';
import { campaignService } from '@/services/campaigns';
import {
  Card,
  Button,
  Input,
  CustomCalendar,
  Textarea,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
} from '@/components/ui';

interface ChallengeFormProps {
  challenge?: Challenge | null;
  campaignId: number;
  campaign?: Campaign | null;
  existingChallenges?: Challenge[];
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (challenge: Challenge) => void;
}

export default function ChallengeForm({
  challenge,
  campaignId,
  campaign,
  existingChallenges = [],
  isOpen,
  onClose,
  onSuccess,
}: ChallengeFormProps) {
  const [formData, setFormData] = useState({
    date: '',
    title: '',
    description: '',
    valueInEuro: '0.50',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Calculer les dates disponibles
  const getAvailableDates = () => {
    if (!campaign) return { min: '', max: '', disabledDates: [] };

    const startDate = new Date(campaign.startDate);
    const endDate = new Date(campaign.endDate);

    // Dates déjà occupées par d'autres défis (exclure le défi en cours d'édition)
    const occupiedDates = existingChallenges
      .filter((c) => (challenge ? c.id !== challenge.id : true))
      .map((c) => c.date.split('T')[0]);

    return {
      min: campaign.startDate.split('T')[0],
      max: campaign.endDate.split('T')[0],
      disabledDates: occupiedDates,
    };
  };

  const { min, max, disabledDates } = getAvailableDates();

  useEffect(() => {
    if (challenge) {
      setFormData({
        date: challenge.date.split('T')[0],
        title: challenge.title,
        description: challenge.description || '',
        valueInEuro: challenge.valueInEuro || '0.50',
      });
    } else {
      setFormData({
        date: '',
        title: '',
        description: '',
        valueInEuro: '0.50',
      });
    }
    setError(null);
  }, [challenge, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Validation des dates
    const selectedDate = formData.date;
    if (disabledDates.includes(selectedDate)) {
      setError(
        'Cette date a déjà un défi associé. Veuillez choisir une autre date.',
      );
      setLoading(false);
      return;
    }

    try {
      const challengeData = {
        campaignId,
        date: new Date(formData.date).toISOString().split('T')[0],
        title: formData.title,
        description: formData.description,
        valueInEuro: formData.valueInEuro,
      };

      let result: Challenge;
      if (challenge) {
        result = await campaignService.updateChallenge(
          challenge.id,
          challengeData,
        );
      } else {
        result = await campaignService.createChallenge(challengeData);
      }

      onSuccess(result);
      onClose();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Erreur lors de la sauvegarde',
      );
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: string, value: string | number) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg">
      <ModalContent>
        <ModalHeader>
          <h2 className="text-xl font-semibold">
            {challenge ? 'Modifier le défi' : 'Nouveau défi'}
          </h2>
        </ModalHeader>
        <form onSubmit={handleSubmit}>
          <ModalBody className="space-y-4">
            <div>
              <CustomCalendar
                label="Date du défi *"
                value={formData.date}
                onChange={(date) => handleChange('date', date)}
                min={min}
                max={max}
                disabledDates={disabledDates}
                required
              />
            </div>

            <div>
              <Input
                label="Titre du défi *"
                value={formData.title}
                onChange={(e) => handleChange('title', e.target.value)}
                placeholder="Ex: Défi du lundi - Prospection et vente"
                required
              />
            </div>

            <Textarea
              label="Description"
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
              placeholder="Description détaillée du défi du jour..."
              rows={4}
            />

            <div>
              <Input
                label="Valeur du défi (€) *"
                type="number"
                step="0.01"
                min="0"
                value={formData.valueInEuro}
                onChange={(e) => handleChange('valueInEuro', e.target.value)}
                placeholder="0.50"
                required
              />
              <p className="text-sm text-gray-600 mt-1">
                Montant en euros versé pour la réalisation complète de ce défi
              </p>
            </div>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            )}
          </ModalBody>
          <ModalFooter>
            <Button
              type="button"
              variant="bordered"
              onClick={onClose}
              disabled={loading}
              className="flex-1"
            >
              Annuler
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="flex-1 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600"
            >
              {loading ? 'Sauvegarde...' : challenge ? 'Modifier' : 'Créer'}
            </Button>
          </ModalFooter>
        </form>
      </ModalContent>
    </Modal>
  );
}
