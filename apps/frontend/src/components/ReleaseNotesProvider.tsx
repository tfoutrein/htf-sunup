'use client';

import React from 'react';
import { ReleaseNotesModal } from './ui/ReleaseNotesModal';
import { useReleaseNotesPopup } from '../hooks/useReleaseNotesPopup';

export const ReleaseNotesProvider: React.FC = () => {
  const { isOpen, currentVersion, markAsSeen, closeModal } =
    useReleaseNotesPopup();

  return (
    <ReleaseNotesModal
      isOpen={isOpen}
      onClose={closeModal}
      version={currentVersion}
      onMarkAsSeen={markAsSeen}
    />
  );
};
