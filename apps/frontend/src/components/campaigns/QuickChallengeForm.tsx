'use client';

import { useState, useEffect } from 'react';
import { Challenge, Action } from '@/types/campaigns';
import { useCreateChallenge, useUpdateChallenge } from '@/hooks/useChallenges';
import { useCreateAction, useChallengeActions } from '@/hooks/useActions';
import {
  Button,
  Input,
  Textarea,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Card,
  Badge,
} from '@/components/ui';
import ActionForm from './ActionForm';

interface QuickChallengeFormProps {
  challenge?: Challenge | null;
  campaignId: number;
  selectedDate?: string; // Date présélectionnée depuis le calendrier
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (challenge: Challenge) => void;
}

export default function QuickChallengeForm({
  challenge,
  campaignId,
  selectedDate,
  isOpen,
  onClose,
  onSuccess,
}: QuickChallengeFormProps) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    valueInEuro: '0.50',
  });
  const [actions, setActions] = useState<Partial<Action>[]>([]);
  const [editingActionIndex, setEditingActionIndex] = useState<number | null>(
    null,
  );
  const [showingActionForm, setShowingActionForm] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // TanStack Query hooks
  const createChallengeMutation = useCreateChallenge();
  const updateChallengeMutation = useUpdateChallenge();
  const createActionMutation = useCreateAction();

  // Récupérer les actions existantes si on édite un défi
  const { data: existingActions = [], isLoading: existingActionsLoading } =
    useChallengeActions(challenge?.id);

  const loading =
    createChallengeMutation.isPending ||
    updateChallengeMutation.isPending ||
    createActionMutation.isPending ||
    existingActionsLoading;

  const actionTypes = [
    { key: 'vente', label: 'Vente', icon: '💰' },
    { key: 'recrutement', label: 'Recrutement', icon: '🤝' },
    { key: 'reseaux_sociaux', label: 'Réseaux Sociaux', icon: '📱' },
  ];

  useEffect(() => {
    if (challenge) {
      setFormData({
        title: challenge.title,
        description: challenge.description || '',
        valueInEuro: challenge.valueInEuro || '0.50',
      });
      // Charger les actions existantes lors de l'édition
      if (existingActions.length > 0) {
        const formattedActions = existingActions.map((action) => ({
          id: action.id,
          type: action.type,
          title: action.title,
          description: action.description,
          order: action.order,
          challengeId: action.challengeId,
          createdAt: action.createdAt,
          updatedAt: action.updatedAt,
        }));
        setActions(formattedActions);
      } else {
        setActions([]);
      }
    } else {
      setFormData({
        title: '',
        description: '',
        valueInEuro: '0.50',
      });
      setActions([]);
    }
    setEditingActionIndex(null);
    setShowingActionForm(false);
    setError(null);
  }, [challenge, isOpen, existingActions]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (actions.length === 0) {
      setError('Vous devez créer au moins une action pour ce défi');
      return;
    }

    try {
      const challengeData = {
        campaignId,
        date: challenge ? challenge.date.split('T')[0] : selectedDate!,
        title: formData.title,
        description: formData.description,
        valueInEuro: formData.valueInEuro,
      };

      let result: Challenge;
      if (challenge) {
        result = await updateChallengeMutation.mutateAsync({
          id: challenge.id,
          data: challengeData,
        });
      } else {
        result = await createChallengeMutation.mutateAsync(challengeData);

        // Créer les actions pour le nouveau défi
        for (let index = 0; index < actions.length; index++) {
          const action = actions[index];
          console.log('Creating action:', {
            challengeId: result.id,
            type: action.type,
            title: action.title,
            description: action.description || '',
            order: action.order || index + 1,
          });

          await createActionMutation.mutateAsync({
            challengeId: result.id,
            type: action.type!,
            title: action.title!,
            description: action.description || '',
            order: action.order || index + 1,
          });
        }
      }

      onSuccess(result);
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

  const handleAddAction = () => {
    if (actions.length >= 6) return;
    setEditingActionIndex(null);
    setShowingActionForm(true);
  };

  const handleEditAction = (index: number) => {
    setEditingActionIndex(index);
    setShowingActionForm(true);
  };

  const handleSaveAction = (actionData: Partial<Action>) => {
    if (editingActionIndex !== null) {
      // Modifier une action existante
      setActions((prev) =>
        prev.map((action, index) =>
          index === editingActionIndex
            ? { ...actionData, order: action.order || editingActionIndex + 1 }
            : action,
        ),
      );
    } else {
      // Ajouter une nouvelle action - calculer la première position libre
      const usedPositions = actions.map((a) => a.order || 0);
      let nextPosition = 1;
      while (usedPositions.includes(nextPosition) && nextPosition <= 6) {
        nextPosition++;
      }

      const newAction: Partial<Action> = {
        ...actionData,
        type: actionData.type as 'vente' | 'recrutement' | 'reseaux_sociaux',
        order: nextPosition,
      };
      setActions((prev) => [...prev, newAction]);
    }
    setShowingActionForm(false);
    setEditingActionIndex(null);
  };

  const handleCancelAction = () => {
    setShowingActionForm(false);
    setEditingActionIndex(null);
  };

  const handleDeleteAction = (index: number) => {
    setActions((prev) => prev.filter((_, i) => i !== index));
  };

  const getActionTypeInfo = (type: string) => {
    return (
      actionTypes.find((at) => at.key === type) || {
        key: type,
        label: type,
        icon: '❓',
      }
    );
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('fr-FR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  const displayDate = challenge ? challenge.date.split('T')[0] : selectedDate;

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="2xl">
      <ModalContent>
        <ModalHeader>
          <div>
            <h2 className="text-xl font-semibold">
              {challenge ? 'Modifier le défi' : 'Nouveau défi'}
            </h2>
            {displayDate && (
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                {formatDate(displayDate)}
              </p>
            )}
          </div>
        </ModalHeader>
        <form onSubmit={handleSubmit}>
          <ModalBody className="space-y-6 max-h-96 overflow-y-auto">
            {/* Informations du défi */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                Informations du défi
              </h3>

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
                rows={3}
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
            </div>

            {/* Actions du défi */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                  Actions du défi ({actions.length}/6)
                </h3>
                {actions.length < 6 && !showingActionForm && (
                  <Button
                    type="button"
                    variant="bordered"
                    onClick={handleAddAction}
                    size="sm"
                  >
                    Ajouter une action
                  </Button>
                )}
              </div>

              {showingActionForm && (
                <ActionForm
                  action={
                    editingActionIndex !== null
                      ? actions[editingActionIndex]
                      : undefined
                  }
                  onSave={handleSaveAction}
                  onCancel={handleCancelAction}
                  order={
                    editingActionIndex !== null
                      ? editingActionIndex + 1
                      : actions.length + 1
                  }
                />
              )}

              {actions.length === 0 && !showingActionForm ? (
                <Card className="p-6 text-center border-dashed">
                  <p className="text-gray-500 dark:text-gray-400 mb-3">
                    Aucune action définie pour ce défi
                  </p>
                  <Button
                    type="button"
                    variant="bordered"
                    onClick={handleAddAction}
                    size="sm"
                  >
                    Créer la première action
                  </Button>
                </Card>
              ) : (
                actions.length > 0 && (
                  <div className="space-y-3">
                    {actions.map((action, index) => {
                      const typeInfo = getActionTypeInfo(action.type!);
                      return (
                        <Card key={index} className="p-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <Badge
                                variant="bordered"
                                className="flex items-center gap-1"
                              >
                                <span>{typeInfo.icon}</span>
                                <span>{typeInfo.label}</span>
                              </Badge>
                              <div>
                                <h4 className="font-medium text-sm">
                                  {action.title}
                                </h4>
                                <p className="text-xs text-gray-600 dark:text-gray-400">
                                  Position {action.order}
                                </p>
                              </div>
                            </div>
                            <div className="flex gap-1">
                              <Button
                                type="button"
                                variant="bordered"
                                size="sm"
                                onClick={() => handleEditAction(index)}
                                disabled={showingActionForm}
                              >
                                Modifier
                              </Button>
                              <Button
                                type="button"
                                variant="bordered"
                                size="sm"
                                onClick={() => handleDeleteAction(index)}
                                className="text-red-600 hover:text-red-700"
                                disabled={showingActionForm}
                              >
                                Supprimer
                              </Button>
                            </div>
                          </div>
                        </Card>
                      );
                    })}
                  </div>
                )
              )}
            </div>

            {error && (
              <div className="p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg">
                <p className="text-red-600 dark:text-red-400 text-sm">
                  {error}
                </p>
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
              disabled={loading || showingActionForm}
              className="flex-1 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600"
            >
              {loading
                ? 'Sauvegarde...'
                : challenge
                  ? 'Modifier'
                  : 'Créer le défi'}
            </Button>
          </ModalFooter>
        </form>
      </ModalContent>
    </Modal>
  );
}
