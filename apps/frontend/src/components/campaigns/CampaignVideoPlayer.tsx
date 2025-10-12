'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '../ui/Button';
import {
  PlayIcon,
  XMarkIcon,
  VideoCameraIcon,
} from '@heroicons/react/24/solid';
import { campaignService } from '@/services/campaigns';

export interface CampaignVideoPlayerProps {
  campaignId: number;
  campaignName?: string;
  showInModal?: boolean;
  autoPlay?: boolean;
  className?: string;
}

const CampaignVideoPlayer: React.FC<CampaignVideoPlayerProps> = ({
  campaignId,
  campaignName = 'Campagne',
  showInModal = false,
  autoPlay = false,
  className = '',
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [signedUrl, setSignedUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Récupérer l'URL signée au chargement du composant
  useEffect(() => {
    let mounted = true;

    const fetchSignedUrl = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const result =
          await campaignService.getPresentationVideoSignedUrl(campaignId);
        if (mounted && result) {
          setSignedUrl(result.url);
        } else if (mounted) {
          setError('Impossible de charger la vidéo');
        }
      } catch (err) {
        if (mounted) {
          console.error('Error fetching signed URL:', err);
          setError('Erreur lors du chargement de la vidéo');
        }
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    fetchSignedUrl();

    return () => {
      mounted = false;
    };
  }, [campaignId]);

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
  }) => {
    if (!signedUrl) return null;

    return (
      <video
        controls
        autoPlay={autoPlay || (isFullscreen && isPlaying)}
        className={`w-full ${isFullscreen ? 'max-h-[80vh]' : 'max-h-96'} object-contain bg-black`}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
      >
        <source src={signedUrl} type="video/mp4" />
        <source src={signedUrl} type="video/webm" />
        <source src={signedUrl} type="video/quicktime" />
        Votre navigateur ne supporte pas la lecture de vidéos.
      </video>
    );
  };

  // États de chargement et d'erreur
  if (isLoading) {
    return (
      <div
        className={`flex items-center justify-center bg-gray-100 dark:bg-gray-800 rounded-lg p-8 ${className}`}
      >
        <div className="text-center">
          <VideoCameraIcon className="h-12 w-12 text-gray-400 mx-auto mb-2 animate-pulse" />
          <p className="text-gray-500 dark:text-gray-400">
            Chargement de la vidéo...
          </p>
        </div>
      </div>
    );
  }

  if (error || !signedUrl) {
    return (
      <div
        className={`flex items-center justify-center bg-red-50 dark:bg-red-900/20 rounded-lg p-8 ${className}`}
      >
        <div className="text-center">
          <XMarkIcon className="h-12 w-12 text-red-500 mx-auto mb-2" />
          <p className="text-red-600 dark:text-red-400">
            {error || 'Vidéo non disponible'}
          </p>
        </div>
      </div>
    );
  }

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
