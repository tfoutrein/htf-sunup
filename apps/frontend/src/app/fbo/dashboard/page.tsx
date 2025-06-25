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
import { useActiveCampaigns } from '@/hooks/useCampaigns';
import { useTodayChallenges } from '@/hooks/useChallenges';
import { useChallengeActions } from '@/hooks/useActions';
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

interface CampaignStats {
  campaign: {
    id: number;
    name: string;
    startDate: string;
    endDate: string;
  };
  stats: {
    totalChallenges: number;
    completedChallenges: number;
    challengeCompletionRate: number;
    totalActions: number;
    completedActions: number;
    actionCompletionRate: number;
    totalPointsEarned: number;
    maxPossiblePoints: number;
  };
  challengeDetails: Array<{
    challengeId: number;
    challengeTitle: string;
    challengeDate: string;
    totalActions: number;
    completedActions: number;
    isCompleted: boolean;
    percentage: number;
  }>;
}

interface UserStreaks {
  currentStreak: number;
  longestStreak: number;
  totalActiveDays: number;
  lastActivityDate: string | null;
}

interface UserBadge {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  earnedAt: string;
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
  const [userActions, setUserActions] = useState<UserAction[]>([]);
  const [campaignStats, setCampaignStats] = useState<CampaignStats | null>(
    null,
  );
  const [userStreaks, setUserStreaks] = useState<UserStreaks | null>(null);
  const [userBadges, setUserBadges] = useState<UserBadge[]>([]);

  // TanStack Query hooks
  const { data: activeCampaigns = [], isLoading: campaignsLoading } =
    useActiveCampaigns();
  const { data: todayChallenges = [], isLoading: challengesLoading } =
    useTodayChallenges();

  // Derived state
  const activeCampaign = activeCampaigns[0] || null;
  const todayChallenge = todayChallenges[0] || null;

  const { data: challengeActions = [], isLoading: actionsLoading } =
    useChallengeActions(todayChallenge?.id || 0);

  const loading = campaignsLoading || challengesLoading || actionsLoading;
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
  }, [router]);

  // Fetch user actions and gamification data when campaign/challenge data is available
  useEffect(() => {
    if (todayChallenge?.id && user) {
      fetchUserActionsForChallenge(todayChallenge.id, user);
    }
  }, [todayChallenge?.id, user]);

  useEffect(() => {
    if (activeCampaign?.id && user) {
      fetchGamificationData(activeCampaign.id, user);
    }
  }, [activeCampaign?.id, user]);

  const fetchUserActionsForChallenge = async (
    challengeId: number,
    userData?: User,
  ) => {
    const currentUser = userData || user;

    if (!currentUser) return;

    try {
      const token = getToken();
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/actions/user/${currentUser.id}/challenge/${challengeId}`,
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

  const fetchGamificationData = async (campaignId: number, userData?: User) => {
    const currentUser = userData || user;
    if (!currentUser) return;

    try {
      const token = getToken();

      // Récupérer les statistiques de campagne
      const campaignStatsResponse = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/actions/user/${currentUser.id}/campaign-stats/${campaignId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      if (campaignStatsResponse.ok) {
        const stats = await campaignStatsResponse.json();
        setCampaignStats(stats);
      }

      // Récupérer les streaks
      const streaksResponse = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/actions/user/${currentUser.id}/streaks`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      if (streaksResponse.ok) {
        const streaks = await streaksResponse.json();
        setUserStreaks(streaks);
      }

      // Récupérer les badges
      const badgesResponse = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/actions/user/${currentUser.id}/badges`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      if (badgesResponse.ok) {
        const badges = await badgesResponse.json();
        setUserBadges(badges);
      }
    } catch (error) {
      console.error(
        'Erreur lors du chargement des données de gamification:',
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
      if (activeCampaign) {
        await fetchGamificationData(activeCampaign.id);
      }
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
        {/* Gamification Section - Mobile First */}
        {campaignStats && userStreaks && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-4 sm:mb-6">
            {/* Campaign Progress Card */}
            <Card className="bg-gradient-to-br from-blue-50 to-indigo-100 border-0 shadow-lg">
              <CardBody className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-blue-900">
                    🏆 {campaignStats.campaign.name}
                  </h3>
                  <TrophyIcon className="w-5 h-5 text-blue-600" />
                </div>
                <div className="space-y-2">
                  <div className="text-center mb-2">
                    <div className="text-2xl font-bold text-blue-600">
                      {campaignStats.stats.completedChallenges}
                    </div>
                    <div className="text-xs text-blue-700">
                      défis complétés sur {campaignStats.stats.totalChallenges}
                    </div>
                  </div>
                  <Progress
                    value={campaignStats.stats.challengeCompletionRate}
                    size="sm"
                    aria-label="Progression des défis de la campagne"
                    classNames={{
                      indicator: 'bg-gradient-to-r from-blue-400 to-indigo-500',
                    }}
                  />
                  <div className="flex justify-between text-xs text-blue-600">
                    <span>🪙 {campaignStats.stats.totalPointsEarned} pts</span>
                    <span>
                      {Math.round(campaignStats.stats.challengeCompletionRate)}%
                      global
                    </span>
                  </div>
                </div>
              </CardBody>
            </Card>

            {/* Streaks Card */}
            <Card className="bg-gradient-to-br from-orange-50 to-red-100 border-0 shadow-lg">
              <CardBody className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-orange-900">
                    Séries
                  </h3>
                  <span className="text-lg">🔥</span>
                </div>
                <div className="space-y-2">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-orange-600">
                      {userStreaks.currentStreak}
                    </div>
                    <div className="text-xs text-orange-700">
                      jours consécutifs
                    </div>
                  </div>
                  <div className="flex justify-between text-xs text-orange-600">
                    <span>Record: {userStreaks.longestStreak}</span>
                    <span>Actif: {userStreaks.totalActiveDays}j</span>
                  </div>
                </div>
              </CardBody>
            </Card>

            {/* Badges Card */}
            <Card className="bg-gradient-to-br from-purple-50 to-pink-100 border-0 shadow-lg sm:col-span-2 lg:col-span-1">
              <CardBody className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-purple-900">
                    Badges
                  </h3>
                  <StarIcon className="w-5 h-5 text-purple-600" />
                </div>
                <div className="flex flex-wrap gap-2">
                  {userBadges.length > 0 ? (
                    userBadges.slice(0, 4).map((badge) => (
                      <div
                        key={badge.id}
                        className="flex items-center gap-1 bg-white/60 rounded-full px-2 py-1"
                        title={badge.description}
                      >
                        <span className="text-sm">{badge.icon}</span>
                        <span className="text-xs font-medium text-purple-800 hidden sm:inline">
                          {badge.name}
                        </span>
                      </div>
                    ))
                  ) : (
                    <div className="text-xs text-purple-600 text-center w-full">
                      Complète tes premières actions pour gagner des badges ! 🎯
                    </div>
                  )}
                  {userBadges.length > 4 && (
                    <div className="flex items-center gap-1 bg-white/60 rounded-full px-2 py-1">
                      <span className="text-xs font-medium text-purple-800">
                        +{userBadges.length - 4}
                      </span>
                    </div>
                  )}
                </div>
              </CardBody>
            </Card>
          </div>
        )}

        {/* Progress Section - Mobile First */}
        <Card className="mb-4 sm:mb-6 bg-white/80 backdrop-blur-sm shadow-lg border-0">
          <CardBody className="p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-2 sm:gap-0">
              <h2 className="text-lg sm:text-xl font-semibold text-gray-800">
                Actions du défi d'aujourd'hui
              </h2>
              <div className="flex items-center gap-2">
                <TrophyIcon className="w-4 h-4 sm:w-5 sm:h-5 text-amber-500" />
                <span className="text-xs sm:text-sm font-medium text-gray-600">
                  {completedCount}/{totalCount} actions
                </span>
              </div>
            </div>

            <Progress
              value={completionPercentage}
              className="mb-3 sm:mb-4"
              aria-label="Progression des actions du défi d'aujourd'hui"
              classNames={{
                indicator: 'bg-gradient-to-r from-orange-400 to-amber-400',
              }}
            />

            <div className="flex justify-between text-xs sm:text-sm text-gray-600">
              <span>
                {completionPercentage === 0
                  ? "C'est parti ! 🚀"
                  : completionPercentage < 50
                    ? 'Continue comme ça ! 🔥'
                    : completionPercentage < 100
                      ? 'Tu y es presque ! 💪'
                      : ''}
              </span>
              <span>
                {Math.round(completionPercentage)}% du défi d'aujourd'hui
              </span>
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
