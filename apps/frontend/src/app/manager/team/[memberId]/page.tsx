'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import {
  Card,
  Button,
  Progress,
  Badge,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure,
} from '@/components/ui';
import {
  ArrowLeftIcon,
  UsersIcon,
  CalendarIcon,
  ChartBarIcon,
  EyeIcon,
  CheckCircleIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  ChevronDownIcon,
  ChevronRightIcon,
} from '@heroicons/react/24/outline';
import { ApiClient, API_ENDPOINTS } from '@/services/api';

// Types
interface User {
  id: number;
  name: string;
  email: string;
  role: string;
}

interface Campaign {
  id: number;
  name: string;
  startDate: string;
  endDate: string;
}

interface Action {
  id: number;
  title: string;
  description: string;
  type: string;
  completed: boolean;
  completedAt?: string;
  proofUrl?: string;
  userActionId?: number;
}

interface DailyChallenge {
  date: string;
  dayNumber: number;
  isToday: boolean;
  completed: boolean;
  actions: Action[];
}

interface MemberDetails {
  overallProgress: number;
  completedChallenges: number;
  totalChallenges: number;
  dailyChallenges: DailyChallenge[];
}

const actionTypes = [
  { key: 'vente', label: 'Vente', icon: '💰' },
  { key: 'recrutement', label: 'Recrutement', icon: '👥' },
  { key: 'communication', label: 'Communication', icon: '📢' },
  { key: 'formation', label: 'Formation', icon: '📚' },
  { key: 'prospection', label: 'Prospection', icon: '🔍' },
  { key: 'autre', label: 'Autre', icon: '📋' },
];

export default function MemberDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const memberId = params.memberId as string;

  const [user, setUser] = useState<User | null>(null);
  const [member, setMember] = useState<User | null>(null);
  const [currentCampaign, setCurrentCampaign] = useState<Campaign | null>(null);
  const [memberDetails, setMemberDetails] = useState<MemberDetails | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [expandedDays, setExpandedDays] = useState<Set<string>>(new Set());
  const [selectedProofUrl, setSelectedProofUrl] = useState<string | null>(null);
  const [selectedActionTitle, setSelectedActionTitle] = useState<string>('');
  const [isLoadingProof, setIsLoadingProof] = useState(false);
  const [showPreviousDays, setShowPreviousDays] = useState(false);
  const { isOpen, onOpen, onOpenChange } = useDisclosure();

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    const token = localStorage.getItem('token');

    if (!storedUser || !token) {
      router.push('/login');
      return;
    }

    try {
      const userData = JSON.parse(storedUser);
      if (userData.role !== 'manager') {
        router.push('/login');
        return;
      }

      setUser(userData);
      fetchData(userData.id);
    } catch (error) {
      console.error('Invalid user data in localStorage:', error);
      router.push('/login');
    }
  }, [router, memberId]);

  const fetchData = async (managerId: number) => {
    try {
      // Fetch current active campaign
      const campaignResponse = await ApiClient.get(
        API_ENDPOINTS.CAMPAIGNS_ACTIVE,
      );
      const activeCampaigns = campaignResponse.ok
        ? await campaignResponse.json()
        : [];
      if (activeCampaigns.length > 0) {
        setCurrentCampaign(activeCampaigns[0]);
      }

      // Fetch member details
      const memberResponse = await ApiClient.get(`/users/${memberId}`);
      if (memberResponse.ok) {
        const memberData = await memberResponse.json();
        setMember(memberData);
      }

      // Fetch member campaign details
      if (activeCampaigns.length > 0) {
        await fetchMemberDetails(parseInt(memberId), activeCampaigns[0].id);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des données:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMemberDetails = async (memberId: number, campaignId: number) => {
    try {
      const response = await ApiClient.get(
        API_ENDPOINTS.ACTIONS_USER_CAMPAIGN_DETAILS(memberId, campaignId),
      );

      if (response.ok) {
        const details = await response.json();
        setMemberDetails(details);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des détails du membre:', error);
    }
  };

  const handleBack = () => {
    router.push('/manager/dashboard');
  };

  const toggleDayExpansion = (dayKey: string) => {
    const newExpanded = new Set(expandedDays);
    if (newExpanded.has(dayKey)) {
      newExpanded.delete(dayKey);
    } else {
      newExpanded.add(dayKey);
    }
    setExpandedDays(newExpanded);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <UsersIcon className="w-12 h-12 text-blue-400 animate-pulse mx-auto mb-4" />
          <p className="text-gray-600">Chargement des détails...</p>
        </div>
      </div>
    );
  }

  if (!member || !memberDetails) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <ExclamationTriangleIcon className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <p className="text-gray-600">Membre non trouvé</p>
          <Button className="mt-4" onPress={handleBack}>
            Retour au dashboard
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-100">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white p-6 shadow-lg">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center gap-4 mb-4">
            <Button
              isIconOnly
              variant="flat"
              className="bg-white/20 text-white hover:bg-white/30"
              onPress={handleBack}
            >
              <ArrowLeftIcon className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <UsersIcon className="w-8 h-8" />
                Détails de {member.name}
              </h1>
              {currentCampaign && (
                <p className="text-blue-100">
                  Campagne: {currentCampaign.name}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-4 sm:p-6">
        {/* Campaign Overview */}
        <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 mb-6 p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold mb-2">
                Progression globale
              </h2>
              <div className="flex items-center gap-4">
                <Badge
                  color={
                    memberDetails.overallProgress >= 80
                      ? 'success'
                      : memberDetails.overallProgress >= 60
                        ? 'warning'
                        : 'danger'
                  }
                  variant="flat"
                  className="text-base font-semibold"
                >
                  {Math.round(memberDetails.overallProgress || 0)}%
                </Badge>
                <span className="text-gray-600">
                  {memberDetails.completedChallenges || 0} /{' '}
                  {memberDetails.totalChallenges || 0} défis complétés
                </span>
              </div>
            </div>
            <div className="w-full sm:w-64">
              <Progress
                value={memberDetails.overallProgress || 0}
                className="h-3"
              />
            </div>
          </div>
        </Card>

        {/* Daily Challenges Cards */}
        <Card className="bg-white/80 backdrop-blur-sm shadow-lg border-0 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-semibold">Défis par jour</h3>
          </div>
          <div className="space-y-4">
            {(() => {
              if (!memberDetails.dailyChallenges) return null;

              // Séparer et trier les jours
              const today = new Date();
              today.setHours(0, 0, 0, 0);

              const sortedDays = memberDetails.dailyChallenges.sort((a, b) => {
                return new Date(a.date).getTime() - new Date(b.date).getTime();
              });

              const todayDay = sortedDays.find((day) => {
                const dayDate = new Date(day.date);
                dayDate.setHours(0, 0, 0, 0);
                return dayDate.getTime() === today.getTime();
              });

              const futureDays = sortedDays.filter((day) => {
                const dayDate = new Date(day.date);
                dayDate.setHours(0, 0, 0, 0);
                return dayDate > today;
              });

              // Tous les jours précédents (complétés + manqués)
              const previousDays = sortedDays.filter((day) => {
                const dayDate = new Date(day.date);
                dayDate.setHours(0, 0, 0, 0);
                return dayDate < today;
              });

              // Organiser l'affichage : (Jours précédents si déployés) > Aujourd'hui > À venir
              const displayDays = [
                ...(showPreviousDays ? previousDays : []),
                ...(todayDay ? [todayDay] : []),
                ...futureDays,
              ];

              return (
                <>
                  {/* Bouton pour afficher/masquer les jours précédents */}
                  {previousDays.length > 0 && (
                    <Card className="border-2 border-dashed border-gray-300 bg-gray-50">
                      <Button
                        variant="ghost"
                        className="w-full p-4 justify-center text-gray-600 hover:text-gray-800"
                        onPress={() => setShowPreviousDays(!showPreviousDays)}
                        startContent={
                          showPreviousDays ? (
                            <ChevronDownIcon className="w-4 h-4" />
                          ) : (
                            <ChevronRightIcon className="w-4 h-4" />
                          )
                        }
                      >
                        {showPreviousDays ? 'Masquer' : 'Afficher'} les{' '}
                        {previousDays.length} jour
                        {previousDays.length > 1 ? 's' : ''} précédent
                        {previousDays.length > 1 ? 's' : ''}
                      </Button>
                    </Card>
                  )}

                  {displayDays.map((day, index) => {
                    // Déterminer le statut temporel du jour
                    const dayDate = new Date(day.date);
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);
                    dayDate.setHours(0, 0, 0, 0);

                    const isPast = dayDate < today;
                    const isToday = dayDate.getTime() === today.getTime();

                    // Déterminer le statut du jour
                    let dayStatus, dayStatusColor, dayIcon;
                    if (day.completed) {
                      dayStatus = 'Complété';
                      dayStatusColor = 'success';
                      dayIcon = <CheckCircleIcon className="w-5 h-5" />;
                    } else if (isToday) {
                      dayStatus = 'En cours';
                      dayStatusColor = 'warning';
                      dayIcon = <ClockIcon className="w-5 h-5" />;
                    } else if (isPast) {
                      dayStatus = 'Manqué';
                      dayStatusColor = 'danger';
                      dayIcon = <ExclamationTriangleIcon className="w-5 h-5" />;
                    } else {
                      dayStatus = 'À venir';
                      dayStatusColor = 'default';
                      dayIcon = <CalendarIcon className="w-5 h-5" />;
                    }

                    const dayKey = day.date || `day-${index}`;
                    const isExpanded = expandedDays.has(dayKey);

                    return (
                      <Card
                        key={day.date || index}
                        className={`border transition-all duration-200 ${
                          isToday
                            ? 'ring-2 ring-blue-500 border-blue-300 bg-blue-50/30'
                            : isPast && !day.completed
                              ? 'ring-1 ring-red-200 bg-red-50/30 border-red-200'
                              : 'border-gray-200'
                        }`}
                      >
                        <div
                          className="p-4 cursor-pointer hover:bg-gray-50 transition-colors"
                          onClick={() => toggleDayExpansion(dayKey)}
                        >
                          <div className="flex items-center justify-between w-full">
                            <div className="flex items-center gap-3">
                              {dayIcon}
                              <div>
                                <h4 className="font-medium text-left">
                                  Jour {day.dayNumber} - {day.date}
                                </h4>
                                {isToday && (
                                  <span className="inline-block mt-1 px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
                                    Aujourd'hui
                                  </span>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge
                                color={
                                  dayStatusColor === 'success'
                                    ? 'success'
                                    : dayStatusColor === 'warning'
                                      ? 'warning'
                                      : dayStatusColor === 'danger'
                                        ? 'danger'
                                        : 'default'
                                }
                                variant="flat"
                              >
                                {dayStatus}
                              </Badge>
                              {isExpanded ? (
                                <ChevronDownIcon className="w-4 h-4 text-gray-400" />
                              ) : (
                                <ChevronRightIcon className="w-4 h-4 text-gray-400" />
                              )}
                            </div>
                          </div>
                        </div>

                        {isExpanded && (
                          <div className="space-y-3 p-4 pt-0 border-t border-gray-100">
                            {day.actions?.map((action) => {
                              // Déterminer le statut de l'action
                              let actionStatus, actionStatusColor;
                              if (action.completed) {
                                actionStatus = 'Fait';
                                actionStatusColor = 'success';
                              } else if (isPast) {
                                actionStatus = 'Manqué';
                                actionStatusColor = 'danger';
                              } else if (isToday) {
                                actionStatus = 'À faire';
                                actionStatusColor = 'warning';
                              } else {
                                actionStatus = 'À venir';
                                actionStatusColor = 'default';
                              }

                              return (
                                <div
                                  key={action.id}
                                  className={`p-4 rounded-lg border ${
                                    isPast && !action.completed
                                      ? 'bg-red-50 border-red-200'
                                      : 'bg-gray-50 border-gray-200'
                                  }`}
                                >
                                  <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                      <div className="flex items-center gap-2 mb-2">
                                        <span className="text-xl">
                                          {actionTypes.find(
                                            (t) => t.key === action.type,
                                          )?.icon || '📋'}
                                        </span>
                                        <h5
                                          className={`font-medium ${
                                            isPast && !action.completed
                                              ? 'text-red-700'
                                              : ''
                                          }`}
                                        >
                                          {action.title}
                                        </h5>
                                      </div>
                                      <p
                                        className={`text-sm mb-2 ${
                                          isPast && !action.completed
                                            ? 'text-red-600'
                                            : 'text-gray-600'
                                        }`}
                                      >
                                        {action.description}
                                      </p>
                                      {action.completed &&
                                        action.completedAt && (
                                          <p className="text-sm text-green-600">
                                            ✅ Complété le{' '}
                                            {new Date(
                                              action.completedAt,
                                            ).toLocaleDateString('fr-FR')}
                                          </p>
                                        )}
                                      {isPast && !action.completed && (
                                        <p className="text-sm text-red-600">
                                          ⚠️ Cette action ne peut plus être
                                          réalisée (date passée)
                                        </p>
                                      )}
                                    </div>
                                    <div className="flex items-center gap-2 ml-4">
                                      {action.proofUrl &&
                                        action.userActionId && (
                                          <Button
                                            size="sm"
                                            variant="flat"
                                            color="primary"
                                            isLoading={isLoadingProof}
                                            startContent={
                                              !isLoadingProof ? (
                                                <EyeIcon className="w-4 h-4" />
                                              ) : null
                                            }
                                            onPress={async () => {
                                              try {
                                                setIsLoadingProof(true);
                                                if (!action.userActionId) {
                                                  alert(
                                                    "Identifiant d'action utilisateur manquant.",
                                                  );
                                                  return;
                                                }
                                                const response =
                                                  await ApiClient.get(
                                                    API_ENDPOINTS.USER_ACTIONS_PROOF_URL(
                                                      action.userActionId,
                                                    ),
                                                  );
                                                if (response.ok) {
                                                  const { url } =
                                                    await response.json();
                                                  console.log(
                                                    '🖼️ URL de preuve récupérée:',
                                                    url,
                                                  );
                                                  setSelectedProofUrl(url);
                                                  setSelectedActionTitle(
                                                    action.title,
                                                  );
                                                  onOpen();
                                                } else if (
                                                  response.status === 404
                                                ) {
                                                  alert(
                                                    "Cette action n'existe plus ou n'a pas encore été créée.",
                                                  );
                                                } else if (
                                                  response.status === 403
                                                ) {
                                                  alert(
                                                    "Vous n'avez pas les permissions pour voir cette preuve.",
                                                  );
                                                } else {
                                                  const errorData =
                                                    await response
                                                      .json()
                                                      .catch(() => ({}));
                                                  alert(
                                                    `Erreur lors de la récupération de la preuve: ${errorData.message || 'Erreur inconnue'}`,
                                                  );
                                                }
                                              } catch (error) {
                                                console.error(
                                                  'Erreur lors de la récupération de la preuve:',
                                                  error,
                                                );
                                                alert(
                                                  'Erreur de connexion. Veuillez réessayer plus tard.',
                                                );
                                              } finally {
                                                setIsLoadingProof(false);
                                              }
                                            }}
                                          >
                                            Voir preuve
                                          </Button>
                                        )}
                                      <Badge
                                        color={
                                          actionStatusColor === 'success'
                                            ? 'success'
                                            : actionStatusColor === 'warning'
                                              ? 'warning'
                                              : actionStatusColor === 'danger'
                                                ? 'danger'
                                                : 'default'
                                        }
                                        variant="flat"
                                      >
                                        {actionStatus}
                                      </Badge>
                                    </div>
                                  </div>
                                </div>
                              );
                            })}

                            {!day.actions ||
                              (day.actions.length === 0 && (
                                <div className="text-center py-4 text-gray-500">
                                  <CalendarIcon className="w-8 h-8 mx-auto mb-2 opacity-50" />
                                  <p>Aucune action programmée pour ce jour</p>
                                </div>
                              ))}
                          </div>
                        )}
                      </Card>
                    );
                  })}
                </>
              );
            })()}
          </div>
        </Card>
      </div>

      {/* Modal pour afficher la preuve */}
      <Modal
        isOpen={isOpen}
        onOpenChange={onOpenChange}
        size="4xl"
        scrollBehavior="inside"
      >
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1">
                <h2 className="text-xl font-semibold">Preuve de l'action</h2>
                <p className="text-sm text-gray-600">{selectedActionTitle}</p>
              </ModalHeader>
              <ModalBody className="flex flex-col items-center justify-center">
                {selectedProofUrl && (
                  <>
                    {/* Vérifier si c'est une image ou une vidéo */}
                    {selectedProofUrl.match(
                      /\.(jpg|jpeg|png|gif|webp)(\?.*)?$/i,
                    ) ? (
                      <img
                        src={selectedProofUrl}
                        alt="Preuve de l'action"
                        className="max-w-full max-h-[70vh] object-contain rounded-lg shadow-lg"
                        onError={(e) => {
                          console.error("Erreur lors du chargement de l'image");
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                    ) : selectedProofUrl.match(
                        /\.(mp4|mov|avi|webm)(\?.*)?$/i,
                      ) ? (
                      <video
                        src={selectedProofUrl}
                        controls
                        className="max-w-full max-h-[70vh] rounded-lg shadow-lg"
                        onError={(e) => {
                          console.error(
                            'Erreur lors du chargement de la vidéo',
                          );
                        }}
                      >
                        Votre navigateur ne supporte pas la lecture de vidéos.
                      </video>
                    ) : (
                      <div className="text-center p-8">
                        <p className="text-gray-600 mb-4">
                          Impossible de prévisualiser ce type de fichier.
                        </p>
                        <Button
                          color="primary"
                          variant="flat"
                          onPress={() =>
                            window.open(selectedProofUrl, '_blank')
                          }
                        >
                          Ouvrir dans un nouvel onglet
                        </Button>
                      </div>
                    )}
                  </>
                )}
              </ModalBody>
              <ModalFooter>
                <Button color="danger" variant="light" onPress={onClose}>
                  Fermer
                </Button>
                <Button
                  color="primary"
                  variant="flat"
                  onPress={() => window.open(selectedProofUrl || '#', '_blank')}
                >
                  Ouvrir dans un nouvel onglet
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </div>
  );
}
