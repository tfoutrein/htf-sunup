import { Module } from '@nestjs/common';
import { AccessRequestsService } from './access-requests.service';
import { AccessRequestsController } from './access-requests.controller';
import { DatabaseModule } from '../db/database.module';
import { UsersModule } from '../users/users.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [DatabaseModule, UsersModule, AuthModule],
  controllers: [AccessRequestsController],
  providers: [AccessRequestsService],
  exports: [AccessRequestsService],
})
export class AccessRequestsModule {}