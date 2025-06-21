import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsIn,
  IsDateString,
  IsOptional,
  MinLength,
} from 'class-validator';

export class CreateActionDto {
  @ApiProperty({
    description: 'Action title',
    example: 'Appel prospection client',
  })
  @IsString()
  @MinLength(5)
  title: string;

  @ApiProperty({
    description: 'Action description',
    example:
      'Contacter 3 prospects qualifiés pour présenter nos produits Aloe Vera',
    required: false,
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    description: 'Action type',
    example: 'vente',
    enum: ['vente', 'recrutement', 'reseaux_sociaux'],
  })
  @IsString()
  @IsIn(['vente', 'recrutement', 'reseaux_sociaux'])
  type: string;

  @ApiProperty({
    description: 'Action date (YYYY-MM-DD)',
    example: '2025-06-21',
  })
  @IsDateString()
  date: string;
}
