import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Req,
  ParseIntPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { AppVersionsService } from './app-versions.service';
import { CreateAppVersionDto } from './dto/create-app-version.dto';
import { UpdateAppVersionDto } from './dto/update-app-version.dto';
import { MarkVersionSeenDto } from './dto/mark-version-seen.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('app-versions')
@Controller('app-versions')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class AppVersionsController {
  constructor(private readonly appVersionsService: AppVersionsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new app version (dev only)' })
  @ApiResponse({ status: 201, description: 'Version created successfully' })
  create(@Body() createAppVersionDto: CreateAppVersionDto) {
    return this.appVersionsService.create(createAppVersionDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all app versions' })
  @ApiResponse({ status: 200, description: 'List of all versions' })
  findAll() {
    return this.appVersionsService.findAll();
  }

  @Get('active')
  @ApiOperation({ summary: 'Get all active app versions' })
  @ApiResponse({ status: 200, description: 'List of active versions' })
  findActive() {
    return this.appVersionsService.findActive();
  }

  @Get('latest')
  @ApiOperation({ summary: 'Get the latest active version' })
  @ApiResponse({ status: 200, description: 'Latest version' })
  findLatest() {
    return this.appVersionsService.findLatest();
  }

  @Get('unseen')
  @ApiOperation({ summary: 'Get unseen versions for current user' })
  @ApiResponse({ status: 200, description: 'List of unseen versions' })
  getUnseenVersions(@Req() req: any) {
    return this.appVersionsService.getUnseenVersionsForUser(req.user.userId);
  }

  @Get('unseen/latest')
  @ApiOperation({ summary: 'Get the latest unseen version for current user' })
  @ApiResponse({
    status: 200,
    description: 'Latest unseen version or null if all seen',
  })
  getLatestUnseenVersion(@Req() req: any) {
    return this.appVersionsService.getLatestUnseenVersionForUser(
      req.user.userId,
    );
  }

  @Post('mark-seen')
  @ApiOperation({ summary: 'Mark a version as seen by the current user' })
  @ApiResponse({ status: 200, description: 'Version marked as seen' })
  markVersionSeen(
    @Req() req: any,
    @Body() markVersionSeenDto: MarkVersionSeenDto,
  ) {
    return this.appVersionsService.markVersionAsSeen(
      req.user.userId,
      markVersionSeenDto.versionId,
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a specific app version' })
  @ApiResponse({ status: 200, description: 'Version details' })
  @ApiResponse({ status: 404, description: 'Version not found' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.appVersionsService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update an app version (dev only)' })
  @ApiResponse({ status: 200, description: 'Version updated successfully' })
  @ApiResponse({ status: 404, description: 'Version not found' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateAppVersionDto: UpdateAppVersionDto,
  ) {
    return this.appVersionsService.update(id, updateAppVersionDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete an app version (dev only)' })
  @ApiResponse({ status: 200, description: 'Version deleted successfully' })
  @ApiResponse({ status: 404, description: 'Version not found' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.appVersionsService.remove(id);
  }
}
