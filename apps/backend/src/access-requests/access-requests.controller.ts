import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Request,
  Patch,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AccessRequestsService } from './access-requests.service';
import { UsersService } from '../users/users.service';
import { AuthService } from '../auth/auth.service';

@Controller('access-requests')
export class AccessRequestsController {
  constructor(
    private readonly accessRequestsService: AccessRequestsService,
    private readonly usersService: UsersService,
    private readonly authService: AuthService,
  ) {}

  @Post()
  async create(
    @Body()
    createAccessRequestDto: {
      name: string;
      email: string;
      requestedRole?: string;
      requestedManagerId?: number;
      message?: string;
    },
  ) {
    return await this.accessRequestsService.create(createAccessRequestDto);
  }

  @UseGuards(JwtAuthGuard)
  @Get()
  async findAll(@Request() req) {
    const user = req.user;

    if (user.role === 'manager') {
      // Les managers voient les demandes pour eux et leur équipe
      return await this.accessRequestsService.findByManagerAndTeam(user.id);
    } else {
      return {
        direct: [],
        team: [],
      };
    }
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id')
  async findOne(@Param('id') id: string) {
    return await this.accessRequestsService.findWithManager(+id);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id/approve')
  async approve(
    @Param('id') id: string,
    @Request() req,
    @Body() body: { reviewComment?: string },
  ) {
    const user = req.user;

    if (user.role !== 'manager') {
      throw new Error('Accès non autorisé');
    }

    const accessRequest = await this.accessRequestsService.findById(+id);

    if (
      user.role === 'manager' &&
      accessRequest.requestedManagerId !== user.id
    ) {
      throw new Error(
        'Vous ne pouvez approuver que les demandes qui vous concernent',
      );
    }

    // Générer un mot de passe temporaire aléatoire
    const temporaryPassword = this.generateTemporaryPassword();

    const approvedRequest = await this.accessRequestsService.approve(
      +id,
      user.id,
      temporaryPassword,
      body.reviewComment,
    );

    await this.usersService.create({
      name: approvedRequest.name,
      email: approvedRequest.email,
      password: temporaryPassword,
      role: approvedRequest.requestedRole!,
      managerId: approvedRequest.requestedManagerId,
    });

    return approvedRequest;
  }

  private generateTemporaryPassword(): string {
    // Générer un mot de passe temporaire qui respecte les nouvelles règles
    const lowercase = 'abcdefghijklmnopqrstuvwxyz';
    const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const numbers = '0123456789';
    const specialChars = '!@#$%^&*()_+-=[]{}|;:,.<>?';

    let password = '';

    // Assurer qu'il y a au moins un caractère de chaque type requis
    password += lowercase.charAt(Math.floor(Math.random() * lowercase.length));
    password += uppercase.charAt(Math.floor(Math.random() * uppercase.length));
    password += numbers.charAt(Math.floor(Math.random() * numbers.length));
    password += specialChars.charAt(
      Math.floor(Math.random() * specialChars.length),
    );

    // Compléter avec des caractères aléatoires pour atteindre 10 caractères
    const allChars = lowercase + uppercase + numbers + specialChars;
    for (let i = 4; i < 10; i++) {
      password += allChars.charAt(Math.floor(Math.random() * allChars.length));
    }

    // Mélanger les caractères pour éviter un pattern prévisible
    return password
      .split('')
      .sort(() => Math.random() - 0.5)
      .join('');
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id/reject')
  async reject(
    @Param('id') id: string,
    @Request() req,
    @Body() body: { reviewComment?: string },
  ) {
    const user = req.user;

    if (user.role !== 'manager') {
      throw new Error('Accès non autorisé');
    }

    const accessRequest = await this.accessRequestsService.findById(+id);

    if (
      user.role === 'manager' &&
      accessRequest.requestedManagerId !== user.id
    ) {
      throw new Error(
        'Vous ne pouvez rejeter que les demandes qui vous concernent',
      );
    }

    return await this.accessRequestsService.reject(
      +id,
      user.id,
      body.reviewComment,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id/reassign')
  async reassign(
    @Param('id') id: string,
    @Request() req,
    @Body() body: { newManagerId: number; reviewComment?: string },
  ) {
    const user = req.user;

    if (user.role !== 'manager') {
      throw new Error('Seuls les managers peuvent réassigner des demandes');
    }

    // Vérifier si l'utilisateur est un manager de niveau supérieur
    // Pour l'instant, on permet à tous les managers de réassigner
    // TODO: Implémenter une logique hiérarchique plus complexe si nécessaire

    const parsedId = parseInt(id);
    if (isNaN(parsedId)) {
      throw new Error(`ID invalide: ${id}`);
    }

    return await this.accessRequestsService.reassign(
      parsedId,
      body.newManagerId,
      user.id,
      body.reviewComment,
    );
  }

  @Get('managers/list')
  async getManagers() {
    const managers = await this.usersService.getUsersByRole('manager');

    // Trier par nom
    return managers.sort((a, b) => {
      return a.name.localeCompare(b.name);
    });
  }
}
