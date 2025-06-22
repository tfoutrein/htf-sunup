'use client';

import { useState, useEffect } from 'react';
import { Challenge, Action } from '@/types/campaigns';
import { campaignService } from '@/services/campaigns';
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
  });
  const [actions, setActions] = useState<Partial<Action>[]>([]);
  const [editingActionIndex, setEditingActionIndex] = useState<number | null>(
    null,
  );
  const [showingActionForm, setShowingActionForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
      });
      // TODO: Load existing actions if editing
      setActions([]);
    } else {
      setFormData({
        title: '',
        description: '',
      });
      setActions([]);
    }
    setEditingActionIndex(null);
    setShowingActionForm(false);
    setError(null);
  }, [challenge, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (actions.length === 0) {
      setError('Vous devez créer au moins une action pour ce défi');
      setLoading(false);
      return;
    }

    try {
      const challengeData = {
        campaignId,
        date: challenge ? challenge.date.split('T')[0] : selectedDate!,
        title: formData.title,
        description: formData.description,
      };

      let result: Challenge;
      if (challenge) {
        result = await campaignService.updateChallenge(
          challenge.id,
          challengeData,
        );
      } else {
        result = await campaignService.createChallenge(challengeData);

        // Créer les actions pour le nouveau défi
        for (const [index, action] of actions.entries()) {
          console.log('Creating action:', {
            challengeId: result.id,
            type: action.type,
            title: action.title,
            description: action.description || '',
            order: action.order || index + 1,
            pointsValue: action.pointsValue || 10,
          });

          await campaignService.createAction({
            challengeId: result.id,
            type: action.type!,
            title: action.title!,
            description: action.description || '',
            order: action.order || index + 1,
            pointsValue: action.pointsValue || 10,
          });
        }
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
            ? { ...actionData, order: editingActionIndex + 1 }
            : action,
        ),
      );
    } else {
      // Ajouter une nouvelle action
      const newAction = { ...actionData, order: actions.length + 1 };
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
                    variant="outline"
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
                    variant="outline"
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
                                variant="outline"
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
                                  {action.pointsValue} points - Position{' '}
                                  {action.order}
                                </p>
                              </div>
                            </div>
                            <div className="flex gap-1">
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => handleEditAction(index)}
                                disabled={showingActionForm}
                              >
                                Modifier
                              </Button>
                              <Button
                                type="button"
                                variant="outline"
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
              variant="outline"
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
