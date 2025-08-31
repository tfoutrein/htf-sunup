import React, { useState } from 'react';
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Textarea,
  Card,
  CardBody,
  Chip,
} from '@nextui-org/react';
import {
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
} from '@heroicons/react/24/outline';
import {
  CampaignValidation,
  UpdateCampaignValidationRequest,
} from '@/types/campaign-validation';

interface ValidationPopupProps {
  isOpen: boolean;
  onClose: () => void;
  validation: CampaignValidation;
  onValidate: (data: UpdateCampaignValidationRequest) => void;
  isLoading?: boolean;
}

export const ValidationPopup: React.FC<ValidationPopupProps> = ({
  isOpen,
  onClose,
  validation,
  onValidate,
  isLoading = false,
}) => {
  const [comment, setComment] = useState(validation.comment || '');
  const [selectedStatus, setSelectedStatus] = useState<
    'approved' | 'rejected' | null
  >(null);

  const handleValidate = (status: 'approved' | 'rejected') => {
    onValidate({
      status,
      comment: comment.trim() || undefined,
    });
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

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="2xl" scrollBehavior="inside">
      <ModalContent>
        <ModalHeader className="flex flex-col gap-1">
          <h3 className="text-lg font-semibold">Validation de campagne</h3>
          <p className="text-sm text-gray-500">{validation.userName}</p>
        </ModalHeader>

        <ModalBody>
          <div className="space-y-4">
            {/* Informations FBO */}
            <Card>
              <CardBody className="space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-medium">{validation.userName}</h4>
                    <p className="text-sm text-gray-500">
                      {validation.userEmail}
                    </p>
                  </div>
                  <Chip
                    startContent={getStatusIcon(validation.status)}
                    color={getStatusColor(validation.status) as any}
                    variant="flat"
                  >
                    {getStatusLabel(validation.status)}
                  </Chip>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-3 border-t">
                  <div>
                    <p className="text-sm text-gray-500">Gains totaux</p>
                    <p className="font-semibold text-lg">
                      {validation.totalEarnings.toFixed(2)} €
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Défis complétés</p>
                    <p className="font-semibold text-lg">
                      {validation.completedChallenges}/
                      {validation.totalChallenges}
                      <span className="text-sm text-gray-500 ml-1">
                        ({validation.completionPercentage.toFixed(1)}%)
                      </span>
                    </p>
                  </div>
                </div>
              </CardBody>
            </Card>

            {/* Commentaire */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Commentaire (optionnel)
              </label>
              <Textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Ajoutez un commentaire sur la validation..."
                maxRows={4}
                maxLength={500}
              />
              <p className="text-xs text-gray-500 mt-1">
                {comment.length}/500 caractères
              </p>
            </div>

            {/* Commentaire existant */}
            {validation.comment && (
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-sm font-medium mb-1">
                  Commentaire précédent :
                </p>
                <p className="text-sm text-gray-700">{validation.comment}</p>
              </div>
            )}
          </div>
        </ModalBody>

        <ModalFooter className="flex justify-between">
          <Button variant="light" onPress={onClose} disabled={isLoading}>
            Annuler
          </Button>

          <div className="flex gap-2">
            <Button
              color="danger"
              variant="flat"
              startContent={<XCircleIcon className="w-4 h-4" />}
              onPress={() => handleValidate('rejected')}
              isLoading={isLoading}
              disabled={validation.status === 'rejected'}
            >
              Rejeter
            </Button>
            <Button
              color="success"
              startContent={<CheckCircleIcon className="w-4 h-4" />}
              onPress={() => handleValidate('approved')}
              isLoading={isLoading}
              disabled={validation.status === 'approved'}
            >
              Approuver
            </Button>
          </div>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};
