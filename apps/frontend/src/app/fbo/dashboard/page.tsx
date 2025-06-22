'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Card,
  CardHeader,
  CardBody,
  Button,
  Badge,
  Progress,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Input,
} from '@/components/ui';
import { Chip, useDisclosure } from '@heroui/react';
import {
  SunIcon,
  CheckCircleIcon,
  ClockIcon,
  CameraIcon,
  StarIcon,
  TrophyIcon,
  CalendarDaysIcon,
} from '@heroicons/react/24/outline';
import { getUser, getToken, logout } from '@/utils/auth';
import { campaignService } from '@/services/campaigns';
import { Challenge, Action, Campaign } from '@/types/campaigns';

interface User {
  id: number;
  name: string;
  email: string;
  role: string;
}

interface UserAction {
  id: number;
  userId: number;
  actionId: number;
  challengeId: number;
  completed: boolean;
  completedAt: string | null;
  proofUrl: string | null;
  action?: Action;
}

const actionTypeConfig = {
  vente: {
    label: 'Vente',
    color: 'success' as const,
    icon: '💰',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200',
  },
  recrutement: {
    label: 'Recrutement',
    color: 'primary' as const,
    icon: '🤝',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
  },
  reseaux_sociaux: {
    label: 'Réseaux Sociaux',
    color: 'secondary' as const,
    icon: '📱',
    bgColor: 'bg-purple-50',
    borderColor: 'border-purple-200',
  },
};

export default function FBODashboard() {
  const [user, setUser] = useState<User | null>(null);
  const [activeCampaign, setActiveCampaign] = useState<Campaign | null>(null);
  const [todayChallenge, setTodayChallenge] = useState<Challenge | null>(null);
  const [challengeActions, setChallengeActions] = useState<Action[]>([]);
  const [userActions, setUserActions] = useState<UserAction[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAction, setSelectedAction] = useState<{
    userAction?: UserAction;
    action: Action;
  } | null>(null);
  const [proofUrl, setProofUrl] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const router = useRouter();

  const today = new Date().toISOString().split('T')[0];

  useEffect(() => {
    const userData = getUser();
    const token = getToken();

    if (!userData || !token) {
      router.push('/login');
      return;
    }

    if (userData.role !== 'fbo') {
      router.push('/login');
      return;
    }

    setUser(userData);
    fetchTodayData();
  }, [router]);

  const fetchTodayData = async () => {
    try {
      setLoading(true);

      // Récupérer les campagnes actives
      const campaigns = await campaignService.getActiveCampaigns();
      if (campaigns.length === 0) {
        setLoading(false);
        return;
      }

      const campaign = campaigns[0]; // Prendre la première campagne active
      setActiveCampaign(campaign);

      // Récupérer les défis d'aujourd'hui
      const todayChallenges = await campaignService.getTodayChallenges();
      if (todayChallenges.length === 0) {
        setLoading(false);
        return;
      }

      const challenge = todayChallenges[0]; // Prendre le premier défi d'aujourd'hui
      setTodayChallenge(challenge);

      // Récupérer les actions du défi
      const actions = await campaignService.getChallengeActions(challenge.id);
      setChallengeActions(actions);

      // Récupérer les actions utilisateur pour ce défi
      await fetchUserActionsForChallenge(challenge.id);
    } catch (error) {
      console.error('Erreur lors du chargement des données:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserActionsForChallenge = async (challengeId: number) => {
    try {
      const token = getToken();
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/user-actions/challenge/${challengeId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (response.ok) {
        const data = await response.json();
        setUserActions(data);
      }
    } catch (error) {
      console.error(
        'Erreur lors du chargement des actions utilisateur:',
        error,
      );
    }
  };

  const handleCompleteAction = (action: Action, userAction?: UserAction) => {
    setSelectedAction({ action, userAction });
    setProofUrl(userAction?.proofUrl || '');
    onOpen();
  };

  const submitCompletion = async () => {
    if (!selectedAction || !todayChallenge) return;

    setSubmitting(true);
    try {
      const token = getToken();

      if (selectedAction.userAction) {
        // Mettre à jour une action existante
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/user-actions/${selectedAction.userAction.id}`,
          {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              completed: true,
              proofUrl,
            }),
          },
        );

        if (!response.ok) {
          throw new Error('Erreur lors de la mise à jour');
        }
      } else {
        // Créer une nouvelle action utilisateur
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/user-actions`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              actionId: selectedAction.action.id,
              challengeId: todayChallenge.id,
              completed: true,
              proofUrl,
            }),
          },
        );

        if (!response.ok) {
          throw new Error('Erreur lors de la création');
        }
      }

      // Rafraîchir les données
      await fetchUserActionsForChallenge(todayChallenge.id);
      onClose();
    } catch (error) {
      console.error('Erreur lors de la soumission:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  // Fonction pour vérifier si une action est complétée
  const isActionCompleted = (action: Action) => {
    return userActions.some((ua) => ua.actionId === action.id && ua.completed);
  };

  // Fonction pour récupérer l'action utilisateur d'une action
  const getUserAction = (action: Action) => {
    return userActions.find((ua) => ua.actionId === action.id);
  };

  const completedCount = challengeActions.filter((action) =>
    isActionCompleted(action),
  ).length;
  const totalCount = challengeActions.length;
  const completionPercentage =
    totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-50 flex items-center justify-center">
        <div className="text-center">
          <SunIcon className="w-12 h-12 text-orange-400 animate-pulse mx-auto mb-4" />
          <p className="text-gray-600">Chargement de tes défis...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-100">
      {/* Header - Mobile First */}
      <div className="bg-gradient-to-r from-orange-400 to-amber-400 text-white p-4 sm:p-6 shadow-lg">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-0">
          <div className="min-w-0 flex-1">
            <h1 className="text-xl sm:text-2xl font-bold flex items-center gap-2">
              <SunIcon className="w-6 h-6 sm:w-8 sm:h-8 flex-shrink-0" />
              <span className="truncate">
                Salut {user?.name?.split(' ')[0]} ! ☀️
              </span>
            </h1>
            <p className="text-orange-100 text-sm sm:text-base">
              {activeCampaign ? activeCampaign.name : "Tes défis t'attendent"}
            </p>
            {todayChallenge && (
              <div className="flex items-center gap-2 mt-1">
                <CalendarDaysIcon className="w-4 h-4" />
                <span className="text-orange-100 text-xs">
                  Défi du jour : {todayChallenge.title}
                </span>
              </div>
            )}
          </div>
          <Button
            variant="flat"
            className="bg-white/20 text-white hover:bg-white/30 w-full sm:w-auto"
            onPress={handleLogout}
            size="sm"
          >
            Déconnexion
          </Button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-4 sm:p-6">
        {/* Progress Section - Mobile First */}
        <Card className="mb-4 sm:mb-6 bg-white/80 backdrop-blur-sm shadow-lg border-0">
          <CardBody className="p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-2 sm:gap-0">
              <h2 className="text-lg sm:text-xl font-semibold text-gray-800">
                Progression du jour
              </h2>
              <div className="flex items-center gap-2">
                <TrophyIcon className="w-4 h-4 sm:w-5 sm:h-5 text-amber-500" />
                <span className="text-xs sm:text-sm font-medium text-gray-600">
                  {completedCount}/{totalCount} défis
                </span>
              </div>
            </div>

            <Progress
              value={completionPercentage}
              className="mb-3 sm:mb-4"
              classNames={{
                indicator: 'bg-gradient-to-r from-orange-400 to-amber-400',
              }}
            />

            <div className="flex justify-between text-xs sm:text-sm text-gray-600">
              <span>Continue comme ça ! 🔥</span>
              <span>{Math.round(completionPercentage)}% complété</span>
            </div>

            {completionPercentage === 100 && (
              <div className="mt-3 sm:mt-4 p-3 sm:p-4 bg-gradient-to-r from-green-100 to-emerald-100 rounded-xl text-center">
                <StarIcon className="w-6 h-6 sm:w-8 sm:h-8 text-yellow-500 mx-auto mb-2" />
                <p className="text-green-800 font-semibold text-sm sm:text-base">
                  🎉 Félicitations ! Tu as terminé tous tes défis du jour !
                </p>
              </div>
            )}
          </CardBody>
        </Card>

        {/* Actions Grid - Mobile First */}
        <div className="grid gap-4 sm:gap-6">
          {!activeCampaign ? (
            <Card className="bg-white/80 backdrop-blur-sm">
              <CardBody className="text-center p-6 sm:p-8">
                <ClockIcon className="w-12 h-12 sm:w-16 sm:h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg sm:text-xl font-semibold text-gray-600 mb-2">
                  Aucune campagne active
                </h3>
                <p className="text-gray-500 text-sm sm:text-base">
                  Les nouvelles campagnes arriveront bientôt ! ☀️
                </p>
              </CardBody>
            </Card>
          ) : !todayChallenge ? (
            <Card className="bg-white/80 backdrop-blur-sm">
              <CardBody className="text-center p-6 sm:p-8">
                <ClockIcon className="w-12 h-12 sm:w-16 sm:h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg sm:text-xl font-semibold text-gray-600 mb-2">
                  Pas de défi aujourd'hui
                </h3>
                <p className="text-gray-500 text-sm sm:text-base">
                  Profite de cette journée libre ! ☀️
                </p>
              </CardBody>
            </Card>
          ) : challengeActions.length === 0 ? (
            <Card className="bg-white/80 backdrop-blur-sm">
              <CardBody className="text-center p-6 sm:p-8">
                <ClockIcon className="w-12 h-12 sm:w-16 sm:h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg sm:text-xl font-semibold text-gray-600 mb-2">
                  Aucune action programmée
                </h3>
                <p className="text-gray-500 text-sm sm:text-base">
                  Les actions du défi arrivent bientôt ! ☀️
                </p>
              </CardBody>
            </Card>
          ) : (
            challengeActions
              .sort((a, b) => a.order - b.order)
              .map((action) => {
                const config = actionTypeConfig[action.type];
                const userAction = getUserAction(action);
                const completed = isActionCompleted(action);

                return (
                  <Card
                    key={action.id}
                    className={`${config.bgColor} ${config.borderColor} border-2 shadow-lg transition-all duration-200 hover:shadow-xl ${completed ? 'opacity-75' : ''}`}
                  >
                    <CardHeader className="pb-2 p-4 sm:p-6 sm:pb-2">
                      <div className="flex flex-col sm:flex-row justify-between items-start w-full gap-3 sm:gap-0">
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          <span className="text-xl sm:text-2xl flex-shrink-0">
                            {config.icon}
                          </span>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <Chip
                                color={config.color}
                                variant="flat"
                                size="sm"
                                className="text-xs"
                              >
                                {config.label}
                              </Chip>
                              <span className="text-xs text-gray-500">
                                Action {action.order}
                              </span>
                            </div>
                            <h3 className="text-base sm:text-lg font-semibold text-gray-800 line-clamp-2">
                              {action.title}
                            </h3>
                          </div>
                        </div>
                        {completed && (
                          <Badge
                            color="success"
                            variant="flat"
                            className="text-xs w-fit"
                          >
                            <CheckCircleIcon className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                            Terminé
                          </Badge>
                        )}
                      </div>
                    </CardHeader>
                    <CardBody className="pt-0 p-4 sm:p-6 sm:pt-0">
                      <p className="text-gray-600 mb-4 text-sm sm:text-base line-clamp-3">
                        {action.description}
                      </p>

                      {completed ? (
                        <div className="flex items-center gap-2 text-green-600">
                          <CheckCircleIcon className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
                          <span className="text-xs sm:text-sm">
                            Complété le{' '}
                            {userAction?.completedAt
                              ? new Date(
                                  userAction.completedAt,
                                ).toLocaleDateString('fr-FR')
                              : ''}
                          </span>
                        </div>
                      ) : (
                        <Button
                          onPress={() =>
                            handleCompleteAction(action, userAction)
                          }
                          className="bg-gradient-to-r from-orange-400 to-amber-400 text-white font-semibold shadow-md hover:shadow-lg transition-all duration-200 w-full sm:w-auto"
                          startContent={<CameraIcon className="w-4 h-4" />}
                          size="sm"
                        >
                          <span className="hidden sm:inline">
                            Marquer comme terminé
                          </span>
                          <span className="sm:hidden">Terminé</span>
                        </Button>
                      )}
                    </CardBody>
                  </Card>
                );
              })
          )}
        </div>
      </div>

      {/* Completion Modal - Mobile First */}
      <Modal isOpen={isOpen} onClose={onClose} size="md">
        <ModalContent>
          <ModalHeader className="text-lg sm:text-xl font-semibold p-4 sm:p-6">
            Confirmer l'action ✨
          </ModalHeader>
          <ModalBody className="p-4 sm:p-6 pt-0">
            <p className="text-gray-600 mb-4 text-sm sm:text-base">
              Super ! Tu as terminé :{' '}
              <strong>{selectedAction?.action.title}</strong>
            </p>
            <Input
              label="Lien de preuve (optionnel)"
              placeholder="https://... (photo, vidéo, lien)"
              value={proofUrl}
              onValueChange={setProofUrl}
              variant="bordered"
              description="Partage un lien vers une photo, vidéo ou autre preuve de ton action"
              size="sm"
            />
          </ModalBody>
          <ModalFooter className="p-4 sm:p-6 pt-0">
            <Button
              variant="flat"
              onPress={onClose}
              disabled={submitting}
              size="sm"
              className="w-full sm:w-auto"
            >
              Annuler
            </Button>
            <Button
              className="bg-gradient-to-r from-orange-400 to-amber-400 text-white w-full sm:w-auto"
              onPress={submitCompletion}
              isLoading={submitting}
              size="sm"
            >
              Confirmer 🎉
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
}
