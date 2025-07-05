import {
  Controller,
  Post,
  UseGuards,
  Request,
  Body,
  Get,
  Res,
} from '@nestjs/common';
import { Response } from 'express';
import { AuthService } from './auth.service';
import { LocalAuthGuard } from './guards/local-auth.guard';
import { FacebookAuthGuard } from './guards/facebook-auth.guard';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { ApiTags, ApiOperation, ApiBody, ApiBearerAuth } from '@nestjs/swagger';
import { IsString, IsEmail, IsOptional, IsIn, IsNumber } from 'class-validator';
import { IsStrongPassword } from '../utils/password-validator';

export class LoginDto {
  email: string;
  password: string;
}

export class RegisterDto {
  @IsString()
  name: string;

  @IsEmail()
  email: string;

  @IsString()
  @IsStrongPassword()
  password: string;

  @IsString()
  @IsIn(['manager', 'fbo'])
  role: string;

  @IsOptional()
  @IsNumber()
  managerId?: number;
}

export class FacebookVerifyDto {
  facebookId: string;
  accessToken: string;
  email: string;
  name: string;
  profilePicture?: string;
}

export class AssignManagerDto {
  userId: number;
  managerId: number;
}

export class LinkFacebookDto {
  facebookId: string;
  accessToken: string;
  profilePicture?: string;
}

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @ApiOperation({ summary: 'Login user' })
  @ApiBody({ type: LoginDto })
  @UseGuards(LocalAuthGuard)
  @Post('login')
  async login(@Request() req) {
    return this.authService.login(req.user);
  }

  @ApiOperation({ summary: 'Register user' })
  @ApiBody({ type: RegisterDto })
  @Post('register')
  async register(@Body() registerDto: RegisterDto) {
    const user = await this.authService.createUser(registerDto);
    return {
      message: 'Compte créé avec succès',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    };
  }

  @ApiOperation({ summary: 'Login with Facebook' })
  @UseGuards(FacebookAuthGuard)
  @Get('facebook')
  async facebookLogin(@Request() req) {
    // Vérifier si l'authentification Facebook est activée
    if (process.env.FACEBOOK_AUTH_ENABLED !== 'true') {
      throw new Error('Facebook authentication is disabled');
    }
    // This will trigger the Facebook OAuth flow
  }

  @ApiOperation({ summary: 'Facebook OAuth callback' })
  @UseGuards(FacebookAuthGuard)
  @Get('facebook/callback')
  async facebookCallback(@Request() req, @Res() res: Response) {
    // Vérifier si l'authentification Facebook est activée
    if (process.env.FACEBOOK_AUTH_ENABLED !== 'true') {
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3001';
      res.redirect(`${frontendUrl}/login?error=facebook-disabled`);
      return;
    }

    // User is authenticated, generate JWT token
    const result = await this.authService.login(req.user);

    // Vérifier si l'utilisateur a besoin d'un manager
    const needsManager = await this.authService.checkUserNeedsManager(req.user);

    // Redirect to frontend with token and needsManager flag
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3001';
    let redirectUrl = `${frontendUrl}/auth/callback?token=${result.access_token}`;

    if (needsManager) {
      redirectUrl += '&needsManager=true';
    }

    res.redirect(redirectUrl);
  }

  @ApiOperation({ summary: 'Verify Facebook authentication' })
  @ApiBody({ type: FacebookVerifyDto })
  @Post('facebook/verify')
  async facebookVerify(@Body() facebookData: FacebookVerifyDto) {
    // Vérifier si l'authentification Facebook est activée
    if (process.env.FACEBOOK_AUTH_ENABLED !== 'true') {
      throw new Error('Facebook authentication is disabled');
    }

    const mappedData = {
      facebookId: facebookData.facebookId,
      email: facebookData.email,
      name: facebookData.name,
      profilePicture: facebookData.profilePicture,
      facebookAccessToken: facebookData.accessToken,
    };
    const user = await this.authService.findOrCreateFacebookUser(mappedData);
    const result = await this.authService.login(user);

    // Ajouter l'information sur si l'utilisateur a besoin d'un manager
    const needsManager = await this.authService.checkUserNeedsManager(user);

    return {
      ...result,
      needsManager,
    };
  }

  @ApiOperation({ summary: 'Assign manager to user' })
  @ApiBody({ type: AssignManagerDto })
  @Post('assign-manager')
  async assignManager(@Body() assignManagerData: AssignManagerDto) {
    const user = await this.authService.assignManagerToUser(
      assignManagerData.userId,
      assignManagerData.managerId,
    );
    return this.authService.login(user);
  }

  @ApiOperation({ summary: 'Link Facebook account to existing user' })
  @ApiBody({ type: LinkFacebookDto })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post('link-facebook')
  async linkFacebook(
    @Request() req,
    @Body() linkFacebookData: LinkFacebookDto,
  ) {
    // Vérifier si l'authentification Facebook est activée
    if (process.env.FACEBOOK_AUTH_ENABLED !== 'true') {
      throw new Error('Facebook authentication is disabled');
    }

    // Récupérer l'utilisateur depuis le token JWT
    const userId = req.user.id;

    const user = await this.authService.linkFacebookToExistingUser(userId, {
      facebookId: linkFacebookData.facebookId,
      facebookAccessToken: linkFacebookData.accessToken,
      profilePicture: linkFacebookData.profilePicture,
    });

    return this.authService.login(user);
  }

  @ApiOperation({ summary: 'Get current user information' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get('me')
  async getCurrentUser(@Request() req) {
    // L'utilisateur est déjà disponible grâce au JwtAuthGuard
    // mais nous récupérons les données complètes depuis la base de données
    const userId = req.user.id;
    const user = await this.authService.findUserById(userId);

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      managerId: user.managerId,
      profilePicture: user.profilePicture,
      authProvider: user.authProvider,
      facebookId: user.facebookId,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }
}
