import { IsBoolean, IsString, IsOptional, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateConditionFulfillmentDto {
  @ApiProperty({
    description: 'Si la condition est remplie ou non',
    example: true,
  })
  @IsBoolean()
  isFulfilled: boolean;

  @ApiPropertyOptional({
    description: 'Commentaire optionnel sur cette condition spécifique',
    example: 'Présent à 100% des formations',
    maxLength: 1000,
  })
  @IsOptional()
  @IsString()
  @MaxLength(1000, {
    message: 'Le commentaire ne peut pas dépasser 1000 caractères',
  })
  comment?: string;
}
