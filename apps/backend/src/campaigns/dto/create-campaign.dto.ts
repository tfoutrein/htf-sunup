import {
  IsString,
  IsNotEmpty,
  IsDateString,
  IsOptional,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateCampaignDto {
  @ApiProperty({ description: 'Nom de la campagne' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ description: 'Description de la campagne', required: false })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ description: 'Date de début de la campagne (YYYY-MM-DD)' })
  @IsDateString()
  @IsNotEmpty()
  startDate: string;

  @ApiProperty({ description: 'Date de fin de la campagne (YYYY-MM-DD)' })
  @IsDateString()
  @IsNotEmpty()
  endDate: string;
}
