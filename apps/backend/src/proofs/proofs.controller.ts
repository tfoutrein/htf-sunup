import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  UploadedFile,
  UseInterceptors,
  UseGuards,
  ParseIntPipe,
  Request,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { ProofsService } from './proofs.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('proofs')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('proofs')
export class ProofsController {
  constructor(private readonly proofsService: ProofsService) {}

  // Récupérer toutes les preuves d'une action utilisateur
  @Get('user-action/:userActionId')
  @ApiOperation({
    summary: "Récupérer toutes les preuves d'une action utilisateur",
  })
  @ApiResponse({ status: 200, description: 'Preuves récupérées avec succès' })
  async getProofsByUserAction(
    @Param('userActionId', ParseIntPipe) userActionId: number,
  ) {
    return this.proofsService.getProofsByUserAction(userActionId);
  }

  // Récupérer toutes les preuves d'un bonus quotidien
  @Get('daily-bonus/:dailyBonusId')
  @ApiOperation({
    summary: "Récupérer toutes les preuves d'un bonus quotidien",
  })
  @ApiResponse({ status: 200, description: 'Preuves récupérées avec succès' })
  async getProofsByDailyBonus(
    @Param('dailyBonusId', ParseIntPipe) dailyBonusId: number,
  ) {
    return this.proofsService.getProofsByDailyBonus(dailyBonusId);
  }

  // Ajouter une preuve à une action utilisateur
  @Post('user-action/:userActionId')
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({
    summary: 'Ajouter une preuve à une action utilisateur',
  })
  @ApiResponse({ status: 201, description: 'Preuve ajoutée avec succès' })
  @ApiResponse({
    status: 400,
    description: 'Fichier invalide ou limite atteinte (max 5)',
  })
  async addProofToUserAction(
    @Param('userActionId', ParseIntPipe) userActionId: number,
    @UploadedFile() file: Express.Multer.File,
    @Request() req: any,
  ) {
    if (!file) {
      throw new BadRequestException('Aucun fichier fourni');
    }

    // TODO: Vérifier que l'utilisateur a le droit de modifier cette action
    // Pour le moment, on fait confiance à l'authentification JWT

    return this.proofsService.addProofToUserAction(userActionId, file);
  }

  // Ajouter une preuve à un bonus quotidien
  @Post('daily-bonus/:dailyBonusId')
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({
    summary: 'Ajouter une preuve à un bonus quotidien',
  })
  @ApiResponse({ status: 201, description: 'Preuve ajoutée avec succès' })
  @ApiResponse({
    status: 400,
    description: 'Fichier invalide ou limite atteinte (max 5)',
  })
  async addProofToDailyBonus(
    @Param('dailyBonusId', ParseIntPipe) dailyBonusId: number,
    @UploadedFile() file: Express.Multer.File,
    @Request() req: any,
  ) {
    if (!file) {
      throw new BadRequestException('Aucun fichier fourni');
    }

    // TODO: Vérifier que l'utilisateur a le droit de modifier ce bonus
    // Pour le moment, on fait confiance à l'authentification JWT

    return this.proofsService.addProofToDailyBonus(dailyBonusId, file);
  }

  // Récupérer une URL signée pour une preuve spécifique
  @Get(':proofId/signed-url')
  @ApiOperation({
    summary: 'Récupérer une URL signée pour accéder à une preuve',
  })
  @ApiResponse({ status: 200, description: 'URL signée générée avec succès' })
  @ApiResponse({ status: 404, description: 'Preuve non trouvée' })
  async getSignedUrl(
    @Param('proofId', ParseIntPipe) proofId: number,
    @Request() req: any,
  ) {
    const userId = req.user.id;
    console.log(
      `🔐 [ProofsController] GetSignedUrl requested for proof ${proofId} by user ${userId}`,
    );
    console.log(`👤 [ProofsController] User data:`, {
      id: req.user.id,
      email: req.user.email,
      role: req.user.role,
    });

    // Vérifier que l'utilisateur a le droit de voir cette preuve
    const hasAccess = await this.proofsService.verifyProofOwnership(
      proofId,
      userId,
    );
    console.log(
      `🔍 [ProofsController] Access check result for user ${userId} on proof ${proofId}: ${hasAccess}`,
    );

    if (!hasAccess) {
      console.log(
        `❌ [ProofsController] Access denied for user ${userId} on proof ${proofId}`,
      );
      throw new BadRequestException("Vous n'avez pas accès à cette preuve");
    }

    console.log(
      `✅ [ProofsController] Access granted, generating signed URL for proof ${proofId}`,
    );
    return this.proofsService.getSignedUrl(proofId);
  }

  // Supprimer une preuve
  @Delete(':proofId')
  @ApiOperation({
    summary: 'Supprimer une preuve',
  })
  @ApiResponse({ status: 200, description: 'Preuve supprimée avec succès' })
  @ApiResponse({ status: 404, description: 'Preuve non trouvée' })
  async deleteProof(
    @Param('proofId', ParseIntPipe) proofId: number,
    @Request() req: any,
  ) {
    // Vérifier que l'utilisateur a le droit de supprimer cette preuve
    const userId = req.user.id;
    const hasAccess = await this.proofsService.verifyProofOwnership(
      proofId,
      userId,
    );

    if (!hasAccess) {
      throw new BadRequestException(
        "Vous n'avez pas le droit de supprimer cette preuve",
      );
    }

    await this.proofsService.deleteProof(proofId);
    return { message: 'Preuve supprimée avec succès' };
  }

  // Compter les preuves d'une action utilisateur
  @Get('user-action/:userActionId/count')
  @ApiOperation({
    summary: "Compter les preuves d'une action utilisateur",
  })
  @ApiResponse({ status: 200, description: 'Nombre de preuves récupéré' })
  async countProofsByUserAction(
    @Param('userActionId', ParseIntPipe) userActionId: number,
  ) {
    const count =
      await this.proofsService.countProofsByUserAction(userActionId);
    return { count };
  }

  // Compter les preuves d'un bonus quotidien
  @Get('daily-bonus/:dailyBonusId/count')
  @ApiOperation({
    summary: "Compter les preuves d'un bonus quotidien",
  })
  @ApiResponse({ status: 200, description: 'Nombre de preuves récupéré' })
  async countProofsByDailyBonus(
    @Param('dailyBonusId', ParseIntPipe) dailyBonusId: number,
  ) {
    const count =
      await this.proofsService.countProofsByDailyBonus(dailyBonusId);
    return { count };
  }
}
