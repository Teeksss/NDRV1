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
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { EntityService } from './entity.service';
import { CreateEntityDto } from './dto/create-entity.dto';
import { UpdateEntityDto } from './dto/update-entity.dto';
import { CreateRelationshipDto } from './dto/create-relationship.dto';
import { UpdateRelationshipDto } from './dto/update-relationship.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('entities')
@Controller('entities')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class EntityController {
  constructor(private readonly entityService: EntityService) {}

  @Post()
  @Roles('admin', 'analyst')
  @ApiOperation({ summary: 'Create a new entity' })
  @ApiResponse({ status: 201, description: 'Entity created successfully' })
  create(@Body() createEntityDto: CreateEntityDto) {
    return this.entityService.create(createEntityDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all entities' })
  @ApiResponse({ status: 200, description: 'Return all entities' })
  findAll(
    @Query('type') type?: string,
    @Query('status') status?: string,
    @Query('ipAddress') ipAddress?: string,
    @Query('location') location?: string,
    @Query('tags') tags?: string,
    @Query('sort') sort?: string,
    @Query('order') order?: 'asc' | 'desc',
    @Query('limit') limit?: number,
    @Query('page') page?: number,
  ) {
    return this.entityService.findAll({
      type,
      status,
      ipAddress,
      location,
      tags: tags ? tags.split(',') : undefined,
      sort,
      order,
      limit,
      page,
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get an entity by ID' })
  @ApiResponse({ status: 200, description: 'Return the entity' })
  @ApiResponse({ status: 404, description: 'Entity not found' })
  findOne(@Param('id') id: string) {
    return this.entityService.findOne(id);
  }

  @Patch(':id')
  @Roles('admin', 'analyst')
  @ApiOperation({ summary: 'Update an entity' })
  @ApiResponse({ status: 200, description: 'Entity updated successfully' })
  @ApiResponse({ status: 404, description: 'Entity not found' })
  update(@Param('id') id: string, @Body() updateEntityDto: UpdateEntityDto) {
    return this.entityService.update(id, updateEntityDto);
  }

  @Delete(':id')
  @Roles('admin')
  @ApiOperation({ summary: 'Delete an entity' })
  @ApiResponse({ status: 200, description: 'Entity deleted successfully' })
  @ApiResponse({ status: 404, description: 'Entity not found' })
  remove(@Param('id') id: string) {
    return this.entityService.remove(id);
  }

  @Get(':id/relationships')
  @ApiOperation({ summary: 'Get relationships for an entity' })
  @ApiResponse({ status: 200, description: 'Return entity relationships' })
  @ApiResponse({ status: 404, description: 'Entity not found' })
  getRelationships(@Param('id') id: string) {
    return this.entityService.getRelationships(id);
  }

  @Post('relationships')
  @Roles('admin', 'analyst')
  @ApiOperation({ summary: 'Create a new entity relationship' })
  @ApiResponse({ status: 201, description: 'Relationship created successfully' })
  createRelationship(@Body() createRelationshipDto: CreateRelationshipDto) {
    return this.entityService.createRelationship(createRelationshipDto);
  }

  @Patch('relationships/:id')
  @Roles('admin', 'analyst')
  @ApiOperation({ summary: 'Update an entity relationship' })
  @ApiResponse({ status: 200, description: 'Relationship updated successfully' })
  @ApiResponse({ status: 404, description: 'Relationship not found' })
  updateRelationship(
    @Param('id') id: string,
    @Body() updateRelationshipDto: UpdateRelationshipDto,
  ) {
    return this.entityService.updateRelationship(id, updateRelationshipDto);
  }

  @Delete('relationships/:id')
  @Roles('admin', 'analyst')
  @ApiOperation({ summary: 'Delete an entity relationship' })
  @ApiResponse({ status: 200, description: 'Relationship deleted successfully' })
  @ApiResponse({ status: 404, description: 'Relationship not found' })
  removeRelationship(@Param('id') id: string) {
    return this.entityService.removeRelationship(id);
  }

  @Get(':id/alerts')
  @ApiOperation({ summary: 'Get alerts for an entity' })
  @ApiResponse({ status: 200, description: 'Return entity alerts' })
  @ApiResponse({ status: 404, description: 'Entity not found' })
  getAlerts(
    @Param('id') id: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('limit') limit?: number,
  ) {
    return this.entityService.getAlerts(id, { startDate, endDate, limit });
  }

  @Get(':id/events')
  @ApiOperation({ summary: 'Get events for an entity' })
  @ApiResponse({ status: 200, description: 'Return entity events' })
  @ApiResponse({ status: 404, description: 'Entity not found' })
  getEvents(
    @Param('id') id: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('limit') limit?: number,
  ) {
    return this.entityService.getEvents(id, { startDate, endDate, limit });
  }

  @Get(':id/traffic')
  @ApiOperation({ summary: 'Get traffic data for an entity' })
  @ApiResponse({ status: 200, description: 'Return entity traffic data' })
  @ApiResponse({ status: 404, description: 'Entity not found' })
  getTrafficData(
    @Param('id') id: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('interval') interval?: string,
  ) {
    return this.entityService.getTrafficData(id, { startDate, endDate, interval });
  }

  @Post('batch')
  @Roles('admin')
  @ApiOperation({ summary: 'Create multiple entities' })
  @ApiResponse({ status: 201, description: 'Entities created successfully' })
  createBatch(@Body() createEntityDtos: CreateEntityDto[]) {
    return this.entityService.createBatch(createEntityDtos);
  }

  @Get('stats/types')
  @ApiOperation({ summary: 'Get entity count by type' })
  @ApiResponse({ status: 200, description: 'Return entity statistics by type' })
  getStatsByType() {
    return this.entityService.getStatsByType();
  }

  @Get('stats/status')
  @ApiOperation({ summary: 'Get entity count by status' })
  @ApiResponse({ status: 200, description: 'Return entity statistics by status' })
  getStatsByStatus() {
    return this.entityService.getStatsByStatus();
  }
}