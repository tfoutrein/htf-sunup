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
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiConsumes,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CampaignsService } from './campaigns.service';
import { CreateCampaignDto } from './dto/create-campaign.dto';
import { UpdateCampaignDto } from './dto/update-campaign.dto';

@ApiTags('campaigns')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('campaigns')
export class CampaignsController {
  constructor(private readonly campaignsService: CampaignsService) {}

  @Post()
  @ApiOperation({ summary: 'Créer une nouvelle campagne' })
  @ApiResponse({ status: 201, description: 'Campagne créée avec succès' })
  create(@Body() createCampaignDto: CreateCampaignDto, @Request() req) {
    return this.campaignsService.create(createCampaignDto, req.user.id);
  }

  @Get()
  @ApiOperation({ summary: 'Récupérer toutes les campagnes' })
  @ApiResponse({ status: 200, description: 'Liste des campagnes' })
  findAll() {
    return this.campaignsService.findAll();
  }

  @Get('active')
  @ApiOperation({ summary: 'Récupérer les campagnes actives' })
  @ApiResponse({ status: 200, description: 'Liste des campagnes actives' })
  findActive() {
    return this.campaignsService.getActiveCampaigns();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Récupérer une campagne par ID' })
  @ApiResponse({ status: 200, description: 'Détails de la campagne' })
  @ApiResponse({ status: 404, description: 'Campagne non trouvée' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.campaignsService.findOne(id);
  }

  @Get(':id/challenges')
  @ApiOperation({ summary: 'Récupérer une campagne avec ses défis' })
  @ApiResponse({ status: 200, description: 'Campagne avec défis' })
  @ApiResponse({ status: 404, description: 'Campagne non trouvée' })
  findWithChallenges(@Param('id', ParseIntPipe) id: number) {
    return this.campaignsService.findWithChallenges(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Mettre à jour une campagne' })
  @ApiResponse({ status: 200, description: 'Campagne mise à jour' })
  @ApiResponse({ status: 404, description: 'Campagne non trouvée' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateCampaignDto: UpdateCampaignDto,
  ) {
    return this.campaignsService.update(id, updateCampaignDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Supprimer ou archiver une campagne' })
  @ApiResponse({ status: 200, description: 'Campagne supprimée ou archivée' })
  @ApiResponse({ status: 404, description: 'Campagne non trouvée' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.campaignsService.remove(id);
  }

  @Patch(':id/archive')
  @ApiOperation({ summary: 'Archiver une campagne' })
  @ApiResponse({ status: 200, description: 'Campagne archivée' })
  @ApiResponse({ status: 404, description: 'Campagne non trouvée' })
  archive(@Param('id', ParseIntPipe) id: number) {
    return this.campaignsService.archive(id);
  }

  @Post(':id/presentation-video')
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({
    summary: 'Uploader une vidéo de présentation pour une campagne',
  })
  @ApiResponse({
    status: 201,
    description: 'Vidéo de présentation uploadée avec succès',
  })
  @ApiResponse({ status: 400, description: 'Fichier manquant ou invalide' })
  @ApiResponse({ status: 404, description: 'Campagne non trouvée' })
  uploadPresentationVideo(
    @Param('id', ParseIntPipe) id: number,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.campaignsService.uploadPresentationVideo(id, file);
  }

  @Delete(':id/presentation-video')
  @ApiOperation({
    summary: "Supprimer la vidéo de présentation d'une campagne",
  })
  @ApiResponse({
    status: 200,
    description: 'Vidéo de présentation supprimée avec succès',
  })
  @ApiResponse({
    status: 400,
    description: 'Aucune vidéo de présentation à supprimer',
  })
  @ApiResponse({ status: 404, description: 'Campagne non trouvée' })
  deletePresentationVideo(@Param('id', ParseIntPipe) id: number) {
    return this.campaignsService.deletePresentationVideo(id);
  }
}
