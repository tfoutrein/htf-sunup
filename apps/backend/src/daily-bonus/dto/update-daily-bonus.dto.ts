import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsEnum } from 'class-validator';

export enum BonusStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
}

export class UpdateDailyBonusDto {
  @ApiProperty({
    description: 'Statut du bonus',
    enum: BonusStatus,
    required: false,
  })
  @IsOptional()
  @IsEnum(BonusStatus)
  status?: BonusStatus;

  @ApiProperty({
    description: 'URL de preuve (mise à jour)',
    required: false,
  })
  @IsOptional()
  @IsString()
  proofUrl?: string;

  @ApiProperty({
    description: 'Commentaire de révision du manager',
    required: false,
  })
  @IsOptional()
  @IsString()
  reviewComment?: string;
}
