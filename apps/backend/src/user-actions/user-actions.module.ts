import { Module } from '@nestjs/common';
import { UserActionsController } from './user-actions.controller';
import { UserActionsService } from './user-actions.service';
import { DatabaseModule } from '../db/database.module';
import { StorageModule } from '../storage/storage.module';

@Module({
  imports: [DatabaseModule, StorageModule],
  controllers: [UserActionsController],
  providers: [UserActionsService],
  exports: [UserActionsService],
})
export class UserActionsModule {}
