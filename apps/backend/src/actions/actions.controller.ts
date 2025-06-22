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
  ParseIntPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { ActionsService } from './actions.service';
import { CreateActionDto } from './dto/create-action.dto';
import { UpdateActionDto } from './dto/update-action.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('actions')
@Controller('actions')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ActionsController {
  constructor(private readonly actionsService: ActionsService) {}

  @Post()
  @ApiOperation({ summary: 'Créer une nouvelle action' })
  @ApiResponse({ status: 201, description: 'Action créée avec succès' })
  @ApiResponse({
    status: 400,
    description: 'Position déjà occupée ou défi plein',
  })
  create(@Body() createActionDto: CreateActionDto) {
    return this.actionsService.create(createActionDto);
  }

  @Get()
  @ApiOperation({ summary: 'Récupérer toutes les actions' })
  @ApiQuery({
    name: 'challengeId',
    required: false,
    description: 'Filtrer par défi',
  })
  @ApiResponse({ status: 200, description: 'Liste des actions' })
  findAll(@Query('challengeId') challengeId?: string) {
    if (challengeId) {
      return this.actionsService.findByChallenge(parseInt(challengeId));
    }
    return this.actionsService.findAll();
  }

  @Get('global-progress')
  @ApiOperation({
    summary: 'Récupérer le progrès global pour le dashboard marraine',
  })
  @ApiResponse({ status: 200, description: 'Statistiques de progrès global' })
  getGlobalProgress() {
    return this.actionsService.getGlobalProgress();
  }

  @Get('team-progress/:managerId')
  @ApiOperation({
    summary: 'Récupérer le progrès équipe pour le dashboard manager',
  })
  @ApiResponse({ status: 200, description: 'Statistiques de progrès équipe' })
  getTeamProgress(@Param('managerId', ParseIntPipe) managerId: number) {
    return this.actionsService.getTeamProgress(managerId);
  }

  @Get('user/:userId/date/:date')
  @ApiOperation({ summary: 'Récupérer les actions utilisateur pour une date' })
  @ApiResponse({
    status: 200,
    description: 'Liste des actions utilisateur pour la date',
  })
  getUserActionsForDate(
    @Param('userId', ParseIntPipe) userId: number,
    @Param('date') date: string,
  ) {
    return this.actionsService.getUserActionsForDate(userId, date);
  }

  @Get('user/:userId/challenge/:challengeId')
  @ApiOperation({ summary: 'Récupérer les actions utilisateur pour un défi' })
  @ApiResponse({
    status: 200,
    description: 'Liste des actions utilisateur pour le défi',
  })
  getUserActionsForChallenge(
    @Param('userId', ParseIntPipe) userId: number,
    @Param('challengeId', ParseIntPipe) challengeId: number,
  ) {
    return this.actionsService.getUserActionsForChallenge(userId, challengeId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Récupérer une action par ID' })
  @ApiResponse({ status: 200, description: 'Action trouvée' })
  @ApiResponse({ status: 404, description: 'Action non trouvée' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.actionsService.findOne(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Mettre à jour une action' })
  @ApiResponse({ status: 200, description: 'Action mise à jour avec succès' })
  @ApiResponse({ status: 404, description: 'Action non trouvée' })
  @ApiResponse({ status: 400, description: 'Position déjà occupée' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateActionDto: UpdateActionDto,
  ) {
    return this.actionsService.update(id, updateActionDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Supprimer une action' })
  @ApiResponse({ status: 200, description: 'Action supprimée avec succès' })
  @ApiResponse({ status: 404, description: 'Action non trouvée' })
  @ApiResponse({
    status: 400,
    description: 'Impossible de supprimer une action assignée',
  })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.actionsService.remove(id);
  }

  @Post(':id/assign')
  @ApiOperation({ summary: 'Assigner une action aux utilisateurs' })
  @ApiResponse({ status: 200, description: 'Action assignée avec succès' })
  assignToUsers(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { userIds: number[] },
  ) {
    return this.actionsService.assignActionToUsers(id, body.userIds);
  }

  @Put('user-action/:userActionId/complete')
  @ApiOperation({ summary: 'Compléter une action utilisateur' })
  @ApiResponse({ status: 200, description: 'Action complétée avec succès' })
  @ApiResponse({ status: 404, description: 'Action utilisateur non trouvée' })
  completeUserAction(
    @Param('userActionId', ParseIntPipe) userActionId: number,
    @Body() body: { proofUrl?: string },
  ) {
    return this.actionsService.completeUserAction(userActionId, body.proofUrl);
  }
}
