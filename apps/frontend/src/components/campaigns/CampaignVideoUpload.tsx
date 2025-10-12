'use client';

import React, { useState, useRef } from 'react';
import { Button } from '../ui/Button';
import {
  VideoCameraIcon,
  XMarkIcon,
  ArrowUpTrayIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';

export interface CampaignVideoUploadProps {
  videoUrl?: string | null;
  onVideoChange: (file: File | null) => void;
  onDeleteExisting?: () => void;
  disabled?: boolean;
  className?: string;
}

const CampaignVideoUpload: React.FC<CampaignVideoUploadProps> = ({
  videoUrl,
  onVideoChange,
  onDeleteExisting,
  disabled = false,
  className = '',
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Types de fichiers vidéo acceptés
  const acceptedFileTypes = [
    'video/mp4',
    'video/webm',
    'video/quicktime',
    'video/x-msvideo',
  ];

  const acceptedExtensions = '.mp4,.webm,.mov,.avi';

  // Valider le fichier vidéo
  const validateFile = (file: File): string | null => {
    // Vérifier le type
    if (!acceptedFileTypes.includes(file.type)) {
      return 'Type de fichier non supporté. Utilisez MP4, WebM, MOV ou AVI.';
    }

    // Vérifier la taille (100MB max)
    const maxSize = 100 * 1024 * 1024; // 100MB
    if (file.size > maxSize) {
      return 'Fichier trop volumineux. Taille maximale: 100MB.';
    }

    return null;
  };

  // Formater la taille du fichier
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
  };

  // Gérer la sélection de fichier
  const handleFileSelect = (file: File | null) => {
    if (!file || disabled) return;

    setError(null);

    // Valider le fichier
    const validationError = validateFile(file);
    if (validationError) {
      setError(validationError);
      return;
    }

    // Créer l'URL de prévisualisation
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    const newPreviewUrl = URL.createObjectURL(file);
    setPreviewUrl(newPreviewUrl);
    setSelectedFile(file);
    onVideoChange(file);
  };

  // Gérer le changement d'input
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    handleFileSelect(file);
  };

  // Gérer le drag and drop
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (!disabled) {
      setIsDragOver(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);

    if (disabled) return;

    const file = e.dataTransfer.files[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  // Supprimer la vidéo sélectionnée
  const handleRemoveSelected = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setPreviewUrl(null);
    setSelectedFile(null);
    setError(null);
    onVideoChange(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Supprimer la vidéo existante
  const handleDeleteExisting = () => {
    if (onDeleteExisting) {
      onDeleteExisting();
    }
  };

  // Ouvrir le sélecteur de fichiers
  const handleBrowseClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Vidéo existante */}
      {videoUrl && !previewUrl && (
        <div className="relative rounded-lg overflow-hidden bg-black">
          <video
            src={videoUrl}
            controls
            className="w-full max-h-96 object-contain"
          >
            Votre navigateur ne supporte pas la lecture de vidéos.
          </video>
          <div className="absolute top-2 right-2">
            <Button
              onClick={handleDeleteExisting}
              size="sm"
              variant="solid"
              disabled={disabled}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              <XMarkIcon className="h-4 w-4 mr-1" />
              Supprimer
            </Button>
          </div>
        </div>
      )}

      {/* Prévisualisation de la nouvelle vidéo */}
      {previewUrl && selectedFile && (
        <div className="relative rounded-lg overflow-hidden bg-black">
          <video
            src={previewUrl}
            controls
            className="w-full max-h-96 object-contain"
          >
            Votre navigateur ne supporte pas la lecture de vidéos.
          </video>
          <div className="absolute top-2 right-2">
            <Button
              onClick={handleRemoveSelected}
              size="sm"
              variant="solid"
              disabled={disabled}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              <XMarkIcon className="h-4 w-4 mr-1" />
              Retirer
            </Button>
          </div>
          <div className="absolute bottom-2 left-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
            {selectedFile.name} ({formatFileSize(selectedFile.size)})
          </div>
        </div>
      )}

      {/* Zone d'upload */}
      {!videoUrl && !previewUrl && (
        <div
          className={`
            border-2 border-dashed rounded-lg p-8 text-center transition-colors
            ${isDragOver ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'border-gray-300 dark:border-gray-700'}
            ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:border-blue-400 dark:hover:border-blue-600'}
          `}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={!disabled ? handleBrowseClick : undefined}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept={acceptedExtensions}
            onChange={handleInputChange}
            disabled={disabled}
            className="hidden"
          />

          <div className="flex flex-col items-center space-y-4">
            <div className="p-4 bg-gray-100 dark:bg-gray-800 rounded-full">
              <VideoCameraIcon className="h-12 w-12 text-gray-400 dark:text-gray-500" />
            </div>

            <div className="space-y-2">
              <p className="text-lg font-medium text-gray-700 dark:text-gray-300">
                Ajouter une vidéo de présentation
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Glissez-déposez ou cliquez pour sélectionner
              </p>
              <p className="text-xs text-gray-400 dark:text-gray-500">
                MP4, WebM, MOV ou AVI • Max 100MB
              </p>
              <p className="text-xs text-blue-500 dark:text-blue-400">
                💡 Durée recommandée: 2-5 minutes
              </p>
            </div>

            <Button
              type="button"
              variant="solid"
              size="sm"
              disabled={disabled}
              onClick={(e) => {
                e.stopPropagation();
                handleBrowseClick();
              }}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              <ArrowUpTrayIcon className="h-4 w-4 mr-2" />
              Parcourir
            </Button>
          </div>
        </div>
      )}

      {/* Afficher l'erreur */}
      {error && (
        <div className="flex items-center space-x-2 text-red-600 dark:text-red-400 text-sm bg-red-50 dark:bg-red-900/20 p-3 rounded-lg">
          <ExclamationTriangleIcon className="h-5 w-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Recommandations */}
      {(videoUrl || previewUrl) && (
        <div className="text-xs text-gray-500 dark:text-gray-400 space-y-1">
          <p>✓ Formats supportés: MP4 (recommandé), WebM, MOV, AVI</p>
          <p>✓ Taille maximale: 100MB</p>
          <p>✓ Durée recommandée: 2-5 minutes</p>
          <p>✓ Résolution recommandée: 1080p (1920x1080) ou 720p (1280x720)</p>
        </div>
      )}
    </div>
  );
};

export default CampaignVideoUpload;
