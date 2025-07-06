import { Module } from '@nestjs/common';
import { DailyBonusController } from './daily-bonus.controller';
import { DailyBonusService } from './daily-bonus.service';
import { DatabaseModule } from '../db/database.module';
import { StorageModule } from '../storage/storage.module';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [DatabaseModule, StorageModule, UsersModule],
  controllers: [DailyBonusController],
  providers: [DailyBonusService],
  exports: [DailyBonusService],
})
export class DailyBonusModule {}
