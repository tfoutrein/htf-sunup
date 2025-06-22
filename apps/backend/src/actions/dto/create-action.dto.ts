import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsIn,
  IsOptional,
  MinLength,
  IsInt,
  IsPositive,
  Min,
  Max,
} from 'class-validator';

export class CreateActionDto {
  @ApiProperty({
    description: 'Challenge ID this action belongs to',
    example: 1,
  })
  @IsInt()
  @IsPositive()
  challengeId: number;

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
    description: 'Order of action in the challenge (1-6)',
    example: 1,
  })
  @IsInt()
  @Min(1)
  @Max(6)
  order: number;
}
