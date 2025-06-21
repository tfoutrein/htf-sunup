import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { UserDto } from './dto/user.dto';

@ApiTags('public-users')
@Controller('api/public/users')
export class PublicUsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('managers')
  @ApiOperation({
    summary: 'Get all managers (public endpoint for registration)',
  })
  @ApiResponse({
    status: 200,
    description: 'List of managers',
    type: [UserDto],
  })
  getAllManagers() {
    return this.usersService.getAllManagers();
  }
}
