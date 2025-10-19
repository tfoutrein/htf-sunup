'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import {
  Card,
  CardBody,
  Button,
  Badge,
  Progress,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure,
  MultiProofViewer,
} from '@/components/ui';
import { Select, SelectItem } from '@heroui/react';
import {
  ArrowLeftIcon,
  UsersIcon,
  CheckCircleIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  CalendarIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  EyeIcon,
  CurrencyEuroIcon,
  CalendarDaysIcon,
  PhotoIcon,
} from '@heroicons/react/24/outline';
import { ApiClient, API_ENDPOINTS } from '@/services/api';
import { campaignService } from '@/services/campaigns';
import {
  useUserCampaignBonuses,
  useActionProofs,
  useBonusProofs,
} from '@/hooks';
import { DailyBonus } from '@/types/daily-bonus';

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
  bonusesEnabled: boolean;
}

interface Action {
  id: number;
  title: string;
  description: string;
  type: string;
  completed?: boolean;
  completedAt?: string;
  proofUrl?: string;
  userActionId?: number;
  proofsCount?: number;
  hasProofs?: boolean;
}

interface DailyChallenge {
  date: string;
  dayNumber: number;
  isToday: boolean;
  completed: boolean;
  actions: Action[];
}

interface EnrichedDailyChallenge {
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

interface EnrichedMemberDetails {
  overallProgress: number;
  completedChallenges: number;
  totalChallenges: number;
  dailyChallenges: EnrichedDailyChallenge[];
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
  const searchParams = useSearchParams();
  const memberId = params.memberId as string;
  const campaignIdFromUrl = searchParams.get('campaignId');

  const [user, setUser] = useState<User | null>(null);
  const [member, setMember] = useState<User | null>(null);
  const [currentCampaign, setCurrentCampaign] = useState<Campaign | null>(null);
  const [allCampaigns, setAllCampaigns] = useState<Campaign[]>([]);
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

  // États pour l'accordéon des bonus
  const [bonusAccordionOpen, setBonusAccordionOpen] = useState(false);
  const [selectedBonusProof, setSelectedBonusProof] =
    useState<DailyBonus | null>(null);
  const [bonusProofModalOpen, setBonusProofModalOpen] = useState(false);
  const [bonusProofUrl, setBonusProofUrl] = useState<string | null>(null);
  const [loadingBonusProof, setLoadingBonusProof] = useState(false);

  // États pour les données enrichies avec preuves
  const [enrichedBonuses, setEnrichedBonuses] = useState<any[]>([]);
  const [enrichedMemberDetails, setEnrichedMemberDetails] =
    useState<EnrichedMemberDetails | null>(null);

  // Hook pour les bonus quotidiens - utiliser le hook React Query
  const {
    data: memberBonuses = [],
    isLoading: bonusesLoading,
    error: bonusesError,
  } = useUserCampaignBonuses(parseInt(memberId), currentCampaign?.id || 0);

  // Hooks pour gérer les preuves multiples
  const actionProofsHook = useActionProofs();
  const bonusProofsHook = useBonusProofs();

  // Calculs de statistiques de bonus à partir des données enrichies
  const totalBonusAmount = enrichedBonuses.reduce(
    (total, bonus) => total + parseFloat(bonus.amount),
    0,
  );
  const bonusCount = enrichedBonuses.length;
  const basketBonusCount = enrichedBonuses.filter(
    (bonus) => bonus.bonusType === 'basket',
  ).length;
  const sponsorshipBonusCount = enrichedBonuses.filter(
    (bonus) => bonus.bonusType === 'sponsorship',
  ).length;

  // Enrichir les bonus avec le comptage de preuves
  useEffect(() => {
    const enrichBonuses = async () => {
      if (memberBonuses && memberBonuses.length > 0) {
        try {
          const enriched =
            await bonusProofsHook.enrichBonusesWithProofCounts(memberBonuses);
          setEnrichedBonuses(enriched);
        } catch (error) {
          console.error("Erreur lors de l'enrichissement des bonus:", error);
          setEnrichedBonuses(memberBonuses);
        }
      } else {
        setEnrichedBonuses([]);
      }
    };

    enrichBonuses();
  }, [memberBonuses]);

  // Enrichir les détails du membre avec le comptage de preuves des actions
  useEffect(() => {
    const enrichMemberDetails = async () => {
      if (memberDetails) {
        try {
          const enrichedDailyChallenges = await Promise.all(
            memberDetails.dailyChallenges.map(async (challenge) => {
              const enrichedActions =
                await actionProofsHook.enrichActionsWithProofCounts(
                  challenge.actions,
                );
              return {
                ...challenge,
                actions: enrichedActions,
              };
            }),
          );

          setEnrichedMemberDetails({
            ...memberDetails,
            dailyChallenges: enrichedDailyChallenges,
          });
        } catch (error) {
          console.error(
            "Erreur lors de l'enrichissement des détails du membre:",
            error,
          );
          setEnrichedMemberDetails(memberDetails);
        }
      } else {
        setEnrichedMemberDetails(null);
      }
    };

    enrichMemberDetails();
  }, [memberDetails]);

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
  }, [router, memberId, campaignIdFromUrl]);

  const fetchData = async (managerId: number) => {
    try {
      // Fetch ALL campaigns (active and finished)
      const [activeCampaigns, allCampaignsData] = await Promise.all([
        campaignService.getActiveCampaigns(),
        campaignService.getCampaigns(),
      ]);

      // Sort campaigns by start date (most recent first)
      const sortedCampaigns = allCampaignsData.sort(
        (a, b) =>
          new Date(b.startDate).getTime() - new Date(a.startDate).getTime(),
      );

      setAllCampaigns(sortedCampaigns);

      // Determine which campaign to load
      let campaignToLoad: Campaign | null = null;

      // 1. Try to use campaign from URL parameter
      if (campaignIdFromUrl) {
        campaignToLoad =
          sortedCampaigns.find((c) => c.id === parseInt(campaignIdFromUrl)) ||
          null;
      }

      // 2. Fallback to active campaign
      if (!campaignToLoad && activeCampaigns.length > 0) {
        campaignToLoad = activeCampaigns[0];
      }

      // 3. Fallback to most recent campaign
      if (!campaignToLoad && sortedCampaigns.length > 0) {
        campaignToLoad = sortedCampaigns[0];
      }

      if (campaignToLoad) {
        setCurrentCampaign(campaignToLoad);
      }

      // Fetch member details
      const memberResponse = await ApiClient.get(`/users/${memberId}`);
      if (memberResponse.ok) {
        const memberData = await memberResponse.json();
        setMember(memberData);
      }

      // Fetch member campaign details for the selected campaign
      if (campaignToLoad) {
        await fetchMemberDetails(parseInt(memberId), campaignToLoad.id);
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

  const handleCampaignChange = async (campaignId: number) => {
    const selectedCampaign = allCampaigns.find((c) => c.id === campaignId);
    if (selectedCampaign) {
      setCurrentCampaign(selectedCampaign);
      // Reload member details for the newly selected campaign
      await fetchMemberDetails(parseInt(memberId), campaignId);
    }
  };

  const getCampaignStatus = (campaign: Campaign) => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const start = new Date(campaign.startDate);
    start.setHours(0, 0, 0, 0);
    const end = new Date(campaign.endDate);
    end.setHours(0, 0, 0, 0);

    if (now < start) {
      return {
        status: 'future',
        label: 'À venir',
        color: 'text-purple-700',
        bgColor: 'bg-purple-100',
        badgeBg: 'bg-purple-500',
      };
    } else if (now >= start && now <= end) {
      return {
        status: 'active',
        label: 'En cours',
        color: 'text-green-700',
        bgColor: 'bg-green-100',
        badgeBg: 'bg-green-600',
      };
    } else {
      return {
        status: 'finished',
        label: 'Terminée',
        color: 'text-gray-700',
        bgColor: 'bg-gray-100',
        badgeBg: 'bg-gray-500',
      };
    }
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

  // Fonctions pour les bonus déclarés
  const getBonusTypeLabel = (type: string) => {
    switch (type) {
      case 'basket':
        return 'Panier';
      case 'sponsorship':
        return 'Parrainage';
      default:
        return type;
    }
  };

  const formatBonusDate = (dateString: string) => {
    try {
      let date;
      if (dateString.includes('T')) {
        date = new Date(dateString);
      } else if (dateString.includes('-')) {
        const [year, month, day] = dateString.split('-');
        date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
      } else {
        date = new Date(dateString);
      }

      if (isNaN(date.getTime())) {
        return dateString;
      }

      return date.toLocaleDateString('fr-FR', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    } catch (error) {
      console.error('Erreur de formatage de date:', error);
      return dateString;
    }
  };

  const handleViewBonusProof = async (bonus: DailyBonus) => {
    if (!bonus.proofUrl) return;

    setSelectedBonusProof(bonus);
    setLoadingBonusProof(true);
    setBonusProofUrl(null);

    try {
      const response = await ApiClient.get(`/daily-bonus/${bonus.id}/proof`);

      if (response.ok) {
        const data = await response.json();
        setBonusProofUrl(data.url);
        setBonusProofModalOpen(true);
      }
    } catch (error) {
      console.error('Erreur lors du chargement de la preuve:', error);
    } finally {
      setLoadingBonusProof(false);
    }
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
        {/* Campaign Selector */}
        {allCampaigns.length > 0 && (
          <Card className="bg-white/80 backdrop-blur-sm shadow-lg border-0 mb-6">
            <CardBody className="p-4 sm:p-6">
              <div className="space-y-3">
                <div className="flex flex-col gap-3 w-full">
                  <label className="text-sm font-medium text-gray-600">
                    Sélectionner une campagne :
                  </label>
                  <Select
                    selectedKeys={
                      currentCampaign ? [currentCampaign.id.toString()] : []
                    }
                    onSelectionChange={(keys) => {
                      const selectedId = Array.from(keys)[0];
                      if (selectedId) {
                        handleCampaignChange(parseInt(selectedId as string));
                      }
                    }}
                    className="w-full sm:max-w-xl"
                    classNames={{
                      trigger:
                        'bg-white border-gray-300 h-auto min-h-[48px] py-2',
                      value: 'w-full',
                    }}
                    label=""
                    placeholder="Choisir une campagne"
                    renderValue={() => {
                      if (!currentCampaign) return null;
                      const statusInfo = getCampaignStatus(currentCampaign);

                      return (
                        <div className="flex items-center gap-2 flex-wrap py-1">
                          <span className="font-medium text-sm sm:text-base">
                            {currentCampaign.name}
                          </span>
                          <Badge
                            variant="flat"
                            className={`text-xs ${statusInfo.badgeBg} text-white px-2 py-1 shrink-0`}
                          >
                            {statusInfo.label}
                          </Badge>
                        </div>
                      );
                    }}
                  >
                    {allCampaigns.map((campaign) => {
                      const statusInfo = getCampaignStatus(campaign);

                      return (
                        <SelectItem
                          key={campaign.id.toString()}
                          textValue={campaign.name}
                          classNames={{
                            base: 'data-[hover=true]:bg-gray-100 data-[selectable=true]:focus:bg-gray-100',
                            title: 'text-gray-900',
                            description: 'text-gray-600',
                          }}
                        >
                          <div className="flex items-center justify-between w-full gap-2">
                            <div className="flex flex-col min-w-0 flex-1">
                              <span className="font-medium text-gray-900 truncate">
                                {campaign.name}
                              </span>
                              <div className="flex items-center gap-2 text-xs text-gray-600">
                                <span>
                                  {new Date(
                                    campaign.startDate,
                                  ).toLocaleDateString('fr-FR')}{' '}
                                  -{' '}
                                  {new Date(campaign.endDate).toLocaleDateString(
                                    'fr-FR',
                                  )}
                                </span>
                                {campaign.bonusesEnabled ? (
                                  <span className="text-amber-600 font-semibold">
                                    • Bonus ✓
                                  </span>
                                ) : (
                                  <span className="text-gray-400">
                                    • Pas de bonus
                                  </span>
                                )}
                              </div>
                            </div>
                            <Badge
                              variant="flat"
                              className={`text-xs ${statusInfo.badgeBg} text-white px-2 py-0.5 shrink-0`}
                            >
                              {statusInfo.label}
                            </Badge>
                          </div>
                        </SelectItem>
                      );
                    })}
                  </Select>
                </div>

                {/* Campaign info */}
                {currentCampaign && (
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
                    <div className="flex items-center gap-2">
                      <CalendarIcon className="w-4 h-4" />
                      <span>
                        {new Date(currentCampaign.startDate).toLocaleDateString(
                          'fr-FR',
                        )}{' '}
                        -{' '}
                        {new Date(currentCampaign.endDate).toLocaleDateString(
                          'fr-FR',
                        )}
                      </span>
                    </div>
                    <div className="hidden sm:block text-gray-400">•</div>
                    <Badge
                      variant="flat"
                      className={`${getCampaignStatus(currentCampaign).badgeBg} text-white px-2 py-1`}
                    >
                      {getCampaignStatus(currentCampaign).label}
                    </Badge>
                  </div>
                )}
              </div>
            </CardBody>
          </Card>
        )}

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
        <Card className="bg-white/80 backdrop-blur-sm shadow-lg border-0 mb-6 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-semibold">Défis par jour</h3>
          </div>
          <div className="space-y-4">
            {(() => {
              if (!enrichedMemberDetails?.dailyChallenges) return null;

              // Séparer et trier les jours
              const today = new Date();
              today.setHours(0, 0, 0, 0);

              const sortedDays = enrichedMemberDetails.dailyChallenges.sort(
                (a, b) => {
                  return (
                    new Date(a.date).getTime() - new Date(b.date).getTime()
                  );
                },
              );

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

                    // Calcul de la complétion partielle
                    const totalActions = day.actions?.length || 0;
                    const completedActions =
                      day.actions?.filter((a) => a.completed).length || 0;
                    const isFullyCompleted =
                      totalActions > 0 && completedActions === totalActions;
                    const isPartiallyCompleted =
                      completedActions > 0 && completedActions < totalActions;

                    // Déterminer le statut du jour
                    let dayStatus, dayStatusColor, dayIcon;
                    if (isFullyCompleted) {
                      dayStatus = 'Complété';
                      dayStatusColor = 'success';
                      dayIcon = <CheckCircleIcon className="w-5 h-5" />;
                    } else if (isPartiallyCompleted) {
                      dayStatus = `${completedActions}/${totalActions} actions`;
                      dayStatusColor = 'warning'; // Orange pour partiel
                      dayIcon = <ClockIcon className="w-5 h-5" />;
                    } else if (isToday) {
                      dayStatus = "Aujourd'hui";
                      dayStatusColor = 'primary'; // Bleu pour aujourd'hui non commencé
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
                            : isPast && !isFullyCompleted
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
                                        : dayStatusColor === 'primary'
                                          ? 'primary'
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
                                        <h5 className="font-medium text-gray-900">
                                          {action.title}
                                        </h5>
                                      </div>
                                      <p className="text-sm text-gray-600 mb-3">
                                        {action.description}
                                      </p>
                                    </div>
                                    <div className="flex items-center gap-2 ml-4">
                                      {action.hasProofs && (
                                        <Button
                                          size="sm"
                                          variant="flat"
                                          color="primary"
                                          isLoading={actionProofsHook.isLoading}
                                          startContent={
                                            !actionProofsHook.isLoading ? (
                                              <EyeIcon className="w-4 h-4" />
                                            ) : null
                                          }
                                          onPress={() =>
                                            actionProofsHook.viewActionProofs(
                                              action,
                                            )
                                          }
                                        >
                                          Voir preuves ({action.proofsCount})
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

        {/* Section Accordéon Bonus Déclarés par le FBO */}
        <Card className="bg-white/90 backdrop-blur-sm shadow-lg border-0">
          <CardBody className="p-0">
            <div
              className="p-4 sm:p-6 cursor-pointer hover:bg-gray-50/50 transition-colors border-b border-gray-100"
              onClick={() => setBonusAccordionOpen(!bonusAccordionOpen)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-amber-100 rounded-lg">
                    <CurrencyEuroIcon className="w-6 h-6 text-amber-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800">
                      Bonus Déclarés par {member?.name}
                    </h3>

                    {/* Version mobile : affichage vertical */}
                    <div className="sm:hidden">
                      <div className="flex items-center gap-1 mb-1">
                        <span className="text-amber-600 font-semibold text-lg">
                          {totalBonusAmount.toFixed(2)}€
                        </span>
                        <span className="text-sm text-gray-600">au total</span>
                      </div>
                      <div className="flex items-center gap-3 text-sm text-gray-600">
                        <span>{bonusCount} bonus</span>
                        {basketBonusCount > 0 && (
                          <>
                            <span>•</span>
                            <span>🛒 {basketBonusCount}</span>
                          </>
                        )}
                        {sponsorshipBonusCount > 0 && (
                          <>
                            <span>•</span>
                            <span>🤝 {sponsorshipBonusCount}</span>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Version desktop : affichage horizontal */}
                    <div className="hidden sm:flex items-center gap-4 text-sm text-gray-600">
                      <span className="flex items-center gap-1">
                        <span className="text-amber-600 font-semibold">
                          {totalBonusAmount.toFixed(2)}€
                        </span>
                        au total
                      </span>
                      <span>•</span>
                      <span>{bonusCount} bonus déclarés</span>
                      {basketBonusCount > 0 && (
                        <>
                          <span>•</span>
                          <span>🛒 {basketBonusCount} paniers</span>
                        </>
                      )}
                      {sponsorshipBonusCount > 0 && (
                        <>
                          <span>•</span>
                          <span>🤝 {sponsorshipBonusCount} parrainages</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {bonusesLoading && (
                    <div className="w-4 h-4 border-2 border-amber-300 border-t-amber-600 rounded-full animate-spin" />
                  )}
                  {bonusAccordionOpen ? (
                    <ChevronDownIcon className="w-5 h-5 text-gray-500" />
                  ) : (
                    <ChevronRightIcon className="w-5 h-5 text-gray-500" />
                  )}
                </div>
              </div>
            </div>

            {bonusAccordionOpen && (
              <div className="p-4 sm:p-6 pt-0">
                {bonusesLoading ? (
                  <div className="flex justify-center items-center p-8">
                    <div className="w-8 h-8 border-3 border-amber-300 border-t-amber-600 rounded-full animate-spin" />
                    <p className="text-gray-600 ml-4">
                      Chargement des bonus...
                    </p>
                  </div>
                ) : bonusesError ? (
                  <div className="text-center p-8">
                    <ExclamationTriangleIcon className="w-12 h-12 text-red-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-red-600 mb-2">
                      Erreur lors du chargement
                    </h3>
                    <p className="text-red-500 text-sm">
                      {bonusesError.message}
                    </p>
                  </div>
                ) : enrichedBonuses.length === 0 ? (
                  <div className="text-center p-8">
                    <CurrencyEuroIcon className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-600 mb-2">
                      Aucun bonus déclaré
                    </h3>
                    <p className="text-gray-500">
                      Ce FBO n'a pas encore déclaré de bonus pour cette
                      campagne.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {enrichedBonuses.map((bonus, index) => (
                      <div key={bonus.id}>
                        <div className="p-4 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors">
                          {/* Version mobile : layout vertical */}
                          <div className="sm:hidden">
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center gap-2">
                                <CalendarDaysIcon className="w-4 h-4 text-gray-500" />
                                <span className="text-sm font-medium">
                                  {formatBonusDate(bonus.bonusDate)}
                                </span>
                              </div>
                              <div className="flex items-center gap-1">
                                <CurrencyEuroIcon className="w-4 h-4 text-green-600" />
                                <span className="font-semibold text-green-600">
                                  {bonus.amount}€
                                </span>
                              </div>
                            </div>

                            <div className="flex items-center justify-between">
                              <Badge
                                size="sm"
                                variant="flat"
                                color={
                                  bonus.bonusType === 'basket'
                                    ? 'primary'
                                    : 'secondary'
                                }
                              >
                                {getBonusTypeLabel(bonus.bonusType)}
                              </Badge>

                              {bonus.hasProofs && (
                                <Button
                                  size="sm"
                                  variant="flat"
                                  startContent={<EyeIcon className="w-4 h-4" />}
                                  onPress={() =>
                                    bonusProofsHook.viewBonusProofs(bonus)
                                  }
                                  isLoading={bonusProofsHook.isLoading}
                                  className="min-w-0 px-2"
                                >
                                  👁️({bonus.proofsCount})
                                </Button>
                              )}
                            </div>
                          </div>

                          {/* Version desktop : layout horizontal */}
                          <div className="hidden sm:flex items-center justify-between">
                            <div className="flex items-center gap-4">
                              <div className="flex items-center gap-2">
                                <CalendarDaysIcon className="w-4 h-4 text-gray-500" />
                                <span className="text-sm font-medium">
                                  {formatBonusDate(bonus.bonusDate)}
                                </span>
                              </div>
                              <Badge
                                size="sm"
                                variant="flat"
                                color={
                                  bonus.bonusType === 'basket'
                                    ? 'primary'
                                    : 'secondary'
                                }
                              >
                                {getBonusTypeLabel(bonus.bonusType)}
                              </Badge>
                              <div className="flex items-center gap-1">
                                <CurrencyEuroIcon className="w-4 h-4 text-green-600" />
                                <span className="font-semibold text-green-600">
                                  {bonus.amount}€
                                </span>
                              </div>
                            </div>

                            <div className="flex items-center gap-3">
                              {bonus.hasProofs && (
                                <Button
                                  size="sm"
                                  variant="flat"
                                  startContent={<EyeIcon className="w-4 h-4" />}
                                  onPress={() =>
                                    bonusProofsHook.viewBonusProofs(bonus)
                                  }
                                  isLoading={bonusProofsHook.isLoading}
                                >
                                  Voir preuves ({bonus.proofsCount})
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                        {index < enrichedBonuses.length - 1 && (
                          <div className="border-b border-gray-200 my-2" />
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </CardBody>
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

      {/* Modal pour afficher la preuve des bonus déclarés */}
      <Modal
        isOpen={bonusProofModalOpen}
        onOpenChange={setBonusProofModalOpen}
        size="2xl"
        scrollBehavior="inside"
      >
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  <PhotoIcon className="w-5 h-5" />
                  Preuve du bonus
                </div>
                {selectedBonusProof && (
                  <div className="text-sm text-gray-600 font-normal">
                    {getBonusTypeLabel(selectedBonusProof.bonusType)} •{' '}
                    {selectedBonusProof.amount}€ •{' '}
                    {formatBonusDate(selectedBonusProof.bonusDate)}
                  </div>
                )}
              </ModalHeader>
              <ModalBody>
                {loadingBonusProof ? (
                  <div className="flex justify-center items-center p-8">
                    <div className="w-8 h-8 border-3 border-amber-300 border-t-amber-600 rounded-full animate-spin" />
                  </div>
                ) : bonusProofUrl ? (
                  <div className="flex justify-center">
                    <img
                      src={bonusProofUrl}
                      alt="Preuve du bonus"
                      className="max-w-full h-auto rounded-lg shadow-lg"
                      style={{ maxHeight: '70vh' }}
                    />
                  </div>
                ) : (
                  <div className="text-center p-8">
                    <PhotoIcon className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">
                      Impossible de charger la preuve
                    </p>
                  </div>
                )}
              </ModalBody>
              <ModalFooter>
                <Button color="primary" variant="light" onPress={onClose}>
                  Fermer
                </Button>
                {bonusProofUrl && (
                  <Button
                    color="primary"
                    variant="flat"
                    onPress={() => window.open(bonusProofUrl, '_blank')}
                  >
                    Ouvrir dans un nouvel onglet
                  </Button>
                )}
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>

      {/* Modal pour visualiser les preuves multiples des actions */}
      <MultiProofViewer
        isOpen={actionProofsHook.viewModalOpen}
        onClose={actionProofsHook.closeViewModal}
        proofs={actionProofsHook.proofs}
        currentIndex={actionProofsHook.currentProofIndex}
        currentUrl={actionProofsHook.currentProofUrl}
        isLoading={actionProofsHook.isLoading}
        title="Preuves de l'action"
        onNavigate={actionProofsHook.navigateProof}
      />

      {/* Modal pour visualiser les preuves multiples des bonus */}
      <MultiProofViewer
        isOpen={bonusProofsHook.viewModalOpen}
        onClose={bonusProofsHook.closeViewModal}
        proofs={bonusProofsHook.proofs}
        currentIndex={bonusProofsHook.currentProofIndex}
        currentUrl={bonusProofsHook.currentProofUrl}
        isLoading={bonusProofsHook.isLoading}
        title="Preuves du bonus"
        onNavigate={bonusProofsHook.navigateProof}
      />
    </div>
  );
}
