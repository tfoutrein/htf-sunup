import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { LocalStrategy } from './strategies/local.strategy';
import { JwtStrategy } from './strategies/jwt.strategy';
import { FacebookStrategy } from './strategies/facebook.strategy';
import { UsersModule } from '../users/users.module';

// Créer la liste des providers conditionnellement
const createProviders = () => {
  const baseProviders: any[] = [AuthService, LocalStrategy, JwtStrategy];

  // N'ajouter FacebookStrategy que si Facebook est activé
  const isFacebookEnabled = process.env.FACEBOOK_AUTH_ENABLED === 'true';
  if (isFacebookEnabled) {
    baseProviders.push(FacebookStrategy);
  }

  return baseProviders;
};

@Module({
  imports: [
    UsersModule,
    PassportModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'your-secret-key',
      signOptions: { expiresIn: '7d' },
    }),
  ],
  providers: createProviders(),
  controllers: [AuthController],
  exports: [AuthService],
})
export class AuthModule {}
