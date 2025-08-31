'use client';

import React, { useState } from 'react';
import {
  Card,
  CardBody,
  CardHeader,
  Button,
  Progress,
  Chip,
  Spinner,
} from '@nextui-org/react';
import {
  CheckCircleIcon,
  XCircleIcon,
  UserGroupIcon,
  CurrencyEuroIcon,
  ChartBarIcon,
  ClockIcon,
} from '@heroicons/react/24/outline';
import { useCampaignValidation } from '@/hooks/useCampaignValidation';
import {
  CampaignValidation,
  UpdateCampaignValidationRequest,
} from '@/types/campaign-validation';
import { ValidationPopup } from './ValidationPopup';

interface CampaignValidationSectionProps {
  campaignId: number;
  campaignName: string;
}

export const CampaignValidationSection: React.FC<
  CampaignValidationSectionProps
> = ({ campaignId, campaignName }) => {
  const { validations, isLoading, error, updateValidation, isUpdating } =
    useCampaignValidation(campaignId);

  const [selectedValidation, setSelectedValidation] =
    useState<CampaignValidation | null>(null);
  const [popupOpen, setPopupOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<
    'all' | 'pending' | 'approved' | 'rejected'
  >('all');

  const handleValidationClick = (validation: CampaignValidation) => {
    setSelectedValidation(validation);
    setPopupOpen(true);
  };

  const handleValidationUpdate = (data: UpdateCampaignValidationRequest) => {
    if (!selectedValidation) return;

    updateValidation({
      userId: selectedValidation.userId,
      data,
    });
    setPopupOpen(false);
    setSelectedValidation(null);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircleIcon className="w-5 h-5 text-success" />;
      case 'rejected':
        return <XCircleIcon className="w-5 h-5 text-danger" />;
      default:
        return <ClockIcon className="w-5 h-5 text-warning" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'success';
      case 'rejected':
        return 'danger';
      default:
        return 'warning';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'approved':
        return 'Approuvé';
      case 'rejected':
        return 'Rejeté';
      default:
        return 'En attente';
    }
  };

  // Calculer les statistiques
  const stats = validations
    ? {
        totalFBOs: validations.length,
        approvedFBOs: validations.filter((v) => v.status === 'approved').length,
        rejectedFBOs: validations.filter((v) => v.status === 'rejected').length,
        pendingFBOs: validations.filter((v) => v.status === 'pending').length,
        totalEarnings: validations
          .filter((v) => v.status === 'approved')
          .reduce((sum, v) => sum + v.totalEarnings, 0),
        averageCompletion:
          validations.length > 0
            ? validations.reduce((sum, v) => sum + v.completionPercentage, 0) /
              validations.length
            : 0,
      }
    : null;

  // Filtrer les validations selon le filtre sélectionné
  const filteredValidations = validations
    ? validations.filter((validation) => {
        if (statusFilter === 'all') return true;
        return validation.status === statusFilter;
      })
    : [];

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-8">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <Card className="border-danger">
        <CardBody className="text-center py-8">
          <XCircleIcon className="w-12 h-12 text-danger mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-danger mb-2">
            Erreur de chargement
          </h3>
          <p className="text-gray-600">
            Impossible de charger les validations de campagne.
          </p>
        </CardBody>
      </Card>
    );
  }

  if (!validations || validations.length === 0) {
    return (
      <Card>
        <CardBody className="text-center py-8">
          <UserGroupIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-600 mb-2">
            Aucun FBO à valider
          </h3>
          <p className="text-gray-500">
            Il n'y a actuellement aucun FBO dans votre hiérarchie pour cette
            campagne.
          </p>
        </CardBody>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Statistiques / Filtres */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <Card
            isPressable
            isHoverable
            className={`cursor-pointer transition-all ${
              statusFilter === 'all' ? 'ring-2 ring-blue-500 bg-blue-50' : ''
            }`}
            onPress={() => setStatusFilter('all')}
          >
            <CardBody className="text-center">
              <UserGroupIcon className="w-8 h-8 text-blue-500 mx-auto mb-2" />
              <p className="text-2xl font-bold">{stats.totalFBOs}</p>
              <p className="text-sm text-gray-500">Total FBOs</p>
            </CardBody>
          </Card>

          <Card
            isPressable
            isHoverable
            className={`cursor-pointer transition-all ${
              statusFilter === 'approved'
                ? 'ring-2 ring-green-500 bg-green-50'
                : ''
            }`}
            onPress={() => setStatusFilter('approved')}
          >
            <CardBody className="text-center">
              <CheckCircleIcon className="w-8 h-8 text-green-500 mx-auto mb-2" />
              <p className="text-2xl font-bold text-green-600">
                {stats.approvedFBOs}
              </p>
              <p className="text-sm text-gray-500">Approuvés</p>
            </CardBody>
          </Card>

          <Card
            isPressable
            isHoverable
            className={`cursor-pointer transition-all ${
              statusFilter === 'rejected' ? 'ring-2 ring-red-500 bg-red-50' : ''
            }`}
            onPress={() => setStatusFilter('rejected')}
          >
            <CardBody className="text-center">
              <XCircleIcon className="w-8 h-8 text-red-500 mx-auto mb-2" />
              <p className="text-2xl font-bold text-red-600">
                {stats.rejectedFBOs}
              </p>
              <p className="text-sm text-gray-500">Rejetés</p>
            </CardBody>
          </Card>

          <Card
            isPressable
            isHoverable
            className={`cursor-pointer transition-all ${
              statusFilter === 'pending'
                ? 'ring-2 ring-orange-500 bg-orange-50'
                : ''
            }`}
            onPress={() => setStatusFilter('pending')}
          >
            <CardBody className="text-center">
              <ClockIcon className="w-8 h-8 text-orange-500 mx-auto mb-2" />
              <p className="text-2xl font-bold text-orange-600">
                {stats.pendingFBOs}
              </p>
              <p className="text-sm text-gray-500">En attente</p>
            </CardBody>
          </Card>

          <Card className="bg-purple-50">
            <CardBody className="text-center">
              <CurrencyEuroIcon className="w-8 h-8 text-purple-500 mx-auto mb-2" />
              <p className="text-2xl font-bold text-purple-600">
                {stats.totalEarnings.toFixed(2)} €
              </p>
              <p className="text-sm text-gray-500">Gains validés</p>
            </CardBody>
          </Card>
        </div>
      )}

      {/* Liste des validations */}
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold">Validations FBO</h3>
        </CardHeader>
        <CardBody>
          {filteredValidations.length === 0 ? (
            <div className="text-center py-8">
              <UserGroupIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">
                {statusFilter === 'all'
                  ? 'Aucun FBO trouvé'
                  : `Aucun FBO ${
                      statusFilter === 'approved'
                        ? 'approuvé'
                        : statusFilter === 'rejected'
                          ? 'rejeté'
                          : 'en attente'
                    }`}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredValidations.map((validation) => (
                <div
                  key={validation.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h4 className="font-medium">{validation.userName}</h4>
                      <Chip
                        startContent={getStatusIcon(validation.status)}
                        color={getStatusColor(validation.status) as any}
                        variant="flat"
                        size="sm"
                      >
                        {getStatusLabel(validation.status)}
                      </Chip>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
                      <Card className="bg-purple-50 border-purple-200">
                        <CardBody className="p-3">
                          <div className="flex items-center gap-2">
                            <CurrencyEuroIcon className="w-5 h-5 text-purple-600" />
                            <div>
                              <p className="text-xs text-purple-600 font-medium">
                                Gains totaux
                              </p>
                              <p className="text-lg font-bold text-purple-800">
                                {validation.totalEarnings.toFixed(2)} €
                              </p>
                            </div>
                          </div>
                        </CardBody>
                      </Card>

                      <Card className="bg-blue-50 border-blue-200">
                        <CardBody className="p-3">
                          <div className="flex items-center gap-2">
                            <ChartBarIcon className="w-5 h-5 text-blue-600" />
                            <div>
                              <p className="text-xs text-blue-600 font-medium">
                                Défis complétés
                              </p>
                              <p className="text-lg font-bold text-blue-800">
                                {validation.completedChallenges}/
                                {validation.totalChallenges}
                              </p>
                              <Progress
                                value={validation.completionPercentage}
                                className="mt-1"
                                color="primary"
                                size="sm"
                              />
                            </div>
                          </div>
                        </CardBody>
                      </Card>
                    </div>

                    {validation.comment && (
                      <div className="mt-2 p-2 bg-gray-100 rounded text-sm">
                        <span className="font-medium">Commentaire: </span>
                        {validation.comment}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2 ml-4">
                    {validation.status === 'pending' ? (
                      <Button
                        size="sm"
                        color="primary"
                        variant="flat"
                        onPress={() => handleValidationClick(validation)}
                        isLoading={isUpdating}
                      >
                        Valider
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        color="default"
                        variant="flat"
                        onPress={() => handleValidationClick(validation)}
                        isLoading={isUpdating}
                      >
                        Modifier
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardBody>
      </Card>

      {/* Popup de validation */}
      {selectedValidation && (
        <ValidationPopup
          isOpen={popupOpen}
          onClose={() => {
            setPopupOpen(false);
            setSelectedValidation(null);
          }}
          validation={selectedValidation}
          onValidate={handleValidationUpdate}
          isLoading={isUpdating}
        />
      )}
    </div>
  );
};
