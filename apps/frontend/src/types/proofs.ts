// Types pour les preuves côté frontend

export interface Proof {
  id: number;
  url: string;
  type: 'image' | 'video';
  originalName: string;
  size: number;
  mimeType: string;
  userActionId?: number;
  dailyBonusId?: number;
  createdAt: string;
  updatedAt: string;
}

export interface ProofFile {
  id: string;
  file: File;
  previewUrl: string;
  type: 'image' | 'video';
}

export interface ProofUploadResponse {
  id: number;
  url: string;
  type: 'image' | 'video';
  originalName: string;
  size: number;
  mimeType: string;
  userActionId?: number;
  dailyBonusId?: number;
  createdAt: string;
  updatedAt: string;
}

export interface ProofCount {
  count: number;
}

export interface SignedUrlResponse {
  url: string;
}

// Pour le composant MultiProofUpload
export interface MultiProofUploadState {
  files: ProofFile[];
  isUploading: boolean;
  uploadProgress: number;
  errors: string[];
}

// Pour les erreurs d'upload
export interface ProofUploadError {
  fileName: string;
  error: string;
}
