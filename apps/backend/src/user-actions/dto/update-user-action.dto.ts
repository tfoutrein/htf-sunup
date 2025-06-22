import { PartialType } from '@nestjs/swagger';
import { CreateUserActionDto } from './create-user-action.dto';

export class UpdateUserActionDto extends PartialType(CreateUserActionDto) {}
