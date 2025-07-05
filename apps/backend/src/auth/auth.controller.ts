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
import { ApiTags, ApiOperation, ApiBody } from '@nestjs/swagger';

export class LoginDto {
  email: string;
  password: string;
}

export class RegisterDto {
  name: string;
  email: string;
  password: string;
  role: string;
  managerId?: number;
}

export class FacebookVerifyDto {
  facebookId: string;
  accessToken: string;
  email: string;
  name: string;
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
    return this.authService.register(registerDto);
  }

  @ApiOperation({ summary: 'Login with Facebook' })
  @UseGuards(FacebookAuthGuard)
  @Get('facebook')
  async facebookLogin(@Request() req) {
    // This will trigger the Facebook OAuth flow
  }

  @ApiOperation({ summary: 'Facebook OAuth callback' })
  @UseGuards(FacebookAuthGuard)
  @Get('facebook/callback')
  async facebookCallback(@Request() req, @Res() res: Response) {
    // User is authenticated, generate JWT token
    const result = await this.authService.login(req.user);

    // Redirect to frontend with token
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3001';
    const redirectUrl = `${frontendUrl}/auth/callback?token=${result.access_token}`;

    res.redirect(redirectUrl);
  }

  @ApiOperation({ summary: 'Verify Facebook authentication' })
  @ApiBody({ type: FacebookVerifyDto })
  @Post('facebook/verify')
  async facebookVerify(@Body() facebookData: FacebookVerifyDto) {
    const mappedData = {
      facebookId: facebookData.facebookId,
      email: facebookData.email,
      name: facebookData.name,
      profilePicture: facebookData.profilePicture,
      facebookAccessToken: facebookData.accessToken,
    };
    const user = await this.authService.findOrCreateFacebookUser(mappedData);
    return this.authService.login(user);
  }
}
