'use client';

import { useState, useEffect } from 'react';
import {
  Card,
  CardHeader,
  CardBody,
  Button,
  Badge,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure,
  Spinner,
  Chip,
} from '@heroui/react';
import { addToast } from '@heroui/toast';
import {
  CameraIcon,
  TrashIcon,
  EyeIcon,
  CalendarDaysIcon,
  CurrencyEuroIcon,
} from '@heroicons/react/24/outline';
import {
  useMyBonuses,
  useDeleteDailyBonus,
  useUploadProof,
  useMultipleProofUpload,
} from '@/hooks';
import { DailyBonus } from '@/types/daily-bonus';
import { BONUS_TYPE_CONFIG, BONUS_STATUS_CONFIG } from '@/types/daily-bonus';
import type { ProofFile } from '@/types/proofs';
import { MultiProofUpload } from '@/components/ui';

interface DailyBonusListProps {
  onCreateNew?: () => void;
}

export function DailyBonusList({ onCreateNew }: DailyBonusListProps) {
  const { data: bonuses = [], isLoading, error } = useMyBonuses();
  const deleteBonus = useDeleteDailyBonus();
  const { uploadMultipleProofs, isUploading } = useMultipleProofUpload();

  const [selectedBonus, setSelectedBonus] = useState<DailyBonus | null>(null);
  const [proofFiles, setProofFiles] = useState<ProofFile[]>([]);

  const { isOpen, onOpen, onClose } = useDisclosure();

  const handleDeleteBonus = async (bonus: DailyBonus) => {
    if (bonus.status !== 'pending') {
      addToast({
        title: 'Erreur',
        description: 'Seuls les bonus en attente peuvent être supprimés',
        color: 'danger',
      });
      return;
    }

    try {
      await deleteBonus.mutateAsync(bonus.id);
      addToast({
        title: 'Succès',
        description: 'Bonus supprimé avec succès',
        color: 'success',
      });
    } catch (error: any) {
      addToast({
        title: 'Erreur',
        description: error.message || 'Erreur lors de la suppression',
        color: 'danger',
      });
    }
  };

  const handleUploadProof = async () => {
    if (!selectedBonus || proofFiles.length === 0) return;

    try {
      const files = proofFiles.map((pf) => pf.file);

      await uploadMultipleProofs(files, {
        type: 'daily-bonus',
        id: selectedBonus.id,
      });

      addToast({
        title: 'Succès',
        description: `${proofFiles.length} preuve(s) téléchargée(s) avec succès`,
        color: 'success',
      });

      onClose();
      setProofFiles([]);
    } catch (error: any) {
      addToast({
        title: 'Erreur',
        description: error.message || 'Erreur lors du téléchargement',
        color: 'danger',
      });
    }
  };

  const openProofModal = (bonus: DailyBonus) => {
    setSelectedBonus(bonus);
    setProofFiles([]); // Reset des fichiers
    onOpen();
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center p-8">
        <Spinner size="lg" color="primary" />
      </div>
    );
  }

  if (error) {
    return (
      <Card className="border-danger-200">
        <CardBody className="text-center p-6">
          <p className="text-danger-600">Erreur lors du chargement des bonus</p>
        </CardBody>
      </Card>
    );
  }

  return (
    <>
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CurrencyEuroIcon className="w-6 h-6 text-amber-600" />
            <h2 className="text-xl font-semibold text-gray-800">
              Mes Bonus Quotidiens ({bonuses.length})
            </h2>
          </div>
          {onCreateNew && (
            <Button
              color="primary"
              variant="solid"
              onPress={onCreateNew}
              startContent={<CurrencyEuroIcon className="w-4 h-4" />}
              size="sm"
            >
              Nouveau bonus
            </Button>
          )}
        </div>

        {/* Bonus List */}
        {bonuses.length === 0 ? (
          <Card>
            <CardBody className="text-center p-8">
              <CurrencyEuroIcon className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-600 mb-2">
                Aucun bonus quotidien
              </h3>
              <p className="text-gray-500 mb-4">
                Vous n'avez pas encore créé de bonus quotidien.
              </p>
              {onCreateNew && (
                <Button
                  color="primary"
                  variant="flat"
                  onPress={onCreateNew}
                  startContent={<CurrencyEuroIcon className="w-4 h-4" />}
                >
                  Créer mon premier bonus
                </Button>
              )}
            </CardBody>
          </Card>
        ) : (
          <div className="grid gap-4">
            {bonuses.map((bonus) => {
              const typeConfig = BONUS_TYPE_CONFIG[bonus.bonusType];
              const statusConfig = BONUS_STATUS_CONFIG[bonus.status];

              return (
                <Card
                  key={bonus.id}
                  className="hover:shadow-md transition-shadow"
                >
                  <CardBody className="p-4">
                    <div className="flex items-start justify-between">
                      {/* Left side - Bonus Info */}
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <span className="text-2xl">{typeConfig.emoji}</span>
                          <div>
                            <h3 className="font-semibold text-gray-800">
                              {typeConfig.label}
                            </h3>
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <CalendarDaysIcon className="w-4 h-4" />
                              {new Date(bonus.bonusDate).toLocaleDateString(
                                'fr-FR',
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-1">
                            <CurrencyEuroIcon className="w-4 h-4 text-amber-600" />
                            <span className="font-semibold text-amber-700">
                              {bonus.amount}€
                            </span>
                          </div>

                          <Chip
                            size="sm"
                            color={statusConfig.color}
                            variant="flat"
                            startContent={<span>{statusConfig.emoji}</span>}
                          >
                            {statusConfig.label}
                          </Chip>
                        </div>

                        {bonus.reviewComment && (
                          <div className="mt-2 p-2 bg-gray-50 rounded-lg">
                            <p className="text-xs text-gray-600">
                              <strong>Commentaire:</strong>{' '}
                              {bonus.reviewComment}
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Right side - Actions */}
                      <div className="flex gap-2 ml-4">
                        {bonus.status === 'pending' && (
                          <>
                            <Button
                              size="sm"
                              color="primary"
                              variant="flat"
                              onPress={() => openProofModal(bonus)}
                              startContent={<CameraIcon className="w-4 h-4" />}
                            >
                              {bonus.proofUrl
                                ? 'Ajouter preuves'
                                : 'Ajouter preuves'}
                            </Button>

                            <Button
                              size="sm"
                              color="danger"
                              variant="light"
                              onPress={() => handleDeleteBonus(bonus)}
                              isLoading={deleteBonus.isPending}
                              startContent={<TrashIcon className="w-4 h-4" />}
                            />
                          </>
                        )}

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
                      </div>
                    </div>
                  </CardBody>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Proof Upload Modal */}
      <Modal isOpen={isOpen} onClose={onClose} size="md">
        <ModalContent>
          <ModalHeader>
            <div className="flex items-center gap-2">
              <CameraIcon className="w-5 h-5" />
              Ajouter des preuves (jusqu'à 5)
            </div>
          </ModalHeader>
          <ModalBody>
            {selectedBonus && (
              <>
                <div className="mb-4">
                  <h4 className="font-medium text-gray-800 mb-2">
                    {BONUS_TYPE_CONFIG[selectedBonus.bonusType].label}
                  </h4>
                  <p className="text-sm text-gray-600">
                    Date:{' '}
                    {new Date(selectedBonus.bonusDate).toLocaleDateString(
                      'fr-FR',
                    )}
                  </p>
                  <p className="text-sm text-gray-600">
                    Montant: {selectedBonus.amount}€
                  </p>
                </div>

                <div className="space-y-3">
                  <p className="text-sm text-gray-700">
                    Ajoutez jusqu'à 5 preuves (photos ou vidéos) pour votre{' '}
                    {BONUS_TYPE_CONFIG[
                      selectedBonus.bonusType
                    ].label.toLowerCase()}
                    .
                  </p>

                  <MultiProofUpload
                    files={proofFiles}
                    onFilesChange={setProofFiles}
                    maxFiles={5}
                    disabled={isUploading}
                  />

                  {selectedBonus.proofUrl && (
                    <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                      <p className="text-sm text-blue-900 font-medium">
                        ℹ️ Ce bonus a déjà des preuves
                      </p>
                      <p className="text-xs text-blue-700 mt-1">
                        Les nouvelles preuves s'ajouteront aux preuves
                        existantes.
                      </p>
                    </div>
                  )}
                </div>
              </>
            )}
          </ModalBody>
          <ModalFooter>
            <Button
              color="danger"
              variant="light"
              onPress={onClose}
              isDisabled={isUploading}
            >
              Annuler
            </Button>
            <Button
              color="primary"
              onPress={handleUploadProof}
              isLoading={isUploading}
              isDisabled={proofFiles.length === 0}
            >
              Télécharger{' '}
              {proofFiles.length > 0 ? `(${proofFiles.length})` : ''}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
}
