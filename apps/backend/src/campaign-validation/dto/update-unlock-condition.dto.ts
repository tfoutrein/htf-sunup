import { PartialType } from '@nestjs/swagger';
import { CreateUnlockConditionDto } from './create-unlock-condition.dto';

export class UpdateUnlockConditionDto extends PartialType(
  CreateUnlockConditionDto,
) {}
