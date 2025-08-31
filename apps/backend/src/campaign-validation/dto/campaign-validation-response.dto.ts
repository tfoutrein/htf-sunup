import { ApiProperty } from '@nestjs/swagger';

export class CampaignValidationResponseDto {
  @ApiProperty({ description: 'Validation ID' })
  id: number;

  @ApiProperty({ description: 'FBO user ID' })
  userId: number;

  @ApiProperty({ description: 'FBO name' })
  userName: string;

  @ApiProperty({ description: 'FBO email' })
  userEmail: string;

  @ApiProperty({ description: 'Campaign ID' })
  campaignId: number;

  @ApiProperty({ description: 'Campaign name' })
  campaignName: string;

  @ApiProperty({
    description: 'Validation status of the campaign for this FBO',
    example: 'approved',
    enum: ['pending', 'approved', 'rejected'],
  })
  status: 'pending' | 'approved' | 'rejected';

  @ApiProperty({ description: 'Manager who validated (if any)' })
  validatedBy?: number;

  @ApiProperty({ description: 'Validation date (if validated)' })
  validatedAt?: Date;

  @ApiProperty({ description: 'Validation comment (if any)' })
  comment?: string;

  @ApiProperty({ description: 'Total earnings for this FBO in this campaign' })
  totalEarnings: number;

  @ApiProperty({ description: 'Number of completed challenges' })
  completedChallenges: number;

  @ApiProperty({ description: 'Total number of challenges in campaign' })
  totalChallenges: number;

  @ApiProperty({ description: 'Completion percentage' })
  completionPercentage: number;

  @ApiProperty({ description: 'Creation date' })
  createdAt: Date;

  @ApiProperty({ description: 'Last update date' })
  updatedAt: Date;
}
