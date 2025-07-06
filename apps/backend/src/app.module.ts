import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
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

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
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
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
