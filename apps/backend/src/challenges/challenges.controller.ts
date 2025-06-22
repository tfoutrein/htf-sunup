import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
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
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ChallengesService } from './challenges.service';
import { CreateChallengeDto } from './dto/create-challenge.dto';
import { UpdateChallengeDto } from './dto/update-challenge.dto';

@ApiTags('challenges')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('challenges')
export class ChallengesController {
  constructor(private readonly challengesService: ChallengesService) {}

  @Post()
  @ApiOperation({ summary: 'Créer un nouveau défi' })
  @ApiResponse({ status: 201, description: 'Défi créé avec succès' })
  @ApiResponse({ status: 400, description: 'Défi existe déjà pour cette date' })
  create(@Body() createChallengeDto: CreateChallengeDto) {
    return this.challengesService.create(createChallengeDto);
  }

  @Get()
  @ApiOperation({ summary: 'Récupérer tous les défis' })
  @ApiQuery({
    name: 'campaignId',
    required: false,
    description: 'Filtrer par campagne',
  })
  @ApiQuery({
    name: 'date',
    required: false,
    description: 'Filtrer par date (YYYY-MM-DD)',
  })
  @ApiResponse({ status: 200, description: 'Liste des défis' })
  findAll(
    @Query('campaignId') campaignId?: string,
    @Query('date') date?: string,
  ) {
    if (campaignId) {
      return this.challengesService.findByCampaign(parseInt(campaignId));
    }
    if (date) {
      return this.challengesService.findByDate(date);
    }
    return this.challengesService.findAll();
  }

  @Get('today')
  @ApiOperation({ summary: 'Récupérer les défis du jour' })
  @ApiResponse({ status: 200, description: 'Défis du jour' })
  findToday() {
    return this.challengesService.getTodayChallenges();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Récupérer un défi par ID' })
  @ApiResponse({ status: 200, description: 'Détails du défi' })
  @ApiResponse({ status: 404, description: 'Défi non trouvé' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.challengesService.findOne(id);
  }

  @Get(':id/actions')
  @ApiOperation({ summary: 'Récupérer un défi avec ses actions' })
  @ApiResponse({ status: 200, description: 'Défi avec actions' })
  @ApiResponse({ status: 404, description: 'Défi non trouvé' })
  findWithActions(@Param('id', ParseIntPipe) id: number) {
    return this.challengesService.findWithActions(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Mettre à jour un défi' })
  @ApiResponse({ status: 200, description: 'Défi mis à jour' })
  @ApiResponse({ status: 404, description: 'Défi non trouvé' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateChallengeDto: UpdateChallengeDto,
  ) {
    return this.challengesService.update(id, updateChallengeDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Supprimer un défi' })
  @ApiResponse({ status: 200, description: 'Défi supprimé' })
  @ApiResponse({ status: 404, description: 'Défi non trouvé' })
  @ApiResponse({
    status: 400,
    description: 'Impossible de supprimer un défi avec des actions',
  })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.challengesService.remove(id);
  }
}
