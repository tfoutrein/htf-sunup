import { PartialType } from '@nestjs/swagger';
import { IsString, IsOptional, IsIn } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { CreateCampaignDto } from './create-campaign.dto';

export class UpdateCampaignDto extends PartialType(CreateCampaignDto) {
  @ApiProperty({
    description: 'Statut de la campagne',
    enum: ['draft', 'active', 'completed', 'cancelled'],
    required: false,
  })
  @IsString()
  @IsOptional()
  @IsIn(['draft', 'active', 'completed', 'cancelled'])
  status?: string;
}
