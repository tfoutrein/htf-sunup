'use client';

import React from 'react';
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Chip,
  Divider,
} from '@nextui-org/react';
import type { AppVersion } from '../../types/app-versions';

interface ReleaseNotesModalProps {
  isOpen: boolean;
  onClose: () => void;
  version?: AppVersion | null;
  onMarkAsSeen?: () => void;
}

export const ReleaseNotesModal: React.FC<ReleaseNotesModalProps> = ({
  isOpen,
  onClose,
  version,
  onMarkAsSeen,
}) => {
  if (!version) return null;

  const handleClose = () => {
    if (onMarkAsSeen) {
      onMarkAsSeen();
    }
    onClose();
  };

  const formatReleaseNotes = (notes: string) => {
    // Simple formatage Markdown vers HTML-like pour affichage
    return notes
      .replace(
        /## (.*)/g,
        '<h3 class="text-lg font-semibold mt-4 mb-2 text-primary">$1</h3>',
      )
      .replace(
        /- \*\*(.*?)\*\* :/g,
        '<div class="flex items-start gap-2 mb-1"><span class="text-primary">•</span><span><strong>$1</strong>:</div>',
      )
      .replace(
        /- (.*)/g,
        '<div class="flex items-start gap-2 mb-1"><span class="text-primary">•</span><span>$1</span></div>',
      )
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  };

  return (
    <Modal
      isOpen={isOpen}
      onOpenChange={handleClose}
      size="2xl"
      scrollBehavior="inside"
      classNames={{
        base: 'bg-background/95 backdrop-blur-md',
        backdrop:
          'bg-gradient-to-t from-zinc-900 to-zinc-900/10 backdrop-opacity-20',
      }}
    >
      <ModalContent>
        <ModalHeader className="flex flex-col gap-1">
          <div className="flex items-center gap-3">
            <span className="text-xl font-bold">
              🎉 Nouvelle version {version.version}
            </span>
            {version.isMajor && (
              <Chip color="primary" variant="flat" size="sm">
                Mise à jour majeure
              </Chip>
            )}
          </div>
          <h2 className="text-lg text-default-600 font-normal">
            {version.title}
          </h2>
        </ModalHeader>

        <ModalBody>
          <div className="space-y-4">
            {/* Description courte */}
            <div className="bg-primary/10 rounded-lg p-4 border border-primary/20">
              <p className="text-default-700 leading-relaxed">
                {version.shortDescription}
              </p>
            </div>

            <Divider />

            {/* Release notes complètes */}
            {version.fullReleaseNotes && (
              <div
                className="prose prose-sm max-w-none text-default-600"
                dangerouslySetInnerHTML={{
                  __html: formatReleaseNotes(version.fullReleaseNotes),
                }}
              />
            )}

            {/* Date de release */}
            <div className="text-center text-sm text-default-500 mt-6">
              Publié le{' '}
              {new Date(version.releaseDate).toLocaleDateString('fr-FR', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              })}
            </div>
          </div>
        </ModalBody>

        <ModalFooter className="justify-center">
          <Button color="primary" onPress={handleClose} className="px-8">
            C'est parti ! 🚀
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};
