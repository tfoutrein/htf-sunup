'use client';

import React, { useState, useRef } from 'react';
import { Button } from './Button';
import {
  CameraIcon,
  XMarkIcon,
  EyeIcon,
  TrashIcon,
  PhotoIcon,
  VideoCameraIcon,
} from '@heroicons/react/24/outline';

export interface ProofFile {
  id: string;
  file: File;
  previewUrl: string;
  type: 'image' | 'video';
}

export interface MultiProofUploadProps {
  files: ProofFile[];
  onFilesChange: (files: ProofFile[]) => void;
  maxFiles?: number;
  disabled?: boolean;
  className?: string;
}

const MultiProofUpload: React.FC<MultiProofUploadProps> = ({
  files,
  onFilesChange,
  maxFiles = 5,
  disabled = false,
  className = '',
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Types de fichiers acceptés
  const acceptedFileTypes = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif',
    'image/webp',
    'video/mp4',
    'video/quicktime',
    'video/x-msvideo',
    'video/webm',
  ];

  const acceptedExtensions = '.jpg,.jpeg,.png,.gif,.webp,.mp4,.mov,.avi,.webm';

  // Valider un fichier
  const validateFile = (file: File): string | null => {
    // Vérifier le type
    if (!acceptedFileTypes.includes(file.type)) {
      return 'Type de fichier non supporté. Utilisez JPG, PNG, GIF, WebP, MP4, MOV, AVI ou WebM.';
    }

    // Vérifier la taille (10MB max)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      return 'Fichier trop volumineux. Taille maximale: 10MB.';
    }

    return null;
  };

  // Créer un objet ProofFile à partir d'un File
  const createProofFile = (file: File): ProofFile => {
    const type = file.type.startsWith('image/') ? 'image' : 'video';
    const previewUrl = URL.createObjectURL(file);

    return {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      file,
      previewUrl,
      type,
    };
  };

  // Gérer la sélection de fichiers
  const handleFileSelect = (selectedFiles: FileList | null) => {
    if (!selectedFiles || disabled) return;

    const newFiles: ProofFile[] = [];
    const errors: string[] = [];

    // Vérifier si on peut ajouter tous les fichiers
    const totalFilesAfter = files.length + selectedFiles.length;
    if (totalFilesAfter > maxFiles) {
      errors.push(
        `Maximum ${maxFiles} preuves autorisées. Vous ne pouvez ajouter que ${maxFiles - files.length} fichier(s) supplémentaire(s).`,
      );
      return;
    }

    // Valider et traiter chaque fichier
    Array.from(selectedFiles).forEach((file, index) => {
      const error = validateFile(file);
      if (error) {
        errors.push(`${file.name}: ${error}`);
      } else {
        newFiles.push(createProofFile(file));
      }
    });

    // Afficher les erreurs s'il y en a
    if (errors.length > 0) {
      alert(errors.join('\n'));
      return;
    }

    // Ajouter les nouveaux fichiers
    const updatedFiles = [...files, ...newFiles];
    onFilesChange(updatedFiles);
  };

  // Supprimer un fichier
  const removeFile = (fileId: string) => {
    const fileToRemove = files.find((f) => f.id === fileId);
    if (fileToRemove) {
      URL.revokeObjectURL(fileToRemove.previewUrl);
    }

    const updatedFiles = files.filter((f) => f.id !== fileId);
    onFilesChange(updatedFiles);
  };

  // Gérer le clic sur le bouton d'ajout
  const handleAddClick = () => {
    if (disabled || files.length >= maxFiles) return;
    fileInputRef.current?.click();
  };

  // Gérer le drag & drop
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled) {
      setIsDragOver(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);

    if (disabled) return;

    const droppedFiles = e.dataTransfer.files;
    handleFileSelect(droppedFiles);
  };

  // Prévisualisation d'un fichier
  const openPreview = (proofFile: ProofFile) => {
    // Ouvrir dans un nouvel onglet
    window.open(proofFile.previewUrl, '_blank');
  };

  const canAddMore = !disabled && files.length < maxFiles;

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Zone d'upload */}
      {canAddMore && (
        <div
          className={`
            border-2 border-dashed rounded-lg p-6 text-center transition-colors
            ${isDragOver ? 'border-blue-400 bg-blue-50' : 'border-gray-300'}
            ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:border-gray-400'}
          `}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={handleAddClick}
        >
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept={acceptedExtensions}
            onChange={(e) => handleFileSelect(e.target.files)}
            className="hidden"
            disabled={disabled}
          />

          <CameraIcon className="w-12 h-12 mx-auto text-gray-400 mb-4" />
          <p className="text-sm text-gray-600 mb-2">
            Cliquez ou glissez-déposez vos preuves ici
          </p>
          <p className="text-xs text-gray-500">
            JPG, PNG, GIF, WebP, MP4, MOV, AVI, WebM (max. 10MB par fichier)
          </p>
          <p className="text-xs text-gray-500 mt-1">
            {files.length}/{maxFiles} preuves ajoutées
          </p>
        </div>
      )}

      {/* Bouton d'ajout alternatif si limite atteinte */}
      {!canAddMore && files.length < maxFiles && (
        <Button
          variant="bordered"
          onPress={handleAddClick}
          disabled={disabled}
          startContent={<CameraIcon className="w-4 h-4" />}
          className="w-full"
        >
          Ajouter une preuve ({files.length}/{maxFiles})
        </Button>
      )}

      {/* Liste des fichiers ajoutés */}
      {files.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-gray-700">
            Preuves sélectionnées ({files.length}/{maxFiles})
          </h4>

          <div className="grid grid-cols-1 gap-3">
            {files.map((proofFile) => (
              <div
                key={proofFile.id}
                className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg bg-gray-50"
              >
                {/* Miniature */}
                <div className="flex-shrink-0">
                  {proofFile.type === 'image' ? (
                    <img
                      src={proofFile.previewUrl}
                      alt={proofFile.file.name}
                      className="w-12 h-12 object-cover rounded-md border"
                    />
                  ) : (
                    <div className="w-12 h-12 bg-gray-200 rounded-md border flex items-center justify-center">
                      <VideoCameraIcon className="w-6 h-6 text-gray-500" />
                    </div>
                  )}
                </div>

                {/* Informations du fichier */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {proofFile.file.name}
                  </p>
                  <p className="text-xs text-gray-500">
                    {proofFile.type === 'image' ? 'Image' : 'Vidéo'} •{' '}
                    {(proofFile.file.size / 1024 / 1024).toFixed(1)} MB
                  </p>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                  <Button
                    isIconOnly
                    size="sm"
                    variant="light"
                    onPress={() => openPreview(proofFile)}
                    title="Prévisualiser"
                  >
                    <EyeIcon className="w-4 h-4" />
                  </Button>

                  <Button
                    isIconOnly
                    size="sm"
                    variant="light"
                    color="danger"
                    onPress={() => removeFile(proofFile.id)}
                    disabled={disabled}
                    title="Supprimer"
                  >
                    <TrashIcon className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Message si limite atteinte */}
      {files.length >= maxFiles && (
        <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-sm text-yellow-800">
            Maximum de {maxFiles} preuves atteint. Supprimez une preuve pour en
            ajouter une nouvelle.
          </p>
        </div>
      )}
    </div>
  );
};

export { MultiProofUpload };
