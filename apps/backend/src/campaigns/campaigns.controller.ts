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
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
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
  @ApiOperation({ summary: 'Supprimer une campagne' })
  @ApiResponse({ status: 200, description: 'Campagne supprimée' })
  @ApiResponse({ status: 404, description: 'Campagne non trouvée' })
  @ApiResponse({
    status: 400,
    description: 'Impossible de supprimer une campagne avec des défis',
  })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.campaignsService.remove(id);
  }
}
