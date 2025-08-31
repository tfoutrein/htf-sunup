import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateCampaignValidationDto {
  @ApiProperty({
    description: 'Validation status for the FBO campaign',
    example: 'approved',
    enum: ['pending', 'approved', 'rejected'],
  })
  @IsEnum(['pending', 'approved', 'rejected'])
  status: 'pending' | 'approved' | 'rejected';

  @ApiProperty({
    description: 'Optional comment for the validation',
    example: 'Excellent performance this month',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  comment?: string;
}
