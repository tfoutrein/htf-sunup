import {
  Controller,
  Get,
  Put,
  Param,
  Body,
  UseGuards,
  Request,
  ParseIntPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CampaignValidationService } from './campaign-validation.service';
import { UpdateCampaignValidationDto } from './dto/update-campaign-validation.dto';
import { CampaignValidationResponseDto } from './dto/campaign-validation-response.dto';

@ApiTags('Campaign Validation')
@Controller('campaign-validation')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class CampaignValidationController {
  constructor(
    private readonly campaignValidationService: CampaignValidationService,
  ) {}

  @Get('my-status/:campaignId')
  @ApiOperation({
    summary: 'Get my campaign validation status',
    description:
      'Returns the validation status for the authenticated user in a specific campaign',
  })
  @ApiParam({
    name: 'campaignId',
    description: 'Campaign ID',
    type: 'number',
  })
  @ApiResponse({
    status: 200,
    description: 'User campaign validation status',
    type: CampaignValidationResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Campaign not found or no validation record',
  })
  async getMyCampaignValidationStatus(
    @Request() req,
    @Param('campaignId', ParseIntPipe) campaignId: number,
  ): Promise<CampaignValidationResponseDto> {
    const userId = req.user.id;
    return this.campaignValidationService.getOrCreateCampaignValidation(
      userId,
      campaignId,
    );
  }

  @Get('campaign/:campaignId')
  @ApiOperation({
    summary: 'Get campaign validations for all FBOs under manager hierarchy',
    description:
      'Returns validation status and performance data for all FBOs that the authenticated manager can validate',
  })
  @ApiParam({
    name: 'campaignId',
    description: 'Campaign ID',
    type: 'number',
  })
  @ApiResponse({
    status: 200,
    description: 'List of campaign validations',
    type: [CampaignValidationResponseDto],
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - User is not a manager',
  })
  @ApiResponse({
    status: 404,
    description: 'Campaign not found',
  })
  async getCampaignValidations(
    @Request() req,
    @Param('campaignId', ParseIntPipe) campaignId: number,
  ): Promise<CampaignValidationResponseDto[]> {
    const managerId = req.user.id;

    // Vérifier que l'utilisateur est un manager
    if (req.user.role !== 'manager') {
      throw new Error('Only managers can access campaign validations');
    }

    return this.campaignValidationService.getCampaignValidationsForManager(
      managerId,
      campaignId,
    );
  }

  @Put('user/:userId/campaign/:campaignId')
  @ApiOperation({
    summary: 'Update campaign validation for a specific FBO',
    description:
      'Updates the validation status for an FBO in a specific campaign. Only managers in the FBO hierarchy can perform this action.',
  })
  @ApiParam({
    name: 'userId',
    description: 'FBO User ID',
    type: 'number',
  })
  @ApiParam({
    name: 'campaignId',
    description: 'Campaign ID',
    type: 'number',
  })
  @ApiResponse({
    status: 200,
    description: 'Campaign validation updated successfully',
    type: CampaignValidationResponseDto,
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Manager cannot validate this FBO',
  })
  @ApiResponse({
    status: 404,
    description: 'User or campaign not found',
  })
  async updateCampaignValidation(
    @Request() req,
    @Param('userId', ParseIntPipe) userId: number,
    @Param('campaignId', ParseIntPipe) campaignId: number,
    @Body() updateDto: UpdateCampaignValidationDto,
  ): Promise<CampaignValidationResponseDto> {
    const managerId = req.user.id;

    // Vérifier que l'utilisateur est un manager
    if (req.user.role !== 'manager') {
      throw new Error('Only managers can update campaign validations');
    }

    return this.campaignValidationService.updateCampaignValidation(
      managerId,
      userId,
      campaignId,
      updateDto,
    );
  }
}
