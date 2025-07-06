import { Module } from '@nestjs/common';
import { ProofsService } from './proofs.service';
import { ProofsController } from './proofs.controller';
import { DatabaseModule } from '../db/database.module';
import { StorageModule } from '../storage/storage.module';

@Module({
  imports: [DatabaseModule, StorageModule],
  controllers: [ProofsController],
  providers: [ProofsService],
  exports: [ProofsService],
})
export class ProofsModule {}
