import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Put,
  UseGuards,
  Request,
  Query,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { ActionsService } from './actions.service';
import { CreateActionDto } from './dto/create-action.dto';
import { UpdateActionDto } from './dto/update-action.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('actions')
@Controller('api/actions')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ActionsController {
  constructor(private readonly actionsService: ActionsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new action' })
  @ApiResponse({ status: 201, description: 'Action created successfully' })
  create(@Body() createActionDto: CreateActionDto, @Request() req) {
    return this.actionsService.create(createActionDto, req.user.id);
  }

  @Get()
  @ApiOperation({ summary: 'Get all actions' })
  @ApiResponse({ status: 200, description: 'List of actions' })
  findAll() {
    return this.actionsService.findAll();
  }

  @Get('date/:date')
  @ApiOperation({ summary: 'Get actions by date' })
  @ApiResponse({ status: 200, description: 'List of actions for date' })
  getActionsByDate(@Param('date') date: string) {
    return this.actionsService.getActionsByDate(date);
  }

  @Get('my-actions')
  @ApiOperation({ summary: 'Get actions created by current user' })
  @ApiResponse({ status: 200, description: 'List of user actions' })
  getMyActions(@Request() req) {
    return this.actionsService.getActionsByCreator(req.user.id);
  }

  @Get('global-progress')
  @ApiOperation({ summary: 'Get global progress for marraine dashboard' })
  @ApiResponse({ status: 200, description: 'Global progress statistics' })
  getGlobalProgress() {
    return this.actionsService.getGlobalProgress();
  }

  @Get('team-progress/:managerId')
  @ApiOperation({ summary: 'Get team progress for manager dashboard' })
  @ApiResponse({ status: 200, description: 'Team progress statistics' })
  getTeamProgress(@Param('managerId') managerId: string) {
    return this.actionsService.getTeamProgress(+managerId);
  }

  @Get('user/:userId/date/:date')
  @ApiOperation({ summary: 'Get user actions for specific date' })
  @ApiResponse({ status: 200, description: 'List of user actions for date' })
  getUserActionsForDate(
    @Param('userId') userId: string,
    @Param('date') date: string,
  ) {
    return this.actionsService.getUserActionsForDate(+userId, date);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get an action by ID' })
  @ApiResponse({ status: 200, description: 'Action found' })
  @ApiResponse({ status: 404, description: 'Action not found' })
  findOne(@Param('id') id: string) {
    return this.actionsService.findOne(+id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update an action' })
  @ApiResponse({ status: 200, description: 'Action updated successfully' })
  @ApiResponse({ status: 404, description: 'Action not found' })
  update(@Param('id') id: string, @Body() updateActionDto: UpdateActionDto) {
    return this.actionsService.update(+id, updateActionDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete an action' })
  @ApiResponse({ status: 200, description: 'Action deleted successfully' })
  @ApiResponse({ status: 404, description: 'Action not found' })
  remove(@Param('id') id: string) {
    return this.actionsService.remove(+id);
  }

  @Post(':id/assign')
  @ApiOperation({ summary: 'Assign action to users' })
  @ApiResponse({ status: 200, description: 'Action assigned successfully' })
  assignToUsers(@Param('id') id: string, @Body() body: { userIds: number[] }) {
    return this.actionsService.assignActionToUsers(+id, body.userIds);
  }

  @Put('user-action/:userActionId/complete')
  @ApiOperation({ summary: 'Complete a user action' })
  @ApiResponse({ status: 200, description: 'Action completed successfully' })
  completeUserAction(
    @Param('userActionId') userActionId: string,
    @Body() body: { proofUrl?: string },
  ) {
    return this.actionsService.completeUserAction(+userActionId, body.proofUrl);
  }
}
