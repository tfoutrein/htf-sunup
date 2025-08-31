'use client';

import React from 'react';
import { Card, CardBody, Chip } from '@nextui-org/react';
import {
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  ChatBubbleLeftRightIcon,
} from '@heroicons/react/24/outline';
import { useMyCampaignValidation } from '@/hooks';

interface CampaignValidationStatusProps {
  campaignId: number;
  campaignName: string;
}

export const CampaignValidationStatus: React.FC<
  CampaignValidationStatusProps
> = ({ campaignId, campaignName }) => {
  const { validation, isLoading, error } = useMyCampaignValidation(campaignId);

  if (isLoading || error || !validation) {
    return null; // Ne pas afficher si pas de données
  }

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
        return 'Campagne approuvée';
      case 'rejected':
        return 'Campagne rejetée';
      default:
        return 'Validation en attente';
    }
  };

  const getStatusMessage = (status: string) => {
    switch (status) {
      case 'approved':
        return 'Félicitations ! Votre campagne a été validée par votre manager. Vous recevrez vos gains selon les modalités prévues.';
      case 'rejected':
        return "Votre campagne n'a pas été validée. Les conditions requises n'ont pas été remplies selon votre manager.";
      default:
        return "Votre campagne est en cours de validation par votre manager. Vous serez notifié dès qu'une décision sera prise.";
    }
  };

  // Ne pas afficher si le statut est pending ou rejected
  if (validation.status === 'pending' || validation.status === 'rejected') {
    return null;
  }

  return (
    <Card className="border-l-4 border-l-success bg-success-50">
      <CardBody className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {getStatusIcon(validation.status)}
            <div>
              <h3 className="font-semibold text-lg">
                {getStatusLabel(validation.status)}
              </h3>
              <p className="text-sm text-gray-600">{campaignName}</p>
            </div>
          </div>
          <Chip color="success" variant="flat" size="lg">
            Approuvé
          </Chip>
        </div>

        <p className="text-gray-700">{getStatusMessage(validation.status)}</p>

        {validation.comment && (
          <div className="bg-white p-3 rounded-lg border">
            <div className="flex items-center gap-2 mb-2">
              <ChatBubbleLeftRightIcon className="w-4 h-4 text-gray-500" />
              <span className="text-sm font-medium text-gray-700">
                Commentaire du manager :
              </span>
            </div>
            <p className="text-gray-600 text-sm italic">
              "{validation.comment}"
            </p>
          </div>
        )}

        {validation.validatedAt && (
          <div className="text-xs text-gray-500 border-t pt-2">
            Validé le{' '}
            {new Date(validation.validatedAt).toLocaleDateString('fr-FR', {
              day: 'numeric',
              month: 'long',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </div>
        )}
      </CardBody>
    </Card>
  );
};
