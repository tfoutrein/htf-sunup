'use client';

import React, { useState } from 'react';
import {
  Card,
  CardBody,
  CardHeader,
  Badge,
  Button,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure,
  Spinner,
} from '@/components/ui';
import {
  CurrencyEuroIcon,
  CalendarIcon,
  PhotoIcon,
  EyeIcon,
} from '@heroicons/react/24/outline';
import { DailyBonus } from '@/types/daily-bonus';
import { dailyBonusService } from '@/services/daily-bonus';

interface FBOBonusListProps {
  bonuses: DailyBonus[];
  loading?: boolean;
  error?: string | null;
}

const FBOBonusList: React.FC<FBOBonusListProps> = ({
  bonuses,
  loading = false,
  error = null,
}) => {
  const [selectedBonus, setSelectedBonus] = useState<DailyBonus | null>(null);
  const [proofUrl, setProofUrl] = useState<string | null>(null);
  const [loadingProof, setLoadingProof] = useState(false);
  const { isOpen, onOpen, onOpenChange } = useDisclosure();

  const handleViewProof = async (bonus: DailyBonus) => {
    if (!bonus.proofUrl) return;

    setSelectedBonus(bonus);
    setLoadingProof(true);
    setProofUrl(null);

    try {
      const response = await dailyBonusService.getProofUrl(bonus.id);
      setProofUrl(response.url);
      onOpen();
    } catch (error) {
      console.error('Erreur lors du chargement de la preuve:', error);
      // On peut afficher un toast d'erreur ici
    } finally {
      setLoadingProof(false);
    }
  };

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

  const formatDate = (dateString: string) => {
    try {
      // Gérer différents formats de date
      let date;
      if (dateString.includes('T')) {
        // Format ISO avec heure
        date = new Date(dateString);
      } else if (dateString.includes('-')) {
        // Format YYYY-MM-DD
        const [year, month, day] = dateString.split('-');
        date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
      } else {
        // Fallback
        date = new Date(dateString);
      }

      // Vérifier si la date est valide
      if (isNaN(date.getTime())) {
        return dateString; // Retourner la string originale si la date est invalide
      }

      return date.toLocaleDateString('fr-FR', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    } catch (error) {
      console.error('Erreur de formatage de date:', error);
      return dateString; // Retourner la string originale en cas d'erreur
    }
  };

  if (loading) {
    return (
      <Card>
        <CardBody className="flex justify-center items-center p-8">
          <Spinner size="lg" color="primary" />
          <p className="text-gray-600 mt-4">Chargement des bonus...</p>
        </CardBody>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="border-danger-200">
        <CardBody className="text-center p-6">
          <p className="text-danger-600">Erreur lors du chargement des bonus</p>
          <p className="text-sm text-gray-500 mt-2">{error}</p>
        </CardBody>
      </Card>
    );
  }

  if (bonuses.length === 0) {
    return (
      <Card>
        <CardBody className="text-center p-8">
          <CurrencyEuroIcon className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-600 mb-2">
            Aucun bonus déclaré
          </h3>
          <p className="text-gray-500">
            Ce FBO n'a pas encore déclaré de bonus pour cette campagne.
          </p>
        </CardBody>
      </Card>
    );
  }

  // Calculer le total de tous les bonus (plus de notion d'approbation)
  const totalAmount = bonuses.reduce((sum, b) => sum + parseFloat(b.amount), 0);

  return (
    <>
      <Card>
        <CardHeader className="pb-2">
          <div className="flex justify-between items-center w-full">
            <div className="flex items-center gap-2">
              <CurrencyEuroIcon className="w-6 h-6 text-amber-600" />
              <div>
                <h3 className="text-lg font-semibold">Bonus déclarés</h3>
                <p className="text-sm text-gray-600">
                  {bonuses.length} bonus • {totalAmount.toFixed(2)}€ total
                </p>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardBody>
          <div className="space-y-3">
            {bonuses.map((bonus, index) => (
              <div key={bonus.id}>
                <div className="flex items-center justify-between p-4 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <CalendarIcon className="w-4 h-4 text-gray-500" />
                      <span className="text-sm font-medium">
                        {formatDate(bonus.bonusDate)}
                      </span>
                    </div>
                    <Badge
                      size="sm"
                      variant="flat"
                      color={
                        bonus.bonusType === 'basket' ? 'primary' : 'secondary'
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
                    <Badge color="success" variant="flat">
                      Validé
                    </Badge>

                    {bonus.proofUrl && (
                      <Button
                        size="sm"
                        variant="flat"
                        startContent={<EyeIcon className="w-4 h-4" />}
                        onPress={() => handleViewProof(bonus)}
                        isLoading={
                          loadingProof && selectedBonus?.id === bonus.id
                        }
                      >
                        Voir preuve
                      </Button>
                    )}
                  </div>
                </div>
                {index < bonuses.length - 1 && (
                  <div className="border-b border-gray-200 my-2" />
                )}
              </div>
            ))}
          </div>
        </CardBody>
      </Card>

      {/* Modal pour afficher la preuve */}
      <Modal
        isOpen={isOpen}
        onOpenChange={onOpenChange}
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
                {selectedBonus && (
                  <div className="text-sm text-gray-600 font-normal">
                    {getBonusTypeLabel(selectedBonus.bonusType)} •{' '}
                    {selectedBonus.amount}€ •{' '}
                    {formatDate(selectedBonus.bonusDate)}
                  </div>
                )}
              </ModalHeader>
              <ModalBody>
                {loadingProof ? (
                  <div className="flex justify-center items-center p-8">
                    <Spinner size="lg" />
                  </div>
                ) : proofUrl ? (
                  <div className="flex justify-center">
                    <img
                      src={proofUrl}
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
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </>
  );
};

export default FBOBonusList;
