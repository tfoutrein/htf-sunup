import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { CacheModule } from '@nestjs/cache-manager';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './users/users.module';
import { DatabaseModule } from './db/database.module';
import { AuthModule } from './auth/auth.module';
import { ActionsModule } from './actions/actions.module';
import { UserActionsModule } from './user-actions/user-actions.module';
import { CampaignsModule } from './campaigns/campaigns.module';
import { ChallengesModule } from './challenges/challenges.module';
import { StorageModule } from './storage/storage.module';

import { DailyBonusModule } from './daily-bonus/daily-bonus.module';
import { ProofsModule } from './proofs/proofs.module';
import { AppVersionsModule } from './app-versions/app-versions.module';
import { CampaignValidationModule } from './campaign-validation/campaign-validation.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    CacheModule.register({
      isGlobal: true,
      ttl: 300, // 5 minutes par défaut
      max: 100, // 100 entrées max en cache
    }),
    DatabaseModule,
    UsersModule,
    AuthModule,
    ActionsModule,
    UserActionsModule,
    CampaignsModule,
    ChallengesModule,
    StorageModule,
    DailyBonusModule,
    ProofsModule,
    AppVersionsModule,
    CampaignValidationModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
