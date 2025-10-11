import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
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
import { CreateUnlockConditionDto } from './dto/create-unlock-condition.dto';
import { UpdateUnlockConditionDto } from './dto/update-unlock-condition.dto';
import { UpdateConditionFulfillmentDto } from './dto/update-condition-fulfillment.dto';

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

  // === ENDPOINTS POUR LES CONDITIONS DE DÉBLOCAGE ===

  @Post('campaigns/:campaignId/conditions')
  @ApiOperation({
    summary: 'Create unlock conditions for a campaign',
    description:
      'Creates multiple unlock conditions for a campaign. Only managers can do this.',
  })
  @ApiParam({
    name: 'campaignId',
    description: 'Campaign ID',
    type: 'number',
  })
  @ApiResponse({
    status: 201,
    description: 'Unlock conditions created successfully',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - User is not a manager',
  })
  @ApiResponse({
    status: 404,
    description: 'Campaign not found',
  })
  async createUnlockConditions(
    @Request() req,
    @Param('campaignId', ParseIntPipe) campaignId: number,
    @Body() conditions: CreateUnlockConditionDto[],
  ) {
    // Vérifier que l'utilisateur est un manager
    if (req.user.role !== 'manager') {
      throw new Error('Only managers can create unlock conditions');
    }

    return this.campaignValidationService.createUnlockConditions(
      campaignId,
      conditions,
    );
  }

  @Get('campaigns/:campaignId/conditions')
  @ApiOperation({
    summary: 'Get unlock conditions for a campaign',
    description: 'Returns all unlock conditions for a specific campaign',
  })
  @ApiParam({
    name: 'campaignId',
    description: 'Campaign ID',
    type: 'number',
  })
  @ApiResponse({
    status: 200,
    description: 'List of unlock conditions',
  })
  async getUnlockConditions(
    @Param('campaignId', ParseIntPipe) campaignId: number,
  ) {
    return this.campaignValidationService.getUnlockConditionsByCampaign(
      campaignId,
    );
  }

  @Put('conditions/:conditionId')
  @ApiOperation({
    summary: 'Update an unlock condition',
    description: 'Updates an unlock condition. Only managers can do this.',
  })
  @ApiParam({
    name: 'conditionId',
    description: 'Condition ID',
    type: 'number',
  })
  @ApiResponse({
    status: 200,
    description: 'Condition updated successfully',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - User is not a manager',
  })
  @ApiResponse({
    status: 404,
    description: 'Condition not found',
  })
  async updateUnlockCondition(
    @Request() req,
    @Param('conditionId', ParseIntPipe) conditionId: number,
    @Body() updateDto: UpdateUnlockConditionDto,
  ) {
    // Vérifier que l'utilisateur est un manager
    if (req.user.role !== 'manager') {
      throw new Error('Only managers can update unlock conditions');
    }

    return this.campaignValidationService.updateUnlockCondition(
      conditionId,
      updateDto,
    );
  }

  @Delete('conditions/:conditionId')
  @ApiOperation({
    summary: 'Delete an unlock condition',
    description: 'Deletes an unlock condition. Only managers can do this.',
  })
  @ApiParam({
    name: 'conditionId',
    description: 'Condition ID',
    type: 'number',
  })
  @ApiResponse({
    status: 200,
    description: 'Condition deleted successfully',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - User is not a manager',
  })
  @ApiResponse({
    status: 404,
    description: 'Condition not found',
  })
  async deleteUnlockCondition(
    @Request() req,
    @Param('conditionId', ParseIntPipe) conditionId: number,
  ) {
    // Vérifier que l'utilisateur est un manager
    if (req.user.role !== 'manager') {
      throw new Error('Only managers can delete unlock conditions');
    }

    return this.campaignValidationService.deleteUnlockCondition(conditionId);
  }

  @Get(':validationId/condition-fulfillments')
  @ApiOperation({
    summary: 'Get condition fulfillments for a validation',
    description:
      'Returns all conditions with their fulfillment status for a specific validation',
  })
  @ApiParam({
    name: 'validationId',
    description: 'Validation ID',
    type: 'number',
  })
  @ApiResponse({
    status: 200,
    description: 'List of conditions with fulfillment status',
  })
  @ApiResponse({
    status: 404,
    description: 'Validation not found',
  })
  async getConditionFulfillments(
    @Param('validationId', ParseIntPipe) validationId: number,
  ) {
    return this.campaignValidationService.getConditionFulfillments(
      validationId,
    );
  }

  @Put(':validationId/conditions/:conditionId/fulfill')
  @ApiOperation({
    summary: 'Update condition fulfillment status',
    description:
      'Marks a condition as fulfilled or not fulfilled for a specific validation. Only managers can do this.',
  })
  @ApiParam({
    name: 'validationId',
    description: 'Validation ID',
    type: 'number',
  })
  @ApiParam({
    name: 'conditionId',
    description: 'Condition ID',
    type: 'number',
  })
  @ApiResponse({
    status: 200,
    description: 'Condition fulfillment updated successfully',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Manager cannot validate this FBO',
  })
  @ApiResponse({
    status: 404,
    description: 'Validation or condition not found',
  })
  async updateConditionFulfillment(
    @Request() req,
    @Param('validationId', ParseIntPipe) validationId: number,
    @Param('conditionId', ParseIntPipe) conditionId: number,
    @Body() updateDto: UpdateConditionFulfillmentDto,
  ) {
    const managerId = req.user.id;

    // Vérifier que l'utilisateur est un manager
    if (req.user.role !== 'manager') {
      throw new Error('Only managers can update condition fulfillments');
    }

    return this.campaignValidationService.updateConditionFulfillment(
      validationId,
      conditionId,
      updateDto,
      managerId,
    );
  }
}
