import { Module } from '@nestjs/common';
import { CampaignValidationController } from './campaign-validation.controller';
import { CampaignValidationService } from './campaign-validation.service';
import { DatabaseModule } from '../db/database.module';

@Module({
  imports: [DatabaseModule],
  controllers: [CampaignValidationController],
  providers: [CampaignValidationService],
  exports: [CampaignValidationService],
})
export class CampaignValidationModule {}
