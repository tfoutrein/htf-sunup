'use client';

import React from 'react';
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
} from '@heroui/react';
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import type { Proof } from '@/types/proofs';

interface MultiProofViewerProps {
  isOpen: boolean;
  onClose: () => void;
  proofs: Proof[];
  currentIndex: number;
  currentUrl: string | null;
  isLoading?: boolean;
  title?: string;
  onNavigate: (direction: 'prev' | 'next') => void;
}

export function MultiProofViewer({
  isOpen,
  onClose,
  proofs,
  currentIndex,
  currentUrl,
  isLoading = false,
  title = 'Preuves',
  onNavigate,
}: MultiProofViewerProps) {
  const currentProof = proofs[currentIndex];
  const hasMultipleProofs = proofs.length > 1;

  const isImage = (proof: Proof): boolean => {
    return (
      proof.type === 'image' || proof.mimeType?.startsWith('image/') || false
    );
  };

  const isVideo = (proof: Proof): boolean => {
    return (
      proof.type === 'video' || proof.mimeType?.startsWith('video/') || false
    );
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="4xl"
      scrollBehavior="inside"
      classNames={{
        base: 'max-h-[90vh]',
        body: 'p-0',
      }}
    >
      <ModalContent>
        <ModalHeader className="flex items-center justify-between px-6 py-4 border-b">
          <div className="flex flex-col">
            <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
            {hasMultipleProofs && (
              <p className="text-sm text-gray-600 mt-1">
                Preuve {currentIndex + 1} sur {proofs.length}
              </p>
            )}
          </div>

          {hasMultipleProofs && (
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="flat"
                onPress={() => onNavigate('prev')}
                isDisabled={currentIndex === 0 || isLoading}
                startContent={<ChevronLeftIcon className="w-4 h-4" />}
              >
                Précédent
              </Button>
              <Button
                size="sm"
                variant="flat"
                onPress={() => onNavigate('next')}
                isDisabled={currentIndex === proofs.length - 1 || isLoading}
                endContent={<ChevronRightIcon className="w-4 h-4" />}
              >
                Suivant
              </Button>
            </div>
          )}
        </ModalHeader>

        <ModalBody className="flex flex-col items-center justify-center p-6">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="w-12 h-12 border-4 border-gray-300 border-t-blue-600 rounded-full animate-spin mb-4"></div>
              <p className="text-gray-600">Chargement de la preuve...</p>
            </div>
          ) : currentUrl && currentProof ? (
            <div className="w-full max-w-4xl">
              {/* Affichage du média */}
              <div className="flex justify-center mb-4">
                {isImage(currentProof) && (
                  <img
                    src={currentUrl}
                    alt={`Preuve ${currentIndex + 1}`}
                    className="max-w-full max-h-[60vh] object-contain rounded-lg shadow-lg"
                    onError={(e) => {
                      console.error("Erreur lors du chargement de l'image");
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                )}

                {isVideo(currentProof) && (
                  <video
                    src={currentUrl}
                    controls
                    className="max-w-full max-h-[60vh] rounded-lg shadow-lg"
                    onError={(e) => {
                      console.error('Erreur lors du chargement de la vidéo');
                    }}
                  >
                    Votre navigateur ne supporte pas la lecture vidéo.
                  </video>
                )}
              </div>

              {/* Informations sur le fichier */}
              <div className="bg-gray-50 rounded-lg p-4 border">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-gray-700">
                      Nom du fichier :
                    </span>
                    <p className="text-gray-600 mt-1 break-words">
                      {currentProof.originalName}
                    </p>
                  </div>

                  <div>
                    <span className="font-medium text-gray-700">Type :</span>
                    <p className="text-gray-600 mt-1">
                      {currentProof.mimeType || 'Non spécifié'}
                    </p>
                  </div>

                  <div>
                    <span className="font-medium text-gray-700">Taille :</span>
                    <p className="text-gray-600 mt-1">
                      {formatFileSize(currentProof.size)}
                    </p>
                  </div>

                  <div>
                    <span className="font-medium text-gray-700">
                      Ajouté le :
                    </span>
                    <p className="text-gray-600 mt-1">
                      {new Date(currentProof.createdAt).toLocaleDateString(
                        'fr-FR',
                        {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        },
                      )}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12">
              <XMarkIcon className="w-16 h-16 text-gray-300 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Impossible de charger la preuve
              </h3>
              <p className="text-gray-600 text-center">
                Il y a eu un problème lors du chargement de cette preuve.
              </p>
            </div>
          )}
        </ModalBody>

        <ModalFooter className="px-6 py-4 border-t">
          <Button
            variant="light"
            onPress={onClose}
            className="text-gray-700 font-medium"
          >
            Fermer
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
