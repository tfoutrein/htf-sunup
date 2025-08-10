import { Module } from '@nestjs/common';
import { AppVersionsService } from './app-versions.service';
import { AppVersionsController } from './app-versions.controller';
import { DatabaseModule } from '../db/database.module';

@Module({
  imports: [DatabaseModule],
  controllers: [AppVersionsController],
  providers: [AppVersionsService],
  exports: [AppVersionsService],
})
export class AppVersionsModule {}
