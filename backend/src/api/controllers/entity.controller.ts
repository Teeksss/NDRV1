import { 
  Controller, 
  Get, 
  Post, 
  Put, 
  Delete, 
  Body, 
  Param, 
  Query, 
  UseGuards, 
  HttpException, 
  HttpStatus 
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { EntityService } from '../../entity/entity.service';

@ApiTags('entities')
@Controller('entities')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class EntityController {
  constructor(private readonly entityService: EntityService) {}

  @Get()
  @ApiOperation({ summary: 'Get all entities' })
  @ApiResponse({ status: 200, description: 'Returns entities' })
  @ApiQuery({ name: 'type', required: false, description: 'Filter by entity type' })
  @ApiQuery({ name: 'status', required: false, description: 'Filter by status' })
  @ApiQuery({ name: 'search', required: false, description: 'Search in name or IP address' })
  @ApiQuery({ name: 'groupId', required: false, description: 'Filter by group ID' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'skip', required: false, type: Number })
  async getEntities(
    @Query('type') type?: string,
    @Query('status') status?: string,
    @Query('search') search?: string,
    @Query('groupId') groupId?: string,
    @Query('limit') limit?: number,
    @Query('skip') skip?: number
  ) {
    try {
      const filters: any = {};
      
      if (type) filters.type = type;
      if (status) filters.status = status;
      
      if (search) {
        filters.$or = [
          { name: { $regex: search, $options: 'i' } },
          { ipAddress: { $regex: search, $options: 'i' } },
          { hostname: { $regex: search, $options: 'i' } }
        ];
      }
      
      if (groupId) {
        filters.groupIds = groupId;
      }
      
      const options: any = {};
      if (limit) options.limit = parseInt(limit.toString());
      if (skip) options.skip = parseInt(skip.toString());
      
      return await this.entityService.getEntities(filters, options);
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Get('statistics')
  @ApiOperation({ summary: 'Get entity statistics' })
  @ApiResponse({ status: 200, description: 'Returns entity statistics' })
  async getStatistics() {
    try {
      return await this.entityService.getStatistics();
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get entity by ID' })
  @ApiResponse({ status: 200, description: 'Return entity' })
  @ApiResponse({ status: 404, description: 'Entity not found' })
  async getEntityById(@Param('id') id: string) {
    try {
      const entity = await this.entityService.getEntityById(id);
      
      if (!entity) {
        throw new HttpException('Entity not found', HttpStatus.NOT_FOUND);
      }
      
      return entity;
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Post()
  @ApiOperation({ summary: 'Create new entity' })
  @ApiResponse({ status: 201, description: 'Entity created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid entity data' })
  @Roles('admin', 'analyst')
  async createEntity(@Body() entityData: any) {
    try {
      return await this.entityService.createEntity(entityData);
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update entity' })
  @ApiResponse({ status: 200, description: 'Entity updated successfully' })
  @ApiResponse({ status: 404, description: 'Entity not found' })
  @Roles('admin', 'analyst')
  async updateEntity(@Param('id') id: string, @Body() entityData: any) {
    try {
      const entity = await this.entityService.updateEntity(id, entityData);
      
      if (!entity) {
        throw new HttpException('Entity not found', HttpStatus.NOT_FOUND);
      }
      
      return entity;
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete entity' })
  @ApiResponse({ status: 200, description: 'Entity deleted successfully' })
  @ApiResponse({ status: 404, description: 'Entity not found' })
  @Roles('admin')
  async deleteEntity(@Param('id') id: string) {
    try {
      const result = await this.entityService.deleteEntity(id);
      
      if (!result.success) {
        throw new HttpException('Entity not found', HttpStatus.NOT_FOUND);
      }
      
      return result;
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Get('groups/all')
  @ApiOperation({ summary: 'Get all entity groups' })
  @ApiResponse({ status: 200, description: 'Returns entity groups' })
  async getGroups() {
    try {
      return await this.entityService.getEntityGroups();
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Post('groups')
  @ApiOperation({ summary: 'Create new entity group' })
  @ApiResponse({ status: 201, description: 'Entity group created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid group data' })
  @Roles('admin', 'analyst')
  async createGroup(@Body() groupData: any) {
    try {
      return await this.entityService.createEntityGroup(groupData);
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }

  @Put('groups/:id')
  @ApiOperation({ summary: 'Update entity group' })
  @ApiResponse({ status: 200, description: 'Entity group updated successfully' })
  @ApiResponse({ status: 404, description: 'Entity group not found' })
  @Roles('admin', 'analyst')
  async updateGroup(@Param('id') id: string, @Body() groupData: any) {
    try {
      const group = await this.entityService.updateEntityGroup(id, groupData);
      
      if (!group) {
        throw new HttpException('Group not found', HttpStatus.NOT_FOUND);
      }
      
      return group;
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }

  @Delete('groups/:id')
  @ApiOperation({ summary: 'Delete entity group' })
  @ApiResponse({ status: 200, description: 'Entity group deleted successfully' })
  @ApiResponse({ status: 404, description: 'Entity group not found' })
  @Roles('admin')
  async deleteGroup(@Param('id') id: string) {
    try {
      const result = await this.entityService.deleteEntityGroup(id);
      
      if (!result.success) {
        throw new HttpException('Group not found', HttpStatus.NOT_FOUND);
      }
      
      return result;
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Post('groups/:groupId/add/:entityId')
  @ApiOperation({ summary: 'Add entity to group' })
  @ApiResponse({ status: 200, description: 'Entity added to group successfully' })
  @ApiResponse({ status: 404, description: 'Entity or group not found' })
  @Roles('admin', 'analyst')
  async addEntityToGroup(
    @Param('groupId') groupId: string,
    @Param('entityId') entityId: string
  ) {
    try {
      return await this.entityService.addEntityToGroup(entityId, groupId);
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Post('groups/:groupId/remove/:entityId')
  @ApiOperation({ summary: 'Remove entity from group' })
  @ApiResponse({ status: 200, description: 'Entity removed from group successfully' })
  @Roles('admin', 'analyst')
  async removeEntityFromGroup(
    @Param('groupId') groupId: string,
    @Param('entityId') entityId: string
  ) {
    try {
      return await this.entityService.removeEntityFromGroup(entityId, groupId);
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Get('relationships/all')
  @ApiOperation({ summary: 'Get entity relationships' })
  @ApiResponse({ status: 200, description: 'Returns entity relationships' })
  @ApiQuery({ name: 'entityId', required: false, description: 'Filter by entity ID' })
  @ApiQuery({ name: 'type', required: false, description: 'Filter by relationship type' })
  async getRelationships(
    @Query('entityId') entityId?: string,
    @Query('type') type?: string
  ) {
    try {
      const filters: any = {};
      
      if (entityId) {
        filters.$or = [
          { sourceEntityId: entityId },
          { targetEntityId: entityId }
        ];
      }
      
      if (type) {
        filters.type = type;
      }
      
      return await this.entityService.getRelationships(filters);
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Post('relationships')
  @ApiOperation({ summary: 'Create entity relationship' })
  @ApiResponse({ status: 201, description: 'Entity relationship created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid relationship data' })
  @Roles('admin', 'analyst')
  async createRelationship(@Body() relationshipData: any) {
    try {
      return await this.entityService.createRelationship(relationshipData);
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }

  @Delete('relationships/:id')
  @ApiOperation({ summary: 'Delete entity relationship' })
  @ApiResponse({ status: 200, description: 'Entity relationship deleted successfully' })
  @ApiResponse({ status: 404, description: 'Entity relationship not found' })
  @Roles('admin', 'analyst')
  async deleteRelationship(@Param('id') id: string) {
    try {
      const result = await this.entityService.deleteRelationship(id);
      
      if (!result.success) {
        throw new HttpException('Relationship not found', HttpStatus.NOT_FOUND);
      }
      
      return result;
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}