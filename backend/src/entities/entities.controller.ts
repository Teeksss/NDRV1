import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { EntitiesService } from './entities.service';
import { CreateEntityDto } from './dto/create-entity.dto';
import { UpdateEntityDto } from './dto/update-entity.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { RequestWithUser } from '../auth/interfaces/request-with-user.interface';
import { LoggerService } from '../logger/logger.service';

@ApiTags('entities')
@Controller('entities')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class EntitiesController {
  constructor(
    private readonly entitiesService: EntitiesService,
    private readonly logger: LoggerService,
  ) {}

  @Post()
  @Roles('admin', 'analyst')
  @ApiOperation({ summary: 'Create a new entity' })
  @ApiResponse({ status: 201, description: 'Entity created successfully' })
  create(@Body() createEntityDto: CreateEntityDto, @Req() req: RequestWithUser) {
    this.logger.log(`Creating entity: ${createEntityDto.name}`, 'EntitiesController');
    return this.entitiesService.create({
      ...createEntityDto,
      createdBy: req.user.id,
    });
  }

  @Get()
  @ApiOperation({ summary: 'Get all entities' })
  @ApiResponse({ status: 200, description: 'Return all entities' })
  findAll(
    @Query('type') type?: string,
    @Query('status') status?: string,
    @Query('search') search?: string,
    @Query('sort') sort?: string,
    @Query('order') order?: string,
    @Query('limit') limit?: number,
    @Query('page') page?: number,
  ) {
    this.logger.log('Finding all entities', 'EntitiesController');
    
    return this.entitiesService.findAll({
      type,
      status,
      search,
      sort,
      order,
      limit,
      page,
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get entity by ID' })
  @ApiResponse({ status: 200, description: 'Return entity by ID' })
  @ApiResponse({ status: 404, description: 'Entity not found' })
  findOne(@Param('id') id: string) {
    this.logger.log(`Finding entity by ID: ${id}`, 'EntitiesController');
    return this.entitiesService.findOne(id);
  }

  @Patch(':id')
  @Roles('admin', 'analyst')
  @ApiOperation({ summary: 'Update entity' })
  @ApiResponse({ status: 200, description: 'Entity updated successfully' })
  @ApiResponse({ status: 404, description: 'Entity not found' })
  update(
    @Param('id') id: string,
    @Body() updateEntityDto: UpdateEntityDto,
    @Req() req: RequestWithUser,
  ) {
    this.logger.log(`Updating entity: ${id}`, 'EntitiesController');
    return this.entitiesService.update(id, {
      ...updateEntityDto,
      updatedBy: req.user.id,
    });
  }

  @Delete(':id')
  @Roles('admin')
  @ApiOperation({ summary: 'Delete entity' })
  @ApiResponse({ status: 200, description: 'Entity deleted successfully' })
  @ApiResponse({ status: 404, description: 'Entity not found' })
  remove(@Param('id') id: string) {
    this.logger.log(`Deleting entity: ${id}`, 'EntitiesController');
    return this.entitiesService.remove(id);
  }

  @Get(':id/alerts')
  @ApiOperation({ summary: 'Get alerts for entity' })
  @ApiResponse({ status: 200, description: 'Return entity alerts' })
  @ApiResponse({ status: 404, description: 'Entity not found' })
  getAlerts(
    @Param('id') id: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('severity') severity?: string,
    @Query('status') status?: string,
    @Query('limit') limit?: number,
    @Query('page') page?: number,
  ) {
    this.logger.log(`Getting alerts for entity: ${id}`, 'EntitiesController');
    return this.entitiesService.getEntityAlerts(id, {
      startDate,
      endDate,
      severity,
      status,
      limit,
      page,
    });
  }

  @Get(':id/events')
  @ApiOperation({ summary: 'Get events for entity' })
  @ApiResponse({ status: 200, description: 'Return entity events' })
  @ApiResponse({ status: 404, description: 'Entity not found' })
  getEvents(
    @Param('id') id: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('type') type?: string,
    @Query('limit') limit?: number,
    @Query('page') page?: number,
  ) {
    this.logger.log(`Getting events for entity: ${id}`, 'EntitiesController');
    return this.entitiesService.getEntityEvents(id, {
      startDate,
      endDate,
      type,
      limit,
      page,
    });
  }

  @Post(':id/scan')
  @Roles('admin', 'analyst')
  @ApiOperation({ summary: 'Start entity scan' })
  @ApiResponse({ status: 200, description: 'Scan started successfully' })
  @ApiResponse({ status: 404, description: 'Entity not found' })
  startScan(@Param('id') id: string, @Req() req: RequestWithUser) {
    this.logger.log(`Starting scan for entity: ${id}`, 'EntitiesController');
    return this.entitiesService.startEntityScan(id, req.user.id);
  }

  @Get(':id/scan-history')
  @ApiOperation({ summary: 'Get entity scan history' })
  @ApiResponse({ status: 200, description: 'Return entity scan history' })
  @ApiResponse({ status: 404, description: 'Entity not found' })
  getScanHistory(
    @Param('id') id: string,
    @Query('limit') limit?: number,
    @Query('page') page?: number,
  ) {
    this.logger.log(`Getting scan history for entity: ${id}`, 'EntitiesController');
    return this.entitiesService.getEntityScanHistory(id, { limit, page });
  }

  @Patch(':id/tag')
  @Roles('admin', 'analyst')
  @ApiOperation({ summary: 'Add tag to entity' })
  @ApiResponse({ status: 200, description: 'Tag added successfully' })
  @ApiResponse({ status: 404, description: 'Entity not found' })
  addTag(
    @Param('id') id: string,
    @Body() body: { tag: string },
    @Req() req: RequestWithUser,
  ) {
    this.logger.log(`Adding tag to entity: ${id}`, 'EntitiesController');
    return this.entitiesService.addTagToEntity(id, body.tag, req.user.id);
  }

  @Delete(':id/tag/:tag')
  @Roles('admin', 'analyst')
  @ApiOperation({ summary: 'Remove tag from entity' })
  @ApiResponse({ status: 200, description: 'Tag removed successfully' })
  @ApiResponse({ status: 404, description: 'Entity not found' })
  removeTag(
    @Param('id') id: string,
    @Param('tag') tag: string,
    @Req() req: RequestWithUser,
  ) {
    this.logger.log(`Removing tag from entity: ${id}`, 'EntitiesController');
    return this.entitiesService.removeTagFromEntity(id, tag, req.user.id);
  }

  @Get('types/distribution')
  @ApiOperation({ summary: 'Get entity type distribution' })
  @ApiResponse({ status: 200, description: 'Return entity type distribution' })
  getTypeDistribution() {
    this.logger.log('Getting entity type distribution', 'EntitiesController');
    return this.entitiesService.getDistributionByType();
  }

  @Get('status/distribution')
  @ApiOperation({ summary: 'Get entity status distribution' })
  @ApiResponse({ status: 200, description: 'Return entity status distribution' })
  getStatusDistribution() {
    this.logger.log('Getting entity status distribution', 'EntitiesController');
    return this.entitiesService.getDistributionByStatus();
  }
}