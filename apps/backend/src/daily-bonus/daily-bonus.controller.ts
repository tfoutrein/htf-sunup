import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
  ParseIntPipe,
  UseInterceptors,
  UploadedFile,
  Query,
  ForbiddenException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiConsumes,
  ApiQuery,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { DailyBonusService } from './daily-bonus.service';
import { CreateDailyBonusDto } from './dto/create-daily-bonus.dto';
import { UpdateDailyBonusDto } from './dto/update-daily-bonus.dto';
import {
  CreateCampaignBonusConfigDto,
  UpdateCampaignBonusConfigDto,
} from './dto/campaign-bonus-config.dto';

@ApiTags('daily-bonus')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('daily-bonus')
export class DailyBonusController {
  constructor(private readonly dailyBonusService: DailyBonusService) {}

  // === ENDPOINTS POUR LES FBO ===

  @Post()
  @ApiOperation({ summary: 'Déclarer un bonus quotidien' })
  @ApiResponse({ status: 201, description: 'Bonus créé avec succès' })
  @ApiResponse({
    status: 400,
    description: 'Données invalides ou campagne inactive',
  })
  @ApiResponse({ status: 404, description: 'Campagne non trouvée' })
  async create(
    @Body() createDailyBonusDto: CreateDailyBonusDto,
    @Request() req,
  ) {
    // Seuls les FBO peuvent créer des bonus
    if (req.user.role !== 'fbo') {
      throw new ForbiddenException('Seuls les FBO peuvent déclarer des bonus');
    }

    return this.dailyBonusService.create({
      ...createDailyBonusDto,
      userId: req.user.id,
    });
  }

  @Get('my-bonuses')
  @ApiOperation({ summary: "Récupérer les bonus de l'utilisateur connecté" })
  @ApiResponse({ status: 200, description: 'Liste des bonus utilisateur' })
  @ApiQuery({ name: 'campaignId', required: false, type: Number })
  @ApiQuery({ name: 'startDate', required: false, type: String })
  @ApiQuery({ name: 'endDate', required: false, type: String })
  getMyBonuses(
    @Request() req,
    @Query('campaignId') campaignId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.dailyBonusService.findUserDailyBonuses(
      req.user.id,
      campaignId ? parseInt(campaignId) : undefined,
      startDate,
      endDate,
    );
  }

  @Get('my-stats/:campaignId')
  @ApiOperation({
    summary: "Récupérer les statistiques de bonus de l'utilisateur",
  })
  @ApiResponse({ status: 200, description: 'Statistiques des bonus' })
  getMyStats(
    @Request() req,
    @Param('campaignId', ParseIntPipe) campaignId: number,
  ) {
    return this.dailyBonusService.getUserDailyBonusStats(
      req.user.id,
      campaignId,
    );
  }

  // === ENDPOINTS POUR LES MANAGERS ===

  @Get('campaign/:campaignId/bonuses')
  @ApiOperation({
    summary: "Récupérer tous les bonus d'une campagne (managers)",
  })
  @ApiResponse({ status: 200, description: 'Liste des bonus de la campagne' })
  @ApiResponse({ status: 403, description: 'Accès refusé' })
  getCampaignBonuses(
    @Param('campaignId', ParseIntPipe) campaignId: number,
    @Request() req,
  ) {
    if (req.user.role !== 'manager') {
      throw new ForbiddenException(
        'Seuls les managers peuvent voir les bonus de campagne',
      );
    }

    // Les managers ne voient que les bonus de leurs FBO
    return this.dailyBonusService.findCampaignDailyBonuses(
      campaignId,
      req.user.id,
    );
  }

  @Get('user/:userId/campaign/:campaignId')
  @ApiOperation({
    summary:
      "Récupérer les bonus d'un FBO spécifique pour une campagne (managers)",
  })
  @ApiResponse({
    status: 200,
    description: 'Liste des bonus du FBO pour la campagne',
  })
  @ApiResponse({ status: 403, description: 'Accès refusé' })
  @ApiResponse({
    status: 404,
    description: "Utilisateur non trouvé ou pas dans l'équipe",
  })
  getUserCampaignBonuses(
    @Param('userId', ParseIntPipe) userId: number,
    @Param('campaignId', ParseIntPipe) campaignId: number,
    @Request() req,
  ) {
    if (req.user.role !== 'manager') {
      throw new ForbiddenException(
        'Seuls les managers peuvent voir les bonus de leurs FBO',
      );
    }

    return this.dailyBonusService.findUserCampaignBonuses(
      userId,
      campaignId,
      req.user.id,
    );
  }

  // === CONFIGURATION DES MONTANTS DE BONUS ===

  @Post('config')
  @ApiOperation({
    summary: 'Créer la configuration des bonus pour une campagne',
  })
  @ApiResponse({ status: 201, description: 'Configuration créée' })
  @ApiResponse({ status: 403, description: 'Accès refusé' })
  createBonusConfig(
    @Body() createConfigDto: CreateCampaignBonusConfigDto,
    @Request() req,
  ) {
    if (req.user.role !== 'manager') {
      throw new ForbiddenException(
        'Seuls les managers peuvent configurer les bonus',
      );
    }

    return this.dailyBonusService.createBonusConfig(createConfigDto);
  }

  @Get('config/:campaignId')
  @ApiOperation({
    summary: "Récupérer la configuration des bonus d'une campagne",
  })
  @ApiResponse({ status: 200, description: 'Configuration des bonus' })
  getBonusConfig(@Param('campaignId', ParseIntPipe) campaignId: number) {
    return this.dailyBonusService.getBonusConfig(campaignId);
  }

  @Patch('config/:campaignId')
  @ApiOperation({ summary: 'Mettre à jour la configuration des bonus' })
  @ApiResponse({ status: 200, description: 'Configuration mise à jour' })
  @ApiResponse({ status: 403, description: 'Accès refusé' })
  updateBonusConfig(
    @Param('campaignId', ParseIntPipe) campaignId: number,
    @Body() updateConfigDto: UpdateCampaignBonusConfigDto,
    @Request() req,
  ) {
    if (req.user.role !== 'manager') {
      throw new ForbiddenException(
        'Seuls les managers peuvent modifier la configuration',
      );
    }

    return this.dailyBonusService.updateBonusConfig(
      campaignId,
      updateConfigDto,
    );
  }

  // === ROUTES GÉNÉRIQUES (À METTRE À LA FIN) ===

  @Get(':id')
  @ApiOperation({ summary: 'Récupérer un bonus par ID' })
  @ApiResponse({ status: 200, description: 'Détails du bonus' })
  @ApiResponse({ status: 404, description: 'Bonus non trouvé' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.dailyBonusService.findOne(id);
  }

  @Get(':id/proof')
  @ApiOperation({ summary: "Récupérer l'URL sécurisée de la preuve" })
  @ApiResponse({ status: 200, description: 'URL de preuve générée' })
  @ApiResponse({ status: 404, description: 'Preuve non trouvée' })
  getProofUrl(@Param('id', ParseIntPipe) id: number) {
    return this.dailyBonusService.getProofUrl(id);
  }

  @Post(':id/proof')
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Uploader une preuve photo pour un bonus' })
  @ApiResponse({ status: 201, description: 'Preuve uploadée avec succès' })
  @ApiResponse({ status: 400, description: 'Fichier manquant ou invalide' })
  @ApiResponse({ status: 403, description: 'Accès refusé' })
  uploadProof(
    @Param('id', ParseIntPipe) id: number,
    @UploadedFile() file: Express.Multer.File,
    @Request() req,
  ) {
    return this.dailyBonusService.uploadProof(id, file, req.user.id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Mettre à jour un bonus (pour les managers)' })
  @ApiResponse({ status: 200, description: 'Bonus mis à jour' })
  @ApiResponse({ status: 403, description: 'Accès refusé' })
  @ApiResponse({ status: 404, description: 'Bonus non trouvé' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDailyBonusDto: UpdateDailyBonusDto,
    @Request() req,
  ) {
    // Seuls les managers peuvent approuver/rejeter des bonus
    if (req.user.role !== 'manager') {
      throw new ForbiddenException(
        'Seuls les managers peuvent modifier le statut des bonus',
      );
    }

    return this.dailyBonusService.update(id, updateDailyBonusDto, req.user.id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Supprimer un bonus (si en attente)' })
  @ApiResponse({ status: 200, description: 'Bonus supprimé' })
  @ApiResponse({ status: 403, description: 'Suppression non autorisée' })
  @ApiResponse({ status: 404, description: 'Bonus non trouvé' })
  remove(@Param('id', ParseIntPipe) id: number, @Request() req) {
    return this.dailyBonusService.remove(id, req.user.id);
  }
}
