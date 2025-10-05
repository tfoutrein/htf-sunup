'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  Card,
  CardHeader,
  CardBody,
  Button,
  Badge,
  Progress,
  AuroraBackground,
} from '@/components/ui';
import { Chip, Tabs, Tab, Select, SelectItem } from '@heroui/react';
import { campaignService } from '@/services/campaigns';
import { Campaign, UserAction } from '@/types/campaigns';
import { ApiClient, API_ENDPOINTS } from '@/services/api';
import {
  UsersIcon,
  CalendarIcon,
  ChartBarIcon,
  ChartPieIcon,
  ChevronRightIcon,
  UserGroupIcon,
  BriefcaseIcon,
  FunnelIcon,
} from '@heroicons/react/24/outline';
import { PieChart, Pie, Cell } from 'recharts';
import { CampaignValidationSection } from '@/components/CampaignValidationSection';

interface User {
  id: number;
  name: string;
  email: string;
  role: string;
}

interface TeamMember {
  id: number;
  name: string;
  email: string;
  role: string;
  managerId: number;
  managerName?: string;
  isDirectReport?: boolean;
}

interface TeamProgress {
  userId: number;
  userName: string;
  campaignProgress?: CampaignProgress;
  error?: string;
}

interface EnrichedAction {
  id: number;
  title: string;
  description: string;
  type: string;
  completed: boolean;
  userActionId?: number;
}

interface DailyChallenge {
  challengeId: number;
  date: string;
  dayNumber: number;
  title: string;
  description: string;
  isToday: boolean;
  completed: boolean;
  totalActions: number;
  completedActions: number;
  actions: EnrichedAction[];
}

interface CampaignProgress {
  campaignId: number;
  campaignName: string;
  totalDays: number;
  currentDay: number;
  completedChallenges: number;
  totalChallenges: number;
  progressPercentage: number;
  dailyChallenges?: DailyChallenge[];
}

export default function ManagerDashboard() {
  const [user, setUser] = useState<User | null>(null);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [teamProgress, setTeamProgress] = useState<TeamProgress[]>([]);
  const [currentCampaign, setCurrentCampaign] = useState<Campaign | null>(null);
  const [allCampaigns, setAllCampaigns] = useState<Campaign[]>([]);
  const [roleFilter, setRoleFilter] = useState<string>('all');

  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // Computed values based on filter
  const filteredMembers = useMemo(() => {
    if (roleFilter === 'all') return teamMembers;
    return teamMembers.filter((member) => member.role === roleFilter);
  }, [teamMembers, roleFilter]);

  const teamStats = useMemo(() => {
    const managers = teamMembers.filter((m) => m.role === 'manager').length;
    const fbos = teamMembers.filter((m) => m.role === 'fbo').length;

    const filteredProgress = teamProgress.filter((p) => {
      if (roleFilter === 'all') return true;
      const member = teamMembers.find((m) => m.id === p.userId);
      return member?.role === roleFilter;
    });

    const averageProgress =
      filteredProgress.length > 0
        ? filteredProgress.reduce(
            (acc, member) =>
              acc + (member.campaignProgress?.progressPercentage || 0),
            0,
          ) / filteredProgress.length
        : 0;

    // Calcul du nombre total d'actions réalisées par toute l'équipe
    const totalCompletedActions = teamProgress.reduce((total, member) => {
      if (!member.campaignProgress?.dailyChallenges) {
        return total;
      }

      return (
        total +
        member.campaignProgress.dailyChallenges.reduce(
          (dayTotal, challenge) => {
            return dayTotal + (challenge.completedActions || 0);
          },
          0,
        )
      );
    }, 0);

    const totalPossibleActions = teamProgress.reduce((total, member) => {
      if (!member.campaignProgress?.dailyChallenges) {
        return total;
      }

      return (
        total +
        member.campaignProgress.dailyChallenges.reduce(
          (dayTotal, challenge) => {
            return dayTotal + (challenge.totalActions || 0);
          },
          0,
        )
      );
    }, 0);

    // Calcul des actions par type pour le camembert
    const actionsByType = teamProgress.reduce(
      (acc, member) => {
        if (!member.campaignProgress?.dailyChallenges) {
          return acc;
        }

        member.campaignProgress.dailyChallenges.forEach((challenge) => {
          challenge.actions?.forEach((action) => {
            if (action.completed) {
              acc[action.type] = (acc[action.type] || 0) + 1;
            }
          });
        });

        return acc;
      },
      {} as Record<string, number>,
    );

    return {
      managers,
      fbos,
      totalMembers: teamMembers.length,
      averageProgress,
      totalCompletedActions,
      totalPossibleActions,
      actionsByType,
    };
  }, [teamMembers, teamProgress, roleFilter]);

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
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      router.push('/login');
    }
  }, [router]);

  const fetchData = async (managerId: number) => {
    try {
      const token = localStorage.getItem('token');

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

      // Set current campaign to the active one by default, or the most recent one
      if (activeCampaigns.length > 0) {
        setCurrentCampaign(activeCampaigns[0]);
      } else if (sortedCampaigns.length > 0) {
        setCurrentCampaign(sortedCampaigns[0]);
      }

      // Fetch all team members (including hierarchy)
      const teamResponse = await ApiClient.get(
        API_ENDPOINTS.USERS_TEAM_LIST(managerId),
      );

      if (teamResponse.ok) {
        const teamData = await teamResponse.json();
        setTeamMembers(teamData);
      }

      // Fetch team campaign progress for the selected campaign
      const selectedCampaignId =
        activeCampaigns[0]?.id || sortedCampaigns[0]?.id;
      if (selectedCampaignId) {
        await fetchTeamCampaignProgress(managerId, selectedCampaignId);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des données:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTeamCampaignProgress = async (
    managerId: number,
    campaignId?: number,
  ) => {
    if (!campaignId) return;

    try {
      const response = await ApiClient.get(
        API_ENDPOINTS.ACTIONS_TEAM_CAMPAIGN_PROGRESS(managerId, campaignId),
      );

      if (response.ok) {
        const progressData = await response.json();
        setTeamProgress(progressData);
      } else {
        // Fallback to old progress endpoint if new one doesn't exist
        const fallbackResponse = await ApiClient.get(
          API_ENDPOINTS.ACTIONS_TEAM_PROGRESS(managerId),
        );
        if (fallbackResponse.ok) {
          const fallbackData = await fallbackResponse.json();
          setTeamProgress(fallbackData);
        }
      }
    } catch (error) {
      console.error(
        'Erreur lors du chargement de la progression de campagne:',
        error,
      );
    }
  };

  const getChallengeStatus = (challenge: DailyChallenge) => {
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);
    const challengeDate = new Date(challenge.date);
    challengeDate.setUTCHours(0, 0, 0, 0);

    let status, color, label;

    if (challenge.completed) {
      status = 'completed';
      color = 'bg-green-500';
      label = 'Complété';
    } else if (challenge.completedActions > 0) {
      status = 'partial';
      color = 'bg-yellow-500';
      label = 'Partiel';
    } else if (challengeDate < today) {
      status = 'missed';
      color = 'bg-red-500';
      label = 'Manqué';
    } else {
      status = 'future';
      color = 'bg-gray-300';
      label = 'À venir';
    }

    return { status, color, label };
  };

  const calculateCurrentDay = (startDate: string, endDate: string): number => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const today = new Date();

    if (today < start) return 0;
    if (today > end)
      return (
        Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1
      );

    return (
      Math.ceil((today.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1
    );
  };

  const getTotalCampaignDays = (startDate: string, endDate: string): number => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    return (
      Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1
    );
  };

  const handleMemberClick = (member: TeamMember) => {
    // Passer l'ID de la campagne sélectionnée dans l'URL
    const campaignParam = currentCampaign
      ? `?campaignId=${currentCampaign.id}`
      : '';
    router.push(`/manager/team/${member.id}${campaignParam}`);
  };

  const handleCampaignChange = async (campaignId: number) => {
    const selectedCampaign = allCampaigns.find((c) => c.id === campaignId);
    if (selectedCampaign && user) {
      setCurrentCampaign(selectedCampaign);
      // Reload team progress for the newly selected campaign
      await fetchTeamCampaignProgress(user.id, campaignId);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/login');
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

  const getRoleInfo = (role: string) => {
    switch (role) {
      case 'manager':
        return {
          icon: <BriefcaseIcon className="w-4 h-4" />,
          color: 'from-purple-400 to-purple-600',
          bgColor: 'bg-purple-100',
          textColor: 'text-purple-800',
          label: 'Manager',
        };
      case 'fbo':
        return {
          icon: <UserGroupIcon className="w-4 h-4" />,
          color: 'from-blue-400 to-blue-600',
          bgColor: 'bg-blue-100',
          textColor: 'text-blue-800',
          label: 'FBO',
        };
      default:
        return {
          icon: <UsersIcon className="w-4 h-4" />,
          color: 'from-gray-400 to-gray-600',
          bgColor: 'bg-gray-100',
          textColor: 'text-gray-800',
          label: role,
        };
    }
  };

  // Composant Camembert pour la répartition des actions
  const ActionsPieChart = ({ data }: { data: Record<string, number> }) => {
    const getActionTypeInfo = (type: string) => {
      switch (type) {
        case 'vente':
          return { label: 'Vente', color: '#10b981', icon: '💰' };
        case 'recrutement':
          return { label: 'Recrutement', color: '#8b5cf6', icon: '👥' };
        case 'reseaux_sociaux':
          return { label: 'Réseaux sociaux', color: '#f59e0b', icon: '📱' };
        default:
          return { label: 'Autre', color: '#6b7280', icon: '📋' };
      }
    };

    // Tous les types d'actions possibles avec valeurs par défaut
    const allTypes = ['vente', 'recrutement', 'reseaux_sociaux'];

    // Créer les données pour le graphique (toujours inclure tous les types)
    const chartData = allTypes.map((type) => {
      const count = data[type] || 0;
      const info = getActionTypeInfo(type);
      return {
        name: info.label,
        value: count,
        color: info.color,
        type: type,
      };
    });

    const total = chartData.reduce((sum, entry) => sum + entry.value, 0);

    // Composant personnalisé pour afficher les valeurs dans chaque segment
    const renderCustomLabel = ({
      cx,
      cy,
      midAngle,
      innerRadius,
      outerRadius,
      value,
      percent,
    }: any) => {
      if (value === 0 || percent < 0.05) return null; // Ne pas afficher pour les segments vides ou très petits

      const RADIAN = Math.PI / 180;
      const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
      const x = cx + radius * Math.cos(-midAngle * RADIAN);
      const y = cy + radius * Math.sin(-midAngle * RADIAN);

      return (
        <text
          x={x}
          y={y}
          fill="white"
          textAnchor={x > cx ? 'start' : 'end'}
          dominantBaseline="central"
          fontSize={14}
          fontWeight="bold"
          stroke="rgba(0,0,0,0.3)"
          strokeWidth={0.5}
        >
          {value}
        </text>
      );
    };

    if (total === 0) {
      return (
        <div className="flex flex-col items-center justify-center">
          <div className="w-32 h-32 rounded-full border-4 border-gray-200 flex items-center justify-center mb-4">
            <span className="text-gray-400 text-lg">0</span>
          </div>
          <h3 className="text-lg font-semibold text-gray-800 text-center mb-4">
            Actions par type
          </h3>
          <div className="text-gray-400 text-sm mb-4">
            Aucune action réalisée
          </div>

          {/* Légende même quand pas de données */}
          <div className="grid grid-cols-1 gap-2 text-sm w-full">
            {allTypes.map((type) => {
              const info = getActionTypeInfo(type);
              return (
                <div key={type} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: info.color }}
                    />
                    <span className="text-gray-600">{info.label}</span>
                  </div>
                  <div className="text-gray-500 font-medium">0 (0%)</div>
                </div>
              );
            })}
          </div>
        </div>
      );
    }

    return (
      <div className="flex flex-col items-center gap-4">
        {/* Camembert Recharts plus grand */}
        <div className="relative w-full flex justify-center">
          <PieChart width={180} height={180}>
            <Pie
              data={chartData}
              cx={90}
              cy={90}
              innerRadius={30}
              outerRadius={70}
              paddingAngle={3}
              dataKey="value"
              labelLine={false}
              label={renderCustomLabel}
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
          </PieChart>
        </div>

        {/* Titre en dessous */}
        <h3 className="text-lg font-semibold text-gray-800 text-center">
          Actions par type
        </h3>

        {/* Légende complète avec tous les types */}
        <div className="grid grid-cols-1 gap-2 text-sm w-full">
          {allTypes.map((type) => {
            const count = data[type] || 0;
            const percentage = total > 0 ? (count / total) * 100 : 0;
            const info = getActionTypeInfo(type);

            return (
              <div key={type} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: info.color }}
                  />
                  <span className="text-gray-600">{info.label}</span>
                </div>
                <div
                  className={`font-medium ${count > 0 ? 'text-gray-800' : 'text-gray-400'}`}
                >
                  {count} ({Math.round(percentage)}%)
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen relative flex items-center justify-center">
        {/* Aurora Background */}
        <div className="absolute inset-0 z-0">
          <AuroraBackground
            colorStops={['#3B82F6', '#6366F1', '#8B5CF6']}
            blend={0.4}
            amplitude={1.0}
            speed={0.8}
          />
        </div>

        {/* Background overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50/80 via-indigo-50/60 to-purple-50/80 z-10"></div>

        <div className="text-center relative z-20">
          <UsersIcon className="w-12 h-12 text-blue-400 animate-pulse mx-auto mb-4" />
          <p className="text-gray-600">Chargement de votre équipe...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative">
      {/* Aurora Background */}
      <div className="absolute inset-0 z-0">
        <AuroraBackground
          colorStops={['#3B82F6', '#6366F1', '#8B5CF6']}
          blend={0.4}
          amplitude={1.0}
          speed={0.8}
        />
      </div>

      {/* Background overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50/80 via-indigo-50/60 to-purple-50/80 z-10"></div>

      {/* Header */}
      <div className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white p-6 shadow-lg relative z-20">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <UsersIcon className="w-8 h-8" />
              Dashboard Manager
            </h1>
            <p className="text-blue-100">Bonjour {user?.name} 👋</p>
          </div>
          <Button
            variant="flat"
            className="bg-white/20 text-white hover:bg-white/30"
            onPress={handleLogout}
          >
            Déconnexion
          </Button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-4 sm:p-6 relative z-20">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 mb-6 sm:mb-8">
          {/* Bloc consolidé d'équipe */}
          <Card className="bg-white/80 backdrop-blur-sm shadow-lg border-0 lg:col-span-1">
            <CardBody className="p-4 sm:p-6">
              <div className="flex items-center justify-center mb-3">
                <UsersIcon className="w-6 h-6 sm:w-8 sm:h-8 text-blue-500" />
              </div>
              <h3 className="text-xl sm:text-2xl font-bold text-gray-800 text-center mb-4">
                {teamStats.totalMembers}
              </h3>
              <p className="text-sm sm:text-base text-gray-600 text-center mb-4">
                Total équipe
              </p>

              {/* Sous-statistiques */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <BriefcaseIcon className="w-4 h-4 text-purple-500" />
                    <span className="text-sm text-gray-600">Managers</span>
                  </div>
                  <span className="text-sm font-semibold text-gray-800">
                    {teamStats.managers}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <UserGroupIcon className="w-4 h-4 text-blue-500" />
                    <span className="text-sm text-gray-600">FBOs</span>
                  </div>
                  <span className="text-sm font-semibold text-gray-800">
                    {teamStats.fbos}
                  </span>
                </div>
              </div>
            </CardBody>
          </Card>

          {/* Total des actions réalisées */}
          <Card className="bg-white/80 backdrop-blur-sm shadow-lg border-0">
            <CardBody className="p-4 sm:p-6">
              <div className="text-center mb-4">
                <ChartBarIcon className="w-6 h-6 sm:w-8 sm:h-8 text-green-500 mx-auto mb-2" />
                <h3 className="text-xl sm:text-2xl font-bold text-gray-800">
                  {teamStats.totalCompletedActions}
                </h3>
                <p className="text-sm sm:text-base text-gray-600">
                  Actions réalisées
                </p>
                {teamStats.totalPossibleActions > 0 && (
                  <p className="text-xs text-gray-500 mt-1">
                    / {teamStats.totalPossibleActions} possibles
                  </p>
                )}
              </div>

              {/* Barre de progression */}
              {teamStats.totalPossibleActions > 0 && (
                <div className="space-y-2">
                  <Progress
                    value={
                      (teamStats.totalCompletedActions /
                        teamStats.totalPossibleActions) *
                      100
                    }
                    className="w-full h-3"
                    color="success"
                  />
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>0</span>
                    <span className="font-medium">
                      {Math.round(
                        (teamStats.totalCompletedActions /
                          teamStats.totalPossibleActions) *
                          100,
                      )}
                      %
                    </span>
                    <span>{teamStats.totalPossibleActions}</span>
                  </div>
                </div>
              )}
            </CardBody>
          </Card>

          {/* Répartition des actions par type */}
          <Card className="bg-white/80 backdrop-blur-sm shadow-lg border-0">
            <CardBody className="p-4 sm:p-6">
              <ActionsPieChart data={teamStats.actionsByType} />
            </CardBody>
          </Card>
        </div>

        {/* Content */}
        <Card>
          <CardHeader className="p-4 border-b dark:border-gray-700">
            <div className="flex flex-col gap-4">
              <div>
                <h3 className="text-lg font-semibold mb-3">
                  Gestion de campagne
                </h3>

                {/* Campaign selector */}
                {allCampaigns.length > 0 && (
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
                            handleCampaignChange(
                              parseInt(selectedId as string),
                            );
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
                                  <span className="text-xs text-gray-600">
                                    {new Date(
                                      campaign.startDate,
                                    ).toLocaleDateString('fr-FR')}{' '}
                                    -{' '}
                                    {new Date(
                                      campaign.endDate,
                                    ).toLocaleDateString('fr-FR')}
                                  </span>
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
                            Jour{' '}
                            {calculateCurrentDay(
                              currentCampaign.startDate,
                              currentCampaign.endDate,
                            )}{' '}
                            /{' '}
                            {getTotalCampaignDays(
                              currentCampaign.startDate,
                              currentCampaign.endDate,
                            )}
                          </span>
                        </div>
                        <div className="hidden sm:block text-gray-400">•</div>
                        <div className="flex items-center gap-2">
                          <span>
                            {new Date(
                              currentCampaign.startDate,
                            ).toLocaleDateString('fr-FR')}{' '}
                            -{' '}
                            {new Date(
                              currentCampaign.endDate,
                            ).toLocaleDateString('fr-FR')}
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
                )}
              </div>
            </div>
          </CardHeader>
          <CardBody className="p-0">
            <Tabs aria-label="Gestion de campagne" className="w-full">
              <Tab key="overview" title="Aperçu de la campagne">
                <div className="p-4 sm:p-6">
                  {/* Filter */}
                  <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-6">
                    <div className="flex items-center gap-2">
                      <FunnelIcon className="w-4 h-4 text-gray-500" />
                      <span className="text-sm text-gray-600 font-medium">
                        Filtrer par rôle :
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        size="sm"
                        variant={roleFilter === 'all' ? 'solid' : 'flat'}
                        className={`px-4 py-2 text-sm font-medium rounded-full transition-colors ${
                          roleFilter === 'all'
                            ? 'bg-blue-500 text-white shadow-lg'
                            : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                        }`}
                        onPress={() => setRoleFilter('all')}
                      >
                        Tous ({teamMembers.length})
                      </Button>
                      <Button
                        size="sm"
                        variant={roleFilter === 'manager' ? 'solid' : 'flat'}
                        className={`px-4 py-2 text-sm font-medium rounded-full transition-colors ${
                          roleFilter === 'manager'
                            ? 'bg-purple-500 text-white shadow-lg'
                            : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                        }`}
                        onPress={() => setRoleFilter('manager')}
                      >
                        Managers ({teamStats.managers})
                      </Button>
                      <Button
                        size="sm"
                        variant={roleFilter === 'fbo' ? 'solid' : 'flat'}
                        className={`px-4 py-2 text-sm font-medium rounded-full transition-colors ${
                          roleFilter === 'fbo'
                            ? 'bg-blue-500 text-white shadow-lg'
                            : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                        }`}
                        onPress={() => setRoleFilter('fbo')}
                      >
                        FBOs ({teamStats.fbos})
                      </Button>
                    </div>
                  </div>

                  {/* Team Members List */}
                  {filteredMembers.length > 0 ? (
                    <div className="space-y-3 sm:space-y-4">
                      {filteredMembers.map((member) => {
                        const progressData = teamProgress.find(
                          (p) => p.userId === member.id,
                        );
                        const roleInfo = getRoleInfo(member.role);

                        return (
                          <div
                            key={member.id}
                            className="bg-white/50 backdrop-blur-sm rounded-lg p-3 sm:p-4 border border-gray-200 hover:shadow-md transition-all duration-200 cursor-pointer"
                            onClick={() => handleMemberClick(member)}
                          >
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                              <div className="flex items-center gap-3 min-w-0 flex-1">
                                <div
                                  className={`w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br ${roleInfo.color} rounded-full flex items-center justify-center text-white font-semibold text-sm sm:text-base flex-shrink-0 relative`}
                                >
                                  {member.name.charAt(0)}
                                  {/* Indicateur de rapport direct/indirect */}
                                  {member.isDirectReport === false && (
                                    <div
                                      className="absolute -top-1 -right-1 w-3 h-3 bg-orange-500 rounded-full border-2 border-white"
                                      title="Rapport indirect"
                                    />
                                  )}
                                </div>
                                <div className="min-w-0 flex-1">
                                  <div className="flex items-center gap-2 mb-1">
                                    <h4 className="font-medium text-gray-800 text-sm sm:text-base truncate">
                                      {member.name}
                                    </h4>
                                    <div
                                      className={`px-2 py-1 rounded-full ${roleInfo.bgColor} flex items-center gap-1`}
                                    >
                                      {roleInfo.icon}
                                      <span
                                        className={`text-xs font-medium ${roleInfo.textColor}`}
                                      >
                                        {roleInfo.label}
                                      </span>
                                    </div>
                                    {member.isDirectReport === false && (
                                      <div className="px-2 py-1 rounded-full bg-orange-100 flex items-center gap-1">
                                        <ChevronRightIcon className="w-3 h-3 text-orange-600" />
                                        <span className="text-xs font-medium text-orange-800">
                                          Indirect
                                        </span>
                                      </div>
                                    )}
                                  </div>
                                  <p className="text-xs sm:text-sm text-gray-500 truncate">
                                    {member.email}
                                  </p>
                                  {member.isDirectReport === false &&
                                    member.managerName && (
                                      <p className="text-xs text-orange-600 truncate mt-1">
                                        via {member.managerName}
                                      </p>
                                    )}
                                </div>
                              </div>
                              <div className="flex items-center gap-2 sm:gap-4">
                                <div className="text-right">
                                  <p className="text-xs sm:text-sm text-gray-500">
                                    Progression
                                  </p>
                                  <p className="font-semibold text-sm sm:text-base">
                                    {progressData?.campaignProgress?.progressPercentage?.toFixed(
                                      0,
                                    ) || '0'}
                                    %
                                  </p>
                                </div>
                                <ChevronRightIcon className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 flex-shrink-0" />
                              </div>
                            </div>

                            {progressData?.campaignProgress &&
                            progressData?.campaignProgress.dailyChallenges ? (
                              <div className="relative mt-2">
                                <div className="flex w-full h-3 space-x-1">
                                  {progressData?.campaignProgress.dailyChallenges.map(
                                    (challenge) => {
                                      const { color, label } =
                                        getChallengeStatus(challenge);
                                      return (
                                        <div
                                          key={challenge.challengeId}
                                          className={`relative flex-1 rounded-full transition-all duration-300 ${color}`}
                                          title={`Jour ${challenge.dayNumber} - ${label}: ${challenge.completedActions}/${challenge.totalActions} actions`}
                                        >
                                          {challenge.isToday && (
                                            <div className="absolute inset-0 flex items-center justify-center">
                                              <div className="w-1.5 h-1.5 bg-white rounded-full ring-1 ring-black/20"></div>
                                            </div>
                                          )}
                                        </div>
                                      );
                                    },
                                  )}
                                </div>
                              </div>
                            ) : (
                              <div className="text-center text-gray-500 py-4">
                                Aucune donnée de campagne pour ce membre.
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-gray-500">
                        {roleFilter === 'all'
                          ? "Aucun membre dans l'équipe pour le moment."
                          : `Aucun ${roleFilter === 'manager' ? 'manager' : 'FBO'} dans l'équipe pour le moment.`}
                      </p>
                    </div>
                  )}
                </div>
              </Tab>

              <Tab key="validation" title="Validation de la campagne">
                <div className="p-4 sm:p-6">
                  {currentCampaign ? (
                    <CampaignValidationSection
                      campaignId={currentCampaign.id}
                      campaignName={currentCampaign.name}
                    />
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-gray-500">Aucune campagne active</p>
                    </div>
                  )}
                </div>
              </Tab>
            </Tabs>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
