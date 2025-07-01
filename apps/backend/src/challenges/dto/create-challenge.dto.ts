import {
  IsString,
  IsNotEmpty,
  IsDateString,
  IsOptional,
  IsInt,
  IsPositive,
  IsNumber,
  Min,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateChallengeDto {
  @ApiProperty({ description: 'ID de la campagne' })
  @IsInt()
  @IsPositive()
  campaignId: number;

  @ApiProperty({ description: 'Date du défi (YYYY-MM-DD)' })
  @IsDateString()
  @IsNotEmpty()
  date: string;

  @ApiProperty({ description: 'Titre du défi' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({ description: 'Description du défi', required: false })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ description: 'Valeur du défi en euros', default: '0.50' })
  @IsString()
  @IsOptional()
  valueInEuro?: string;
}
