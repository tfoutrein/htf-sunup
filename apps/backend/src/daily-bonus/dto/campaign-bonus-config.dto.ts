import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNumber, IsOptional } from 'class-validator';

export class CreateCampaignBonusConfigDto {
  @ApiProperty({ description: 'ID de la campagne' })
  @IsNumber()
  campaignId: number;

  @ApiProperty({
    description: 'Montant du bonus panier en euros',
    example: '1.00',
    default: '1.00',
  })
  @IsString()
  basketBonusAmount: string;

  @ApiProperty({
    description: 'Montant du bonus parrainage en euros',
    example: '5.00',
    default: '5.00',
  })
  @IsString()
  sponsorshipBonusAmount: string;
}

export class UpdateCampaignBonusConfigDto {
  @ApiProperty({
    description: 'Montant du bonus panier en euros',
    example: '1.00',
    required: false,
  })
  @IsOptional()
  @IsString()
  basketBonusAmount?: string;

  @ApiProperty({
    description: 'Montant du bonus parrainage en euros',
    example: '5.00',
    required: false,
  })
  @IsOptional()
  @IsString()
  sponsorshipBonusAmount?: string;
}
