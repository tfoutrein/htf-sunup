import { IsString, IsDateString, IsBoolean, IsOptional } from 'class-validator';

export class CreateAppVersionDto {
  @IsString()
  version: string;

  @IsString()
  title: string;

  @IsDateString()
  releaseDate: string;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @IsBoolean()
  @IsOptional()
  isMajor?: boolean;

  @IsString()
  shortDescription: string;

  @IsString()
  @IsOptional()
  fullReleaseNotes?: string;
}
