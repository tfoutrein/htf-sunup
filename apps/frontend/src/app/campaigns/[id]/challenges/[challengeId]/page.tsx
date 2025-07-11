'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { isAuthenticated, getUser } from '@/utils/auth';
import {
  Campaign,
  Challenge,
  Action,
  ChallengeWithActions,
} from '@/types/campaigns';
import { useCampaign } from '@/hooks/useCampaigns';
import {
  useChallenges,
  useChallengeWithActions,
  useUpdateChallenge,
} from '@/hooks/useChallenges';
import {
  useCreateAction,
  useDeleteAction,
  useUpdateAction,
} from '@/hooks/useActions';
import {
  Card,
  Button,
  Input,
  CustomCalendar,
  Textarea,
  Select,
  Badge,
  Slider,
} from '@/components/ui';

const actionTypes = [
  { key: 'vente', label: 'Vente', icon: '💰' },
  { key: 'recrutement', label: 'Recrutement', icon: '🤝' },
  { key: 'reseaux_sociaux', label: 'Réseaux Sociaux', icon: '📱' },
];

function ChallengeEditPageContent() {
  const router = useRouter();
  const params = useParams();
  const campaignId = parseInt(params.id as string);
  const challengeId = parseInt(params.challengeId as string);

  const [user, setUser] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  // TanStack Query hooks
  const {
    data: campaign,
    isLoading: campaignLoading,
    error: campaignError,
  } = useCampaign(campaignId);
  const {
    data: challenge,
    isLoading: challengeLoading,
    error: challengeError,
  } = useChallengeWithActions(challengeId);
  const { data: existingChallenges = [], isLoading: challengesLoading } =
    useChallenges(campaignId);
  const updateChallengeMutation = useUpdateChallenge();
  const createActionMutation = useCreateAction();
  const deleteActionMutation = useDeleteAction();
  const updateActionMutation = useUpdateAction();

  const loading = campaignLoading || challengeLoading || challengesLoading;
  const submitting =
    updateChallengeMutation.isPending ||
    createActionMutation.isPending ||
    deleteActionMutation.isPending ||
    updateActionMutation.isPending;

  // Formulaire principal du défi
  const [challengeData, setChallengeData] = useState({
    date: '',
    title: '',
    description: '',
    valueInEuro: '0.50',
  });

  // Gestion des actions
  const [actions, setActions] = useState<Partial<Action>[]>([]);
  const [showActionForm, setShowActionForm] = useState(false);
  const [editingActionIndex, setEditingActionIndex] = useState<number | null>(
    null,
  );
  const [actionFormData, setActionFormData] = useState({
    type: 'vente',
    title: '',
    description: '',
  });

  useEffect(() => {
    const checkAuth = () => {
      if (!isAuthenticated()) {
        router.push('/login');
        return;
      }

      const currentUser = getUser();
      if (!currentUser || currentUser.role !== 'manager') {
        // Rediriger vers le dashboard approprié au lieu de '/'
        if (currentUser?.role === 'fbo') {
          router.push('/fbo/dashboard');
        } else {
          router.push('/login');
        }
        return;
      }

      setUser(currentUser);
    };

    checkAuth();
  }, [campaignId, challengeId, router]);

  // Populate form when challenge data is loaded
  useEffect(() => {
    if (challenge) {
      setChallengeData({
        date: challenge.date.split('T')[0],
        title: challenge.title,
        description: challenge.description || '',
        valueInEuro: challenge.valueInEuro || '0.50',
      });

      if (challenge.actions) {
        setActions(challenge.actions.sort((a, b) => a.order - b.order));
      }
    }
  }, [challenge]);

  // Handle errors
  useEffect(() => {
    if (campaignError || challengeError) {
      setError(
        (campaignError || challengeError) instanceof Error
          ? (campaignError || challengeError)!.message
          : 'Erreur lors du chargement',
      );
    }
  }, [campaignError, challengeError]);

  // Calculer les dates disponibles (exclure la date actuelle du défi)
  const getAvailableDates = () => {
    if (!campaign || !challenge) return { min: '', max: '', disabledDates: [] };

    const occupiedDates = existingChallenges
      .filter((c) => c.id !== challengeId) // Exclure le défi actuel
      .map((c) => c.date.split('T')[0]);

    return {
      min: campaign.startDate.split('T')[0],
      max: campaign.endDate.split('T')[0],
      disabledDates: occupiedDates,
    };
  };

  const { min, max, disabledDates } = getAvailableDates();

  const handleChallengeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation des dates
    const selectedDate = challengeData.date;
    if (disabledDates.includes(selectedDate)) {
      setError(
        'Cette date a déjà un défi associé. Veuillez choisir une autre date.',
      );
      return;
    }

    if (actions.length === 0) {
      setError('Vous devez avoir au moins une action pour ce défi.');
      return;
    }

    try {
      // Mettre à jour le défi
      const updatedChallenge = await updateChallengeMutation.mutateAsync({
        id: challengeId,
        data: {
          date: challengeData.date,
          title: challengeData.title,
          description: challengeData.description,
          valueInEuro: challengeData.valueInEuro,
        },
      });

      // Gestion intelligente des actions
      const existingActions = challenge?.actions || [];
      const currentActions = actions;

      // 1. Identifier les actions à supprimer (existantes mais plus dans la liste actuelle)
      const actionsToDelete = existingActions.filter(
        (existing) =>
          !currentActions.some((current) => current.id === existing.id),
      );

      // 2. Identifier les nouvelles actions (sans ID)
      const actionsToCreate = currentActions.filter((current) => !current.id);

      // 3. Identifier les actions à modifier (avec ID et différentes)
      const actionsToUpdate = currentActions.filter((current) => {
        if (!current.id) return false;
        const existing = existingActions.find((ex) => ex.id === current.id);
        if (!existing) return false;

        return (
          existing.title !== current.title ||
          existing.description !== current.description ||
          existing.type !== current.type ||
          existing.order !== current.order
        );
      });

      // Tenter de supprimer les actions supprimées (peut échouer si elles ont des userActions)
      for (const action of actionsToDelete) {
        try {
          await deleteActionMutation.mutateAsync(action.id);
        } catch (deleteError) {
          console.warn(
            `Impossible de supprimer l'action ${action.id} car elle est assignée à des utilisateurs`,
          );
          setError(
            `Impossible de supprimer l'action "${action.title}" car des FBO ont déjà travaillé dessus. ` +
              'Vous pouvez la modifier mais pas la supprimer.',
          );
          return;
        }
      }

      // Créer les nouvelles actions
      for (let index = 0; index < actionsToCreate.length; index++) {
        const action = actionsToCreate[index];
        await createActionMutation.mutateAsync({
          challengeId: challengeId,
          type: action.type!,
          title: action.title!,
          description: action.description || '',
          order: action.order || existingActions.length + index + 1,
        });
      }

      // Mettre à jour les actions modifiées
      for (const action of actionsToUpdate) {
        await updateActionMutation.mutateAsync({
          id: action.id!,
          data: {
            type: action.type!,
            title: action.title!,
            description: action.description || '',
            order: action.order!,
          },
        });
      }

      router.push(`/campaigns/${campaignId}`);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Erreur lors de la mise à jour du défi',
      );
    }
  };

  const handleChallengeChange = (field: string, value: string) => {
    setChallengeData((prev) => ({ ...prev, [field]: value }));
  };

  const handleCancel = () => {
    router.push(`/campaigns/${campaignId}`);
  };

  // Gestion des actions
  const handleAddAction = () => {
    if (actions.length >= 6) return;
    setEditingActionIndex(null);
    setActionFormData({
      type: 'vente',
      title: '',
      description: '',
    });
    setShowActionForm(true);
  };

  const handleEditAction = (index: number) => {
    const action = actions[index];
    setEditingActionIndex(index);
    setActionFormData({
      type: action.type || 'vente',
      title: action.title || '',
      description: action.description || '',
    });
    setShowActionForm(true);
  };

  const handleSaveAction = (e: React.FormEvent) => {
    e.preventDefault();

    if (!actionFormData.title.trim()) {
      return;
    }

    // Calculer la position correcte pour les nouvelles actions
    let actionOrder: number;
    if (editingActionIndex !== null) {
      // Modification d'une action existante - garder la position existante
      actionOrder =
        actions[editingActionIndex]?.order || editingActionIndex + 1;
    } else {
      // Nouvelle action - trouver la première position libre
      const usedPositions = actions.map((a) => a.order || 0);
      actionOrder = 1;
      while (usedPositions.includes(actionOrder) && actionOrder <= 6) {
        actionOrder++;
      }
    }

    const newAction: Partial<Action> = {
      ...actionFormData,
      type: actionFormData.type as 'vente' | 'recrutement' | 'reseaux_sociaux',
      order: actionOrder,
    };

    if (editingActionIndex !== null) {
      // Modifier une action existante
      setActions((prev) =>
        prev.map((action, index) =>
          index === editingActionIndex ? newAction : action,
        ),
      );
    } else {
      // Ajouter une nouvelle action
      setActions((prev) => [...prev, newAction]);
    }

    setShowActionForm(false);
    setEditingActionIndex(null);
  };

  const handleCancelAction = () => {
    setShowActionForm(false);
    setEditingActionIndex(null);
  };

  const handleDeleteAction = (index: number) => {
    setActions((prev) => prev.filter((_, i) => i !== index));
  };

  const handleActionFormChange = (field: string, value: string) => {
    setActionFormData((prev) => ({ ...prev, [field]: value }));
  };

  const getActionTypeInfo = (type: string) => {
    return actionTypes.find((at) => at.key === type) || actionTypes[0];
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500"></div>
      </div>
    );
  }

  if (error && !challenge) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-50">
        <div className="container mx-auto px-4 py-8">
          <Card className="p-8 text-center border-red-200 bg-red-50">
            <p className="text-red-600 mb-4">{error}</p>
            <Button onClick={() => router.push('/campaigns')}>
              Retour aux campagnes
            </Button>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-50">
      <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-6 sm:mb-8">
            <div className="flex items-center gap-3 mb-4">
              <Button
                variant="bordered"
                onClick={handleCancel}
                className="p-2 touch-target"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 19l-7-7 7-7"
                  />
                </svg>
              </Button>
            </div>

            <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 drop-shadow-sm mb-3 sm:mb-4">
              Modifier le défi
            </h1>

            <p className="text-gray-700 mb-4 text-mobile">
              Modifier le défi de la campagne <strong>{campaign?.name}</strong>
            </p>
          </div>

          <form
            onSubmit={handleChallengeSubmit}
            className="space-y-6 sm:space-y-8"
          >
            {/* Informations du défi */}
            <Card className="p-4 sm:p-6">
              <h2 className="text-lg sm:text-xl font-semibold mb-4 sm:mb-6 text-gray-800">
                Informations du défi
              </h2>

              <div className="space-y-4 sm:space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                  <div className="lg:col-span-1">
                    <CustomCalendar
                      label="Date du défi *"
                      value={challengeData.date}
                      onChange={(date) => handleChallengeChange('date', date)}
                      min={min}
                      max={max}
                      disabledDates={disabledDates}
                      required
                    />
                  </div>
                </div>

                <div>
                  <Input
                    label="Titre du défi *"
                    value={challengeData.title}
                    onChange={(e) =>
                      handleChallengeChange('title', e.target.value)
                    }
                    placeholder="Ex: Défi du lundi - Prospection et vente"
                    required
                  />
                </div>

                <Textarea
                  label="Description"
                  value={challengeData.description}
                  onChange={(e) =>
                    handleChallengeChange('description', e.target.value)
                  }
                  placeholder="Description détaillée du défi du jour..."
                  rows={4}
                />

                <div>
                  <Input
                    label="Valeur du défi (€) *"
                    type="number"
                    step="0.01"
                    min="0"
                    value={challengeData.valueInEuro}
                    onChange={(e) =>
                      handleChallengeChange('valueInEuro', e.target.value)
                    }
                    placeholder="0.50"
                    required
                  />
                  <p className="text-sm text-gray-600 mt-1">
                    Montant en euros versé pour la réalisation complète de ce
                    défi
                  </p>
                </div>
              </div>
            </Card>

            {/* Actions du défi */}
            <Card className="p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0 mb-4 sm:mb-6">
                <h2 className="text-lg sm:text-xl font-semibold text-gray-800">
                  Actions du défi
                </h2>
                <Button
                  type="button"
                  onClick={handleAddAction}
                  disabled={actions.length >= 6}
                  className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 touch-target w-full sm:w-auto"
                >
                  + Ajouter une action
                </Button>
              </div>

              {actions.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <svg
                    className="mx-auto h-12 w-12 text-gray-400 mb-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 4v16m8-8H4"
                    />
                  </svg>
                  <p>Aucune action créée</p>
                  <p className="text-sm">
                    Cliquez sur "Ajouter une action" pour commencer
                  </p>
                </div>
              )}

              {/* Liste des actions */}
              <div className="space-y-4">
                {actions.map((action, index) => {
                  const typeInfo = getActionTypeInfo(action.type || 'vente');
                  return (
                    <Card
                      key={index}
                      className="p-3 sm:p-4 border-l-4 border-l-amber-400"
                    >
                      <div className="sm:space-y-0 space-y-3">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex flex-wrap items-center gap-2 mb-2">
                              <span className="text-lg">{typeInfo.icon}</span>
                              <Badge color="warning" size="sm">
                                Action #{index + 1}
                              </Badge>
                              <Badge color="default" size="sm">
                                {typeInfo.label}
                              </Badge>
                            </div>
                            <h3 className="font-medium text-gray-900 mb-1 text-mobile">
                              {action.title}
                            </h3>
                            {action.description && (
                              <p className="text-sm text-gray-600 text-mobile">
                                {action.description}
                              </p>
                            )}
                          </div>
                          {/* Boutons desktop - alignés à droite */}
                          <div className="hidden sm:flex gap-2 ml-4 flex-shrink-0">
                            <Button
                              type="button"
                              variant="bordered"
                              size="sm"
                              onClick={() => handleEditAction(index)}
                              className="bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100 hover:border-blue-300"
                            >
                              ✏️ Modifier
                            </Button>
                            <Button
                              type="button"
                              variant="bordered"
                              size="sm"
                              onClick={() => handleDeleteAction(index)}
                              className="bg-red-50 text-red-700 border-red-200 hover:bg-red-100 hover:border-red-300"
                            >
                              🗑️ Supprimer
                            </Button>
                          </div>
                        </div>
                        {/* Boutons mobile - empilés */}
                        <div className="flex flex-col gap-2 sm:hidden">
                          <Button
                            type="button"
                            variant="bordered"
                            size="sm"
                            onClick={() => handleEditAction(index)}
                            className="touch-target w-full bg-blue-50 text-blue-700 border-blue-200"
                          >
                            ✏️ Modifier
                          </Button>
                          <Button
                            type="button"
                            variant="bordered"
                            size="sm"
                            onClick={() => handleDeleteAction(index)}
                            className="touch-target w-full bg-red-50 text-red-700 border-red-200"
                          >
                            🗑️ Supprimer
                          </Button>
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>

              {/* Formulaire d'ajout/modification d'action */}
              {showActionForm && (
                <Card className="p-4 border-2 border-dashed border-amber-300 mt-4 sm:mt-6">
                  <h3 className="text-lg font-medium mb-4">
                    {editingActionIndex !== null
                      ? "Modifier l'action"
                      : 'Nouvelle action'}
                  </h3>

                  <div className="space-y-4">
                    <div>
                      <Select
                        label="Type d'action *"
                        value={actionFormData.type}
                        onChange={(e) =>
                          handleActionFormChange('type', e.target.value)
                        }
                        options={actionTypes.map((type) => ({
                          value: type.key,
                          label: `${type.icon} ${type.label}`,
                        }))}
                        required
                      />
                    </div>

                    <div>
                      <Input
                        label="Titre de l'action *"
                        value={actionFormData.title}
                        onChange={(e) =>
                          handleActionFormChange('title', e.target.value)
                        }
                        placeholder="Ex: Contacter 5 nouveaux prospects"
                        required
                      />
                    </div>

                    <div>
                      <Textarea
                        label="Description"
                        value={actionFormData.description}
                        onChange={(e) =>
                          handleActionFormChange('description', e.target.value)
                        }
                        placeholder="Décrivez précisément ce que doit faire la FBO..."
                        rows={3}
                      />
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3 sm:gap-2 pt-4">
                      <Button
                        type="button"
                        variant="bordered"
                        onClick={handleCancelAction}
                        className="flex-1 touch-target"
                      >
                        Annuler
                      </Button>
                      <Button
                        type="button"
                        onClick={handleSaveAction}
                        className="flex-1 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 touch-target"
                      >
                        {editingActionIndex !== null ? 'Modifier' : 'Ajouter'}{' '}
                        l'action
                      </Button>
                    </div>
                  </div>
                </Card>
              )}
            </Card>

            {error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-600">{error}</p>
              </div>
            )}

            {/* Actions du formulaire */}
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 pt-4 sm:pt-6">
              <Button
                type="button"
                variant="bordered"
                onClick={handleCancel}
                disabled={submitting}
                className="flex-1 touch-target"
              >
                Annuler
              </Button>
              <Button
                type="submit"
                disabled={submitting || actions.length === 0}
                className="flex-1 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 touch-target"
              >
                {submitting
                  ? 'Sauvegarde en cours...'
                  : 'Sauvegarder les modifications'}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

function Loading() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500"></div>
    </div>
  );
}

export default function ChallengeEditPage() {
  return (
    <Suspense fallback={<Loading />}>
      <ChallengeEditPageContent />
    </Suspense>
  );
}
