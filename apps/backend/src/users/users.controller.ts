import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Put,
  UseGuards,
  Query,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserDto } from './dto/user.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('users')
@Controller('users')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new user' })
  @ApiResponse({
    status: 201,
    description: 'User created successfully',
    type: UserDto,
  })
  create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all users' })
  @ApiResponse({ status: 200, description: 'List of users', type: [UserDto] })
  findAll() {
    return this.usersService.findAll();
  }

  @Get('managers')
  @ApiOperation({ summary: 'Get all managers' })
  @ApiResponse({
    status: 200,
    description: 'List of managers',
    type: [UserDto],
  })
  getAllManagers() {
    return this.usersService.getAllManagers();
  }

  @Get('all-members')
  @ApiOperation({ summary: 'Get all FBO members with their manager info' })
  @ApiResponse({ status: 200, description: 'List of all FBO members' })
  getAllMembers() {
    return this.usersService.getAllMembers();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a user by ID' })
  @ApiResponse({ status: 200, description: 'User found', type: UserDto })
  @ApiResponse({ status: 404, description: 'User not found' })
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(+id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a user' })
  @ApiResponse({
    status: 200,
    description: 'User updated successfully',
    type: UserDto,
  })
  @ApiResponse({ status: 404, description: 'User not found' })
  update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    return this.usersService.update(+id, updateUserDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a user' })
  @ApiResponse({ status: 200, description: 'User deleted successfully' })
  @ApiResponse({ status: 404, description: 'User not found' })
  remove(@Param('id') id: string) {
    return this.usersService.remove(+id);
  }

  // Team management routes
  @Get('role/:role')
  @ApiOperation({ summary: 'Get users by role' })
  @ApiResponse({
    status: 200,
    description: 'List of users by role',
    type: [UserDto],
  })
  getUsersByRole(@Param('role') role: string) {
    return this.usersService.getUsersByRole(role);
  }

  @Get('team/:managerId')
  @ApiOperation({ summary: 'Get team members for a manager' })
  @ApiResponse({
    status: 200,
    description: 'List of team members',
    type: [UserDto],
  })
  getTeamMembers(@Param('managerId') managerId: string) {
    return this.usersService.getTeamMembers(+managerId);
  }

  @Put(':id/assign-manager')
  @ApiOperation({ summary: 'Assign a manager to a user' })
  @ApiResponse({
    status: 200,
    description: 'Manager assigned successfully',
    type: UserDto,
  })
  @ApiResponse({ status: 404, description: 'User not found' })
  assignManager(@Param('id') id: string, @Body() body: { managerId: number }) {
    return this.usersService.assignManager(+id, body.managerId);
  }
}
