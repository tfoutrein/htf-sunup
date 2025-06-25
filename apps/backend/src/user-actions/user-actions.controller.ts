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
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UserActionsService } from './user-actions.service';
import { CreateUserActionDto } from './dto/create-user-action.dto';
import { UpdateUserActionDto } from './dto/update-user-action.dto';

@ApiTags('user-actions')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('user-actions')
export class UserActionsController {
  constructor(private readonly userActionsService: UserActionsService) {}

  @Post()
  @ApiOperation({ summary: 'Créer une nouvelle action utilisateur' })
  @ApiResponse({ status: 201, description: 'Action utilisateur créée' })
  create(@Body() createUserActionDto: CreateUserActionDto, @Request() req) {
    return this.userActionsService.create({
      ...createUserActionDto,
      userId: req.user.id,
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Récupérer une action utilisateur par ID' })
  @ApiResponse({ status: 200, description: 'Action utilisateur trouvée' })
  @ApiResponse({ status: 404, description: 'Action utilisateur non trouvée' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.userActionsService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Mettre à jour une action utilisateur' })
  @ApiResponse({ status: 200, description: 'Action utilisateur mise à jour' })
  @ApiResponse({ status: 404, description: 'Action utilisateur non trouvée' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateUserActionDto: UpdateUserActionDto,
  ) {
    return this.userActionsService.update(id, updateUserActionDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Supprimer une action utilisateur' })
  @ApiResponse({ status: 200, description: 'Action utilisateur supprimée' })
  @ApiResponse({ status: 404, description: 'Action utilisateur non trouvée' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.userActionsService.remove(id);
  }

  @Post(':id/proof')
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({ summary: 'Uploader une preuve pour une action utilisateur' })
  @ApiResponse({ status: 201, description: 'Preuve uploadée' })
  uploadProof(
    @Param('id', ParseIntPipe) id: number,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.userActionsService.uploadProof(id, file);
  }
}
