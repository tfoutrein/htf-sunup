import {
  IsString,
  IsInt,
  MinLength,
  MaxLength,
  Min,
  IsOptional,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateUnlockConditionDto {
  @ApiProperty({
    description: 'Description libre de la condition de déblocage',
    example: 'Présence à toutes les formations du mois',
    minLength: 10,
    maxLength: 500,
  })
  @IsString()
  @MinLength(10, {
    message: 'La description doit contenir au moins 10 caractères',
  })
  @MaxLength(500, {
    message: 'La description ne peut pas dépasser 500 caractères',
  })
  description: string;

  @ApiPropertyOptional({
    description: "Ordre d'affichage de la condition (1, 2, 3...)",
    example: 1,
    minimum: 1,
    default: 1,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  displayOrder?: number;
}
