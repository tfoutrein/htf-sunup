export interface AppVersion {
  id: number;
  version: string;
  title: string;
  releaseDate: string;
  isActive: boolean;
  isMajor: boolean;
  shortDescription: string;
  fullReleaseNotes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface UserVersionTracking {
  id: number;
  userId: number;
  versionId: number;
  hasSeenPopup: boolean;
  seenAt?: string;
  createdAt: string;
}

export interface CreateAppVersionDto {
  version: string;
  title: string;
  releaseDate: string;
  isActive?: boolean;
  isMajor?: boolean;
  shortDescription: string;
  fullReleaseNotes?: string;
}

export interface MarkVersionSeenDto {
  versionId: number;
}
