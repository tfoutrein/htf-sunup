import { ApiProperty } from '@nestjs/swagger';
import {
  IsNumber,
  IsString,
  IsDateString,
  IsEnum,
  IsOptional,
  IsDecimal,
} from 'class-validator';

export enum BonusType {
  BASKET = 'basket',
  SPONSORSHIP = 'sponsorship',
}

export class CreateDailyBonusDto {
  @ApiProperty({ description: 'ID de la campagne' })
  @IsNumber()
  campaignId: number;

  @ApiProperty({ description: 'Date du bonus (YYYY-MM-DD)' })
  @IsDateString()
  bonusDate: string;

  @ApiProperty({
    description: 'Type de bonus',
    enum: BonusType,
    example: BonusType.BASKET,
  })
  @IsEnum(BonusType)
  bonusType: BonusType;

  @ApiProperty({
    description: 'Montant du bonus en euros',
    example: '1.00',
  })
  @IsString()
  amount: string;

  @ApiProperty({
    description: 'URL de preuve (optionnel, peut être ajoutée via upload)',
    required: false,
  })
  @IsOptional()
  @IsString()
  proofUrl?: string;
}
