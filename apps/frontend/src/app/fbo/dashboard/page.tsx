'use client';

import { useEffect, useState } from 'react';
import {
  Card,
  CardBody,
  Button,
  Badge,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Input,
  AuroraBackground,
  MultiProofUpload,
  MultiProofViewer,
} from '@/components/ui';
import { Chip, useDisclosure, Accordion, AccordionItem } from '@heroui/react';
import {
  SunIcon,
  CheckCircleIcon,
  ClockIcon,
  CameraIcon,
  CurrencyEuroIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  EyeIcon,
  CheckIcon,
} from '@heroicons/react/24/outline';
import { ApiClient, API_ENDPOINTS } from '@/services/api';

// Hooks personnalisés
import { useDashboardData } from '@/hooks/useDashboardData';
import { useDashboardAnimations } from '@/hooks/useDashboardAnimations';
import { useBonusActions } from '@/hooks/useBonusActions';
import { useBonusProofs, useMultipleProofUpload } from '@/hooks';

// Composants
import {
  DashboardHeader,
  ProgressSection,
  NextChallengesSection,
  StatisticsSection,
} from '@/components/dashboard';
import { CampaignValidationStatus } from '@/components/CampaignValidationStatus';
import { CampaignVideoPlayer } from '@/components/campaigns';

// Types et utilitaires
import { Action } from '@/types/dashboard';
import type { ProofFile } from '@/types/proofs';
import {
  isActionCompleted,
  getUserAction,
  allTodayActionsCompleted,
  getBonusTypeLabel,
  formatBonusDate,
} from '@/utils/dashboard';
import { ACTION_TYPE_CONFIG, BONUS_TYPES } from '@/constants/dashboard';

export default function FBODashboard() {
  // Hooks personnalisés pour la logique métier
  const {
    user,
    userActions,
    loading,
    activeCampaign,
    todayChallenge,
    nextChallenge,
    challengeActions,
    nextChallengeActions,
    earningsData,
    myBonuses,
    campaignStats,
    bonusStats,
    userStreaks,
    userBadges,
    campaignsLoading,
    challengesLoading,
    bonusesLoading,
    handleLogout,
    refetchUserActions,
    refetchGamificationData,
  } = useDashboardData();

  // Hooks pour les animations
  const {
    isMobile,
    isMoneyUpdated,
    showConfetti,
    showNextChallengeEmphasis,
    completedActionsCollapsed,
    setCompletedActionsCollapsed,
    triggerNextChallengeAnimation,
    triggerTestAnimation,
  } = useDashboardAnimations(
    earningsData.totalEarnings,
    loading || campaignsLoading || challengesLoading || bonusesLoading,
  );

  // Hooks pour les actions de bonus
  const {
    bonusModalOpen,
    bonusType,
    bonusSubmitting,
    bonusAccordionOpen,
    selectedBonusProof,
    bonusProofModalOpen,
    bonusProofUrl,
    loadingBonusProof,
    openBonusModal,
    closeBonusModal: originalCloseBonusModal,
    setBonusAccordionOpen,
    handleViewBonusProof,
    closeBonusProofModal,
  } = useBonusActions(activeCampaign?.id, triggerTestAnimation);

  // Hook pour gérer les preuves multiples des bonus
  const bonusProofsHook = useBonusProofs();

  // Adapter closeBonusModal pour gérer les nouveaux fichiers
  const closeBonusModal = () => {
    originalCloseBonusModal();
    setBonusProofFiles([]);
  };

  // États locaux pour la logique spécifique au composant
  const [selectedAction, setSelectedAction] = useState<Action | null>(null);
  const [selectedUserAction, setSelectedUserAction] = useState<any>(null);
  const [isNextChallenge, setIsNextChallenge] = useState(false);
  const [actionProofFiles, setActionProofFiles] = useState<ProofFile[]>([]);
  const [bonusProofFiles, setBonusProofFiles] = useState<ProofFile[]>([]);
  const [enrichedBonuses, setEnrichedBonuses] = useState<any[]>([]);

  // Modal states
  const { isOpen, onOpen, onClose } = useDisclosure();

  // Enrichir les bonus avec le comptage de preuves
  useEffect(() => {
    const enrichBonuses = async () => {
      if (myBonuses && myBonuses.length > 0) {
        try {
          const enriched =
            await bonusProofsHook.enrichBonusesWithProofCounts(myBonuses);
          setEnrichedBonuses(enriched);
        } catch (error) {
          console.error("Erreur lors de l'enrichissement des bonus:", error);
          setEnrichedBonuses(myBonuses); // Fallback aux bonus non enrichis
        }
      } else {
        setEnrichedBonuses([]);
      }
    };

    enrichBonuses();
  }, [myBonuses]);

  // Hook pour l'upload multiple de preuves
  const { uploadMultipleProofs, isUploading } = useMultipleProofUpload();

  // Derived state
  const shouldShowNextChallenges =
    allTodayActionsCompleted(challengeActions, userActions) &&
    nextChallenge &&
    challengeActions.length > 0;

  // Déclencher l'animation des prochains défis quand nécessaire
  useEffect(() => {
    triggerNextChallengeAnimation(Boolean(shouldShowNextChallenges));
  }, [shouldShowNextChallenges, triggerNextChallengeAnimation]);

  // Fonctions de gestion des actions
  const handleCompleteAction = (
    action: Action,
    userAction?: any,
    isNextChallenge: boolean = false,
  ) => {
    setSelectedAction(action);
    setSelectedUserAction(userAction);
    setIsNextChallenge(isNextChallenge);
    setActionProofFiles([]); // Reset des fichiers
    onOpen();
  };

  const submitCompletion = async () => {
    if (!selectedAction || !user) return;

    try {
      const challengeId = isNextChallenge
        ? nextChallenge?.id
        : todayChallenge?.id;

      if (!challengeId) {
        throw new Error('ID du défi manquant');
      }

      // 1. Créer l'user action
      const userActionData = {
        actionId: selectedAction.id,
        challengeId: challengeId,
        completed: true,
      };

      const response = await ApiClient.post('/user-actions', userActionData);

      if (!response.ok) {
        throw new Error("Erreur lors de la création de l'action utilisateur");
      }

      const userAction = await response.json();
      console.log('✅ User action créée:', userAction);

      // 2. Upload des preuves multiples si présentes
      if (actionProofFiles.length > 0 && userAction.id) {
        console.log(`📤 Upload de ${actionProofFiles.length} preuve(s)...`);

        const files = actionProofFiles.map((pf) => pf.file);

        try {
          await uploadMultipleProofs(files, {
            type: 'user-action',
            id: userAction.id,
          });
          console.log('✅ Toutes les preuves uploadées avec succès');
        } catch (error) {
          console.warn(
            "⚠️ Erreur lors de l'upload des preuves, mais action créée:",
            error,
          );
        }
      }

      setActionProofFiles([]); // Reset des fichiers
      onClose();

      // Rafraîchir les données
      refetchUserActions();
      refetchGamificationData();
    } catch (error) {
      console.error("❌ Erreur lors de la completion de l'action:", error);
      // Afficher l'erreur à l'utilisateur (vous pourriez ajouter un toast ici)
    }
  };

  // Fonction pour soumettre un bonus avec callback de rafraîchissement
  const handleBonusSubmitWithRefresh = async () => {
    if (!bonusType || bonusProofFiles.length === 0) {
      console.error('Type de bonus ou fichiers de preuve manquants');
      return;
    }

    try {
      if (!activeCampaign?.id) {
        throw new Error('Aucune campagne active trouvée');
      }

      const currentDate = new Date().toISOString().split('T')[0];
      const amount = bonusType === 'sponsorship' ? '5.00' : '1.00';

      // 1. Créer le bonus
      const bonusData = {
        campaignId: activeCampaign.id,
        bonusDate: currentDate,
        bonusType: bonusType,
        amount: amount,
      };

      console.log('🚀 Création du bonus:', bonusData);
      const response = await ApiClient.post('/daily-bonus', bonusData);

      if (!response.ok) {
        throw new Error('Erreur lors de la création du bonus');
      }

      const bonus = await response.json();
      console.log('✅ Bonus créé:', bonus);

      // 2. Upload des preuves multiples
      if (bonusProofFiles.length > 0 && bonus.id) {
        console.log(
          `📤 Upload de ${bonusProofFiles.length} preuve(s) pour le bonus...`,
        );

        const files = bonusProofFiles.map((pf) => pf.file);

        await uploadMultipleProofs(files, {
          type: 'daily-bonus',
          id: bonus.id,
        });
        console.log('✅ Toutes les preuves du bonus uploadées avec succès');
      }

      // Fermer la modal et réinitialiser
      closeBonusModal();
      setBonusProofFiles([]);

      // Déclencher l'animation des gains
      if (triggerTestAnimation) {
        console.log("🎉 Déclenchement de l'animation des gains pour le bonus");
        triggerTestAnimation();
      }

      // Rafraîchir les données
      refetchGamificationData();
    } catch (error) {
      console.error('❌ Erreur lors de la déclaration du bonus:', error);
      throw error;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen relative flex items-center justify-center">
        {/* Aurora Background */}
        <div className="absolute inset-0 z-0">
          <AuroraBackground
            colorStops={['#FFA500', '#FFD700', '#FF6347', '#FF4500']}
            amplitude={0.3}
            blend={0.8}
            speed={0.5}
          />
        </div>

        {/* Background overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-orange-50/80 via-amber-50/60 to-yellow-50/80 z-10"></div>

        <div className="text-center relative z-20">
          <SunIcon className="w-12 h-12 text-orange-400 animate-pulse mx-auto mb-4" />
          <p className="text-gray-600">Chargement de tes défis...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-100 relative">
      {/* Aurora Background */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <AuroraBackground
          colorStops={['#FFA500', '#FFD700', '#FF6347', '#FF4500']}
          amplitude={0.3}
          blend={0.8}
          speed={0.5}
        />
      </div>

      {/* Header avec gains */}
      <DashboardHeader
        user={user}
        activeCampaign={activeCampaign}
        todayChallenge={todayChallenge}
        earningsData={earningsData}
        isMoneyUpdated={isMoneyUpdated}
        showConfetti={showConfetti}
        isMobile={isMobile}
        triggerTestAnimation={triggerTestAnimation}
        onLogout={handleLogout}
      />

      <div className="max-w-4xl mx-auto p-4 sm:p-6 relative z-10">
        {/* Section progression */}
        <ProgressSection
          challengeActions={challengeActions}
          userActions={userActions}
        />

        {/* Statut de validation de campagne */}
        {activeCampaign && (
          <div className="mb-6 sm:mb-8">
            <CampaignValidationStatus
              campaignId={activeCampaign.id}
              campaignName={activeCampaign.name}
            />
          </div>
        )}

        {/* Vidéo de présentation de la campagne */}
        {activeCampaign?.presentationVideoUrl && (
          <div className="mb-6 sm:mb-8">
            <CampaignVideoPlayer
              campaignId={activeCampaign.id}
              campaignName={activeCampaign.name}
              showInModal={true}
            />
          </div>
        )}

        {/* Section prochains défis */}
        {shouldShowNextChallenges && nextChallenge && (
          <NextChallengesSection
            nextChallenge={nextChallenge}
            nextChallengeActions={nextChallengeActions}
            showNextChallengeEmphasis={showNextChallengeEmphasis}
            onActionClick={(action) =>
              handleCompleteAction(action, undefined, true)
            }
          />
        )}

        {/* Grille des actions */}
        <div className="grid gap-6 sm:gap-8 mb-6 sm:mb-8">
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
          ) : allTodayActionsCompleted(challengeActions, userActions) ? (
            // Actions terminées - Accordéon fermé par défaut
            <Accordion
              variant="splitted"
              className="px-0"
              selectedKeys={
                completedActionsCollapsed ? [] : ['completed-actions']
              }
              onSelectionChange={(keys) => {
                setCompletedActionsCollapsed(
                  !Array.from(keys).includes('completed-actions'),
                );
              }}
            >
              <AccordionItem
                key="completed-actions"
                aria-label="Actions du jour terminées"
                title={
                  <div className="flex items-center justify-between w-full">
                    <div className="flex items-center gap-3">
                      <CheckCircleIcon className="w-5 h-5 text-green-600" />
                      <span className="text-lg font-semibold text-green-800">
                        ✨ Bravo ! Toutes tes actions du jour sont terminées !
                      </span>
                    </div>
                  </div>
                }
                className="bg-gradient-to-br from-green-50 to-emerald-100 border-0 shadow-lg rounded-lg"
                classNames={{
                  trigger: 'py-4 px-6',
                  content: 'px-6 pb-6',
                  title: 'text-left w-full',
                  indicator: 'text-medium',
                }}
              >
                <div className="grid gap-3">
                  {challengeActions
                    .sort((a, b) => a.order - b.order)
                    .map((action) => {
                      const config = ACTION_TYPE_CONFIG[action.type];
                      const userAction = getUserAction(action, userActions);

                      return (
                        <div
                          key={action.id}
                          className="bg-white/70 rounded-lg p-4 border border-green-200"
                        >
                          <div className="flex items-start gap-3">
                            <div className="flex items-center gap-2">
                              <CheckCircleIcon className="w-5 h-5 text-green-600" />
                              <span className="text-lg flex-shrink-0">
                                {config.icon}
                              </span>
                            </div>
                            <div className="flex-1">
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
                              <h5 className="font-medium text-gray-800 text-sm mb-1">
                                {action.title}
                              </h5>
                              <p className="text-xs text-gray-600 mb-2">
                                {action.description}
                              </p>
                              {userAction?.completedAt && (
                                <p className="text-xs text-green-600">
                                  ✅ Complétée le{' '}
                                  {new Date(
                                    userAction.completedAt,
                                  ).toLocaleDateString('fr-FR')}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                </div>
              </AccordionItem>
            </Accordion>
          ) : (
            // Actions en cours
            <div className="grid gap-4">
              {challengeActions
                .sort((a, b) => a.order - b.order)
                .map((action) => {
                  const config = ACTION_TYPE_CONFIG[action.type];
                  const actionCompleted = isActionCompleted(
                    action,
                    userActions,
                  );
                  const userAction = getUserAction(action, userActions);

                  return (
                    <Card
                      key={action.id}
                      className={`transition-all duration-200 cursor-pointer hover:shadow-lg ${
                        actionCompleted
                          ? 'bg-gradient-to-r from-green-50 to-emerald-50 border-green-200'
                          : 'bg-white/80 backdrop-blur-sm hover:bg-white/90'
                      }`}
                      isPressable
                      onPress={() => handleCompleteAction(action, userAction)}
                    >
                      <CardBody className="p-4 sm:p-6">
                        <div className="flex items-start gap-4">
                          <div className="flex items-center gap-2">
                            {actionCompleted ? (
                              <CheckCircleIcon className="w-6 h-6 text-green-600" />
                            ) : (
                              <div className="w-6 h-6 border-2 border-gray-300 rounded-full flex items-center justify-center">
                                <span className="w-3 h-3 bg-gray-300 rounded-full"></span>
                              </div>
                            )}
                            <span className="text-2xl flex-shrink-0">
                              {config.icon}
                            </span>
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-2 flex-wrap">
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
                              {actionCompleted && (
                                <Badge color="success" variant="flat" size="sm">
                                  ✅ Terminée
                                </Badge>
                              )}
                            </div>

                            <h3 className="font-semibold text-gray-800 text-sm sm:text-base mb-2">
                              {action.title}
                            </h3>
                            <p className="text-gray-600 text-xs sm:text-sm leading-relaxed mb-3">
                              {action.description}
                            </p>

                            {actionCompleted && userAction?.completedAt && (
                              <p className="text-xs text-green-600 mb-2">
                                ✅ Complétée le{' '}
                                {new Date(
                                  userAction.completedAt,
                                ).toLocaleDateString('fr-FR')}
                              </p>
                            )}

                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <CameraIcon className="w-4 h-4 text-gray-400" />
                                <span className="text-xs text-gray-500">
                                  {actionCompleted
                                    ? 'Preuve envoyée'
                                    : 'Photo requise'}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardBody>
                    </Card>
                  );
                })}
            </div>
          )}
        </div>

        {/* Section Bonus */}
        {activeCampaign && (
          <Card className="mb-8 sm:mb-10 bg-white/80 backdrop-blur-sm shadow-lg border-0">
            <CardBody className="p-4 sm:p-6">
              <h3 className="text-lg sm:text-xl font-semibold text-gray-800 mb-4">
                💰 Déclarer un Bonus
              </h3>
              <p className="text-gray-600 text-sm mb-6">
                Gagne des bonus supplémentaires en déclarant tes parrainages et
                dépôts de panier !
              </p>

              <div className="grid gap-4 sm:grid-cols-2">
                <Button
                  className={`bg-gradient-to-r ${BONUS_TYPES.sponsorship.color} text-white h-14 justify-start pl-4 pr-6`}
                  size="lg"
                  onPress={() => openBonusModal('sponsorship')}
                >
                  <span className="text-2xl mr-3">
                    {BONUS_TYPES.sponsorship.icon}
                  </span>
                  <div className="text-left">
                    <div className="font-semibold text-sm">
                      Déclarer un {BONUS_TYPES.sponsorship.label}
                    </div>
                    <div className="text-xs opacity-80">
                      +{BONUS_TYPES.sponsorship.amount}€ bonus
                    </div>
                  </div>
                </Button>

                <Button
                  className={`bg-gradient-to-r ${BONUS_TYPES.basket.color} text-white h-14 justify-start pl-4 pr-6`}
                  size="lg"
                  onPress={() => openBonusModal('basket')}
                >
                  <span className="text-2xl mr-3">
                    {BONUS_TYPES.basket.icon}
                  </span>
                  <div className="text-left">
                    <div className="font-semibold text-sm">
                      Déclarer un {BONUS_TYPES.basket.label}
                    </div>
                    <div className="text-xs opacity-80">
                      +{BONUS_TYPES.basket.amount}€ bonus
                    </div>
                  </div>
                </Button>
              </div>
            </CardBody>
          </Card>
        )}

        {/* Section Accordéon Bonus Déclarés */}
        {activeCampaign && (
          <Card className="mb-8 sm:mb-10 bg-white/80 backdrop-blur-sm shadow-lg border-0">
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
                        Mes Bonus Déclarés
                      </h3>

                      {/* Affichage des stats des bonus */}
                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <span className="flex items-center gap-1">
                          <span className="text-amber-600 font-semibold">
                            {earningsData.totalBonusAmount.toFixed(2)}€
                          </span>
                          au total
                        </span>
                        <span>•</span>
                        <span>{myBonuses.length} bonus déclarés</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
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
                  {enrichedBonuses.length === 0 ? (
                    <div className="text-center p-8">
                      <CurrencyEuroIcon className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-600 mb-2">
                        Aucun bonus déclaré
                      </h3>
                      <p className="text-gray-500">
                        Vous n'avez pas encore déclaré de bonus pour cette
                        campagne.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {enrichedBonuses.map((bonus) => (
                        <div
                          key={bonus.id}
                          className="p-4 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                              <span className="text-lg">
                                {bonus.bonusType === 'basket' ? '🛒' : '🤝'}
                              </span>
                              <div>
                                <div className="font-medium text-sm">
                                  {getBonusTypeLabel(bonus.bonusType)}
                                </div>
                                <div className="text-xs text-gray-500">
                                  {formatBonusDate(bonus.bonusDate)}
                                </div>
                              </div>
                              <Badge color="success" variant="flat">
                                +{bonus.amount}€
                              </Badge>
                            </div>

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
                      ))}
                    </div>
                  )}
                </div>
              )}
            </CardBody>
          </Card>
        )}

        {/* Section Statistiques dans un accordéon */}
        <StatisticsSection
          campaignStats={campaignStats}
          userStreaks={userStreaks}
          userBadges={userBadges}
        />
      </div>

      {/* Modal de completion d'action */}
      <Modal isOpen={isOpen} onClose={onClose} size="2xl">
        <ModalContent>
          <ModalHeader className="pb-2">
            <div className="flex flex-col">
              <h2 className="text-xl font-bold text-gray-900">
                {selectedAction?.title}
              </h2>
              <p className="text-sm text-gray-700 font-normal mt-1">
                {selectedAction?.description}
              </p>
            </div>
          </ModalHeader>
          <ModalBody>
            <div className="space-y-4">
              <p className="text-sm text-gray-800 font-medium">
                {selectedUserAction?.completed
                  ? "Cette action a déjà été complétée. Vous pouvez ajouter jusqu'à 5 preuves supplémentaires ou modifier les preuves existantes."
                  : "Ajoutez jusqu'à 5 preuves (photos ou vidéos) pour valider cette action."}
              </p>

              <MultiProofUpload
                files={actionProofFiles}
                onFilesChange={setActionProofFiles}
                maxFiles={5}
                disabled={isUploading}
              />

              {selectedUserAction?.proofUrl && (
                <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <p className="text-sm text-blue-900 font-medium">
                    ✅ Des preuves ont déjà été envoyées pour cette action.
                  </p>
                  <p className="text-xs text-blue-700 mt-1">
                    Vous pouvez ajouter de nouvelles preuves qui s'ajouteront
                    aux preuves existantes.
                  </p>
                </div>
              )}
            </div>
          </ModalBody>
          <ModalFooter>
            <Button
              variant="light"
              onPress={onClose}
              className="text-gray-700 font-medium"
            >
              Annuler
            </Button>
            <Button
              color="primary"
              onPress={submitCompletion}
              className="font-medium"
              isLoading={isUploading}
              isDisabled={
                actionProofFiles.length === 0 && !selectedUserAction?.completed
              }
            >
              {selectedUserAction?.completed
                ? 'Ajouter preuves'
                : 'Valider avec preuves'}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Modal de déclaration de bonus */}
      <Modal isOpen={bonusModalOpen} onClose={closeBonusModal} size="lg">
        <ModalContent>
          <ModalHeader className="pb-2">
            <h2 className="text-xl font-bold text-gray-900">
              Déclarer un {bonusType ? getBonusTypeLabel(bonusType) : 'Bonus'}
            </h2>
          </ModalHeader>
          <ModalBody>
            <div className="space-y-4">
              <p className="text-sm text-gray-800 font-medium">
                Ajoutez jusqu'à 5 preuves (photos ou vidéos) pour votre{' '}
                {bonusType
                  ? getBonusTypeLabel(bonusType).toLowerCase()
                  : 'bonus'}
                .
              </p>

              <MultiProofUpload
                files={bonusProofFiles}
                onFilesChange={setBonusProofFiles}
                maxFiles={5}
                disabled={bonusSubmitting || isUploading}
              />

              {bonusType && (
                <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                  <p className="text-sm text-green-900 font-medium">
                    💰 Ce bonus vous rapportera +
                    {bonusType === 'sponsorship' ? '5' : '1'}€
                  </p>
                </div>
              )}
            </div>
          </ModalBody>
          <ModalFooter>
            <Button
              variant="light"
              onPress={closeBonusModal}
              className="text-gray-700 font-medium"
            >
              Annuler
            </Button>
            <Button
              color="primary"
              onPress={handleBonusSubmitWithRefresh}
              isLoading={bonusSubmitting || isUploading}
              isDisabled={bonusProofFiles.length === 0}
              className="font-medium"
            >
              Déclarer le bonus avec preuves
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Modal de visualisation de preuve de bonus */}
      <Modal
        isOpen={bonusProofModalOpen}
        onClose={closeBonusProofModal}
        size="2xl"
      >
        <ModalContent>
          <ModalHeader className="pb-2">
            <h2 className="text-xl font-bold text-gray-900">
              Preuve de{' '}
              {selectedBonusProof
                ? getBonusTypeLabel(selectedBonusProof.bonusType)
                : 'Bonus'}
            </h2>
          </ModalHeader>
          <ModalBody>
            {bonusProofUrl ? (
              <div className="text-center">
                <img
                  src={bonusProofUrl}
                  alt="Preuve de bonus"
                  className="max-w-full max-h-96 mx-auto rounded-lg shadow-lg"
                />
                {selectedBonusProof && (
                  <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <p className="text-sm text-gray-800 font-medium text-center">
                      {getBonusTypeLabel(selectedBonusProof.bonusType)} déclaré
                      le {formatBonusDate(selectedBonusProof.bonusDate)} -{' '}
                      {selectedBonusProof.amount}€
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center p-8">
                <div className="w-16 h-16 border-4 border-gray-300 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-gray-800 font-medium">
                  Chargement de la preuve...
                </p>
              </div>
            )}
          </ModalBody>
          <ModalFooter>
            <Button
              onPress={closeBonusProofModal}
              className="text-gray-700 font-medium"
            >
              Fermer
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

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
