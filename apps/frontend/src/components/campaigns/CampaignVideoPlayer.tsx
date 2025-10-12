'use client';

import React, { useState } from 'react';
import { Button } from '../ui/Button';
import {
  PlayIcon,
  XMarkIcon,
  VideoCameraIcon,
} from '@heroicons/react/24/solid';

export interface CampaignVideoPlayerProps {
  videoUrl: string;
  campaignName?: string;
  showInModal?: boolean;
  autoPlay?: boolean;
  className?: string;
}

const CampaignVideoPlayer: React.FC<CampaignVideoPlayerProps> = ({
  videoUrl,
  campaignName = 'Campagne',
  showInModal = false,
  autoPlay = false,
  className = '',
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);

  const handleOpenModal = () => {
    if (showInModal) {
      setIsModalOpen(true);
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setIsPlaying(false);
  };

  // Composant vidéo réutilisable
  const VideoElement = ({
    isFullscreen = false,
  }: {
    isFullscreen?: boolean;
  }) => (
    <video
      controls
      autoPlay={autoPlay || (isFullscreen && isPlaying)}
      className={`w-full ${isFullscreen ? 'max-h-[80vh]' : 'max-h-96'} object-contain bg-black`}
      onPlay={() => setIsPlaying(true)}
      onPause={() => setIsPlaying(false)}
    >
      <source src={videoUrl} type="video/mp4" />
      <source src={videoUrl} type="video/webm" />
      <source src={videoUrl} type="video/quicktime" />
      Votre navigateur ne supporte pas la lecture de vidéos.
    </video>
  );

  if (showInModal) {
    return (
      <>
        {/* Thumbnail/Aperçu avec bouton Play */}
        <div
          className={`relative group cursor-pointer rounded-lg overflow-hidden ${className}`}
          onClick={handleOpenModal}
        >
          {/* Thumbnail - Premier frame de la vidéo ou icône */}
          <div className="relative aspect-video bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/40 group-hover:bg-black/30 transition-colors" />

            {/* Icône vidéo en arrière-plan */}
            <VideoCameraIcon className="h-20 w-20 text-white/30 absolute" />

            {/* Bouton Play central */}
            <div className="relative z-10 transform group-hover:scale-110 transition-transform">
              <div className="bg-white/90 group-hover:bg-white rounded-full p-6 shadow-2xl">
                <PlayIcon className="h-12 w-12 text-blue-600 ml-1" />
              </div>
            </div>

            {/* Label */}
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4">
              <p className="text-white font-medium text-lg">
                🎥 Vidéo de présentation
              </p>
              <p className="text-white/80 text-sm">Cliquez pour voir</p>
            </div>
          </div>
        </div>

        {/* Modal avec vidéo en plein écran */}
        {isModalOpen && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm"
            onClick={handleCloseModal}
          >
            <div
              className="relative w-full max-w-6xl mx-4"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Bouton fermer */}
              <button
                onClick={handleCloseModal}
                className="absolute -top-12 right-0 text-white hover:text-gray-300 transition-colors"
              >
                <XMarkIcon className="h-8 w-8" />
              </button>

              {/* Titre */}
              <div className="mb-4">
                <h3 className="text-2xl font-bold text-white">
                  {campaignName} - Vidéo de présentation
                </h3>
              </div>

              {/* Vidéo */}
              <div className="rounded-lg overflow-hidden shadow-2xl">
                <VideoElement isFullscreen />
              </div>

              {/* Instructions */}
              <div className="mt-4 text-center text-white/70 text-sm">
                Appuyez sur ESC ou cliquez en dehors pour fermer
              </div>
            </div>
          </div>
        )}
      </>
    );
  }

  // Mode inline (sans modal)
  return (
    <div className={`rounded-lg overflow-hidden shadow-lg ${className}`}>
      <VideoElement />
    </div>
  );
};

export default CampaignVideoPlayer;
