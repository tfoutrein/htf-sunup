'use client';

import { useState } from 'react';
import {
  Card,
  CardHeader,
  CardBody,
  Button,
  Chip,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure,
  Spinner,
  Textarea,
  Select,
  SelectItem,
} from '@heroui/react';
import { addToast } from '@heroui/toast';
import {
  ArrowLeftIcon,
  CurrencyEuroIcon,
  CheckIcon,
  XMarkIcon,
  EyeIcon,
  CalendarDaysIcon,
  UserIcon,
} from '@heroicons/react/24/outline';
import { useRouter } from 'next/navigation';
import {
  useActiveCampaigns,
  useCampaignBonuses,
  useUpdateDailyBonus,
} from '@/hooks';
import { DailyBonus } from '@/types/daily-bonus';
import { BONUS_TYPE_CONFIG, BONUS_STATUS_CONFIG } from '@/types/daily-bonus';

export default function ManagerDailyBonusPage() {
  const router = useRouter();
  const [selectedBonus, setSelectedBonus] = useState<DailyBonus | null>(null);
  const [reviewComment, setReviewComment] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const { isOpen, onOpen, onClose } = useDisclosure();
  const { data: activeCampaigns = [], isLoading: campaignsLoading } =
    useActiveCampaigns();
  const activeCampaign = activeCampaigns[0] || null;

  const {
    data: bonuses = [],
    isLoading: bonusesLoading,
    error,
  } = useCampaignBonuses(activeCampaign?.id || 0);
  const updateBonus = useUpdateDailyBonus();

  const handleReviewBonus = (
    bonus: DailyBonus,
    status: 'approved' | 'rejected',
  ) => {
    setSelectedBonus({ ...bonus, status });
    setReviewComment('');
    onOpen();
  };

  const submitReview = async () => {
    if (!selectedBonus) return;

    try {
      await updateBonus.mutateAsync({
        id: selectedBonus.id,
        data: {
          status: selectedBonus.status,
          reviewComment: reviewComment.trim() || undefined,
        },
      });

      const statusText =
        selectedBonus.status === 'approved' ? 'approuvé' : 'rejeté';
      addToast({
        title: 'Succès',
        description: `Bonus ${statusText} avec succès`,
        color: 'success',
      });
      onClose();
      setSelectedBonus(null);
      setReviewComment('');
    } catch (error: any) {
      addToast({
        title: 'Erreur',
        description: error.message || 'Erreur lors de la révision du bonus',
        color: 'danger',
      });
    }
  };

  // Filter bonuses based on status
  const filteredBonuses = bonuses.filter((bonus) => {
    if (statusFilter === 'all') return true;
    return bonus.status === statusFilter;
  });

  // Group bonuses by status
  const bonusesByStatus = {
    pending: filteredBonuses.filter((b) => b.status === 'pending'),
    approved: filteredBonuses.filter((b) => b.status === 'approved'),
    rejected: filteredBonuses.filter((b) => b.status === 'rejected'),
  };

  if (campaignsLoading || bonusesLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-4">
        <div className="max-w-6xl mx-auto">
          <div className="flex justify-center items-center min-h-[400px]">
            <div className="text-center">
              <Spinner size="lg" color="primary" />
              <p className="text-gray-600 mt-4">Chargement...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!activeCampaign) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-4">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center gap-4 mb-6">
            <Button
              variant="light"
              startContent={<ArrowLeftIcon className="w-4 h-4" />}
              onPress={() => router.push('/manager/dashboard')}
            >
              Retour au dashboard
            </Button>
          </div>

          <Card>
            <CardBody className="text-center p-8">
              <CurrencyEuroIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-700 mb-2">
                Aucune campagne active
              </h3>
              <p className="text-gray-500">
                Il n'y a actuellement aucune campagne active à gérer.
              </p>
            </CardBody>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-4">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <Button
                variant="light"
                startContent={<ArrowLeftIcon className="w-4 h-4" />}
                onPress={() => router.push('/manager/dashboard')}
              >
                Retour au dashboard
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-gray-800">
                  Gestion des Bonus Quotidiens
                </h1>
                <p className="text-sm text-gray-600">
                  Campagne: {activeCampaign.name}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <CurrencyEuroIcon className="w-6 h-6 text-amber-600" />
              <span className="text-lg font-semibold text-gray-800">
                {bonuses.length} bonus total
              </span>
            </div>
          </div>

          {/* Filters */}
          <Card className="mb-6">
            <CardBody className="p-4">
              <div className="flex items-center gap-4">
                <span className="text-sm font-medium text-gray-700">
                  Filtrer par statut:
                </span>
                <Select
                  size="sm"
                  selectedKeys={statusFilter ? [statusFilter] : []}
                  onSelectionChange={(keys) => {
                    const selectedKey = Array.from(keys)[0] as string;
                    setStatusFilter(selectedKey || 'all');
                  }}
                  className="w-48"
                >
                  <SelectItem key="all">
                    Tous les statuts ({bonuses.length})
                  </SelectItem>
                  <SelectItem key="pending">
                    En attente ({bonusesByStatus.pending.length})
                  </SelectItem>
                  <SelectItem key="approved">
                    Approuvés ({bonusesByStatus.approved.length})
                  </SelectItem>
                  <SelectItem key="rejected">
                    Rejetés ({bonusesByStatus.rejected.length})
                  </SelectItem>
                </Select>
              </div>
            </CardBody>
          </Card>

          {/* Bonus List */}
          {error ? (
            <Card className="border-danger-200">
              <CardBody className="text-center p-6">
                <p className="text-danger-600">
                  Erreur lors du chargement des bonus
                </p>
              </CardBody>
            </Card>
          ) : filteredBonuses.length === 0 ? (
            <Card>
              <CardBody className="text-center p-8">
                <CurrencyEuroIcon className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-600 mb-2">
                  Aucun bonus {statusFilter !== 'all' ? `${statusFilter}` : ''}
                </h3>
                <p className="text-gray-500">
                  {statusFilter === 'all'
                    ? "Aucun bonus quotidien n'a été créé pour cette campagne."
                    : `Aucun bonus ${statusFilter} pour le moment.`}
                </p>
              </CardBody>
            </Card>
          ) : (
            <div className="space-y-4">
              {filteredBonuses.map((bonus) => {
                const typeConfig = BONUS_TYPE_CONFIG[bonus.bonusType];
                const statusConfig = BONUS_STATUS_CONFIG[bonus.status];

                return (
                  <Card
                    key={bonus.id}
                    className="hover:shadow-md transition-shadow"
                  >
                    <CardBody className="p-4">
                      <div className="flex items-center justify-between">
                        {/* Left side - Bonus Info */}
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-3">
                            <span className="text-2xl">{typeConfig.emoji}</span>
                            <div>
                              <h3 className="font-semibold text-gray-800">
                                {typeConfig.label}
                              </h3>
                              <div className="flex items-center gap-4 text-sm text-gray-600">
                                <div className="flex items-center gap-1">
                                  <UserIcon className="w-4 h-4" />
                                  {bonus.user?.name || 'Utilisateur inconnu'}
                                </div>
                                <div className="flex items-center gap-1">
                                  <CalendarDaysIcon className="w-4 h-4" />
                                  {new Date(bonus.bonusDate).toLocaleDateString(
                                    'fr-FR',
                                  )}
                                </div>
                                <div className="flex items-center gap-1">
                                  <CurrencyEuroIcon className="w-4 h-4 text-amber-600" />
                                  <span className="font-semibold text-amber-700">
                                    {bonus.amount}€
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Center - Status */}
                        <div className="flex items-center gap-2">
                          <Chip
                            size="sm"
                            color={statusConfig.color}
                            variant="flat"
                            startContent={<span>{statusConfig.emoji}</span>}
                          >
                            {statusConfig.label}
                          </Chip>
                        </div>

                        {/* Right side - Actions */}
                        <div className="flex items-center gap-2">
                          {bonus.proofUrl && (
                            <Button
                              size="sm"
                              color="default"
                              variant="light"
                              onPress={() =>
                                window.open(bonus.proofUrl, '_blank')
                              }
                              startContent={<EyeIcon className="w-4 h-4" />}
                            >
                              Voir preuve
                            </Button>
                          )}

                          {bonus.status === 'pending' && (
                            <>
                              <Button
                                size="sm"
                                color="success"
                                variant="flat"
                                onPress={() =>
                                  handleReviewBonus(bonus, 'approved')
                                }
                                startContent={<CheckIcon className="w-4 h-4" />}
                                isLoading={updateBonus.isPending}
                              >
                                Approuver
                              </Button>

                              <Button
                                size="sm"
                                color="danger"
                                variant="flat"
                                onPress={() =>
                                  handleReviewBonus(bonus, 'rejected')
                                }
                                startContent={<XMarkIcon className="w-4 h-4" />}
                                isLoading={updateBonus.isPending}
                              >
                                Rejeter
                              </Button>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Review Comment */}
                      {bonus.reviewComment && (
                        <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                          <p className="text-sm text-gray-600">
                            <strong>Commentaire:</strong> {bonus.reviewComment}
                          </p>
                          {bonus.reviewer && (
                            <p className="text-xs text-gray-500 mt-1">
                              Par {bonus.reviewer.name} •{' '}
                              {bonus.reviewedAt &&
                                new Date(bonus.reviewedAt).toLocaleDateString(
                                  'fr-FR',
                                )}
                            </p>
                          )}
                        </div>
                      )}
                    </CardBody>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Review Modal */}
      <Modal isOpen={isOpen} onClose={onClose} size="md">
        <ModalContent>
          <ModalHeader>
            <div className="flex items-center gap-2">
              {selectedBonus?.status === 'approved' ? (
                <CheckIcon className="w-5 h-5 text-success-600" />
              ) : (
                <XMarkIcon className="w-5 h-5 text-danger-600" />
              )}
              {selectedBonus?.status === 'approved' ? 'Approuver' : 'Rejeter'}{' '}
              le bonus
            </div>
          </ModalHeader>
          <ModalBody>
            {selectedBonus && (
              <>
                <div className="mb-4">
                  <h4 className="font-medium text-gray-800 mb-2">
                    {BONUS_TYPE_CONFIG[selectedBonus.bonusType].label}
                  </h4>
                  <div className="space-y-1 text-sm text-gray-600">
                    <p>Utilisateur: {selectedBonus.user?.name}</p>
                    <p>
                      Date:{' '}
                      {new Date(selectedBonus.bonusDate).toLocaleDateString(
                        'fr-FR',
                      )}
                    </p>
                    <p>Montant: {selectedBonus.amount}€</p>
                  </div>
                </div>

                <Textarea
                  label="Commentaire (optionnel)"
                  placeholder={
                    selectedBonus.status === 'approved'
                      ? 'Bonus approuvé - bonne preuve fournie'
                      : 'Bonus rejeté - preuve insuffisante ou incorrecte'
                  }
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  maxRows={3}
                  description="Ce commentaire sera visible par l'utilisateur"
                />
              </>
            )}
          </ModalBody>
          <ModalFooter>
            <Button
              color="danger"
              variant="light"
              onPress={onClose}
              isDisabled={updateBonus.isPending}
            >
              Annuler
            </Button>
            <Button
              color={
                selectedBonus?.status === 'approved' ? 'success' : 'danger'
              }
              onPress={submitReview}
              isLoading={updateBonus.isPending}
            >
              {selectedBonus?.status === 'approved' ? 'Approuver' : 'Rejeter'}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
}
