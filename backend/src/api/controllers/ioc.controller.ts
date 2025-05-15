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
import { IOCScannerService } from '../../detection/ioc/ioc-scanner.service';

@ApiTags('ioc')
@Controller('ioc')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class IOCController {
  constructor(private readonly iocService: IOCScannerService) {}

  @Get()
  @ApiOperation({ summary: 'Get all IOCs' })
  @ApiResponse({ status: 200, description: 'Returns IOCs' })
  @ApiQuery({ name: 'type', required: false, description: 'Filter by IOC type' })
  @ApiQuery({ name: 'active', required: false, type: Boolean, description: 'Filter by active status' })
  @ApiQuery({ name: 'search', required: false, description: 'Search in value field' })
  @ApiQuery({ name: 'feedId', required: false, description: 'Filter by feed ID' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'skip', required: false, type: Number })
  async getIOCs(
    @Query('type') type?: string,
    @Query('active') active?: boolean,
    @Query('search') search?: string,
    @Query('feedId') feedId?: string,
    @Query('limit') limit?: number,
    @Query('skip') skip?: number
  ) {
    try {
      const filters: any = {};
      
      if (type) filters.type = type;
      if (active !== undefined) filters.active = active;
      if (feedId) filters.feedId = feedId;
      
      if (search) {
        filters.value = { $regex: search, $options: 'i' };
      }
      
      const options: any = {};
      if (limit) options.limit = parseInt(limit.toString());
      if (skip) options.skip = parseInt(skip.toString());
      
      return await this.iocService.getIOCs(filters, options);
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Get('statistics')
  @ApiOperation({ summary: 'Get IOC statistics' })
  @ApiResponse({ status: 200, description: 'Returns IOC statistics' })
  async getStatistics() {
    try {
      return await this.iocService.getStatistics();
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get IOC by ID' })
  @ApiResponse({ status: 200, description: 'Return IOC' })
  @ApiResponse({ status: 404, description: 'IOC not found' })
  async getIOCById(@Param('id') id: string) {
    try {
      const ioc = await this.iocService.getIOCById(id);
      
      if (!ioc) {
        throw new HttpException('IOC not found', HttpStatus.NOT_FOUND);
      }
      
      return ioc;
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Post()
  @ApiOperation({ summary: 'Create new IOC' })
  @ApiResponse({ status: 201, description: 'IOC created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid IOC data' })
  @Roles('admin', 'analyst')
  async createIOC(@Body() iocData: any) {
    try {
      return await this.iocService.createIOC(iocData);
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update IOC' })
  @ApiResponse({ status: 200, description: 'IOC updated successfully' })
  @ApiResponse({ status: 404, description: 'IOC not found' })
  @Roles('admin', 'analyst')
  async updateIOC(@Param('id') id: string, @Body() iocData: any) {
    try {
      const ioc = await this.iocService.updateIOC(id, iocData);
      
      if (!ioc) {
        throw new HttpException('IOC not found', HttpStatus.NOT_FOUND);
      }
      
      return ioc;
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete IOC' })
  @ApiResponse({ status: 200, description: 'IOC deleted successfully' })
  @ApiResponse({ status: 404, description: 'IOC not found' })
  @Roles('admin')
  async deleteIOC(@Param('id') id: string) {
    try {
      const result = await this.iocService.deleteIOC(id);
      
      if (!result) {
        throw new HttpException('IOC not found', HttpStatus.NOT_FOUND);
      }
      
      return { success: true };
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Get('feeds/all')
  @ApiOperation({ summary: 'Get all IOC feeds' })
  @ApiResponse({ status: 200, description: 'Returns IOC feeds' })
  async getFeeds() {
    try {
      return await this.iocService.getFeeds();
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Post('feeds')
  @ApiOperation({ summary: 'Create new IOC feed' })
  @ApiResponse({ status: 201, description: 'IOC feed created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid feed data' })
  @Roles('admin')
  async createFeed(@Body() feedData: any) {
    try {
      return await this.iocService.createFeed(feedData);
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }

  @Put('feeds/:id')
  @ApiOperation({ summary: 'Update IOC feed' })
  @ApiResponse({ status: 200, description: 'IOC feed updated successfully' })
  @ApiResponse({ status: 404, description: 'IOC feed not found' })
  @Roles('admin')
  async updateFeed(@Param('id') id: string, @Body() feedData: any) {
    try {
      const feed = await this.iocService.updateFeed(id, feedData);
      
      if (!feed) {
        throw new HttpException('IOC feed not found', HttpStatus.NOT_FOUND);
      }
      
      return feed;
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }

  @Delete('feeds/:id')
  @ApiOperation({ summary: 'Delete IOC feed' })
  @ApiResponse({ status: 200, description: 'IOC feed deleted successfully' })
  @ApiResponse({ status: 404, description: 'IOC feed not found' })
  @Roles('admin')
  async deleteFeed(@Param('id') id: string) {
    try {
      const result = await this.iocService.deleteFeed(id);
      
      if (!result.success) {
        throw new HttpException('IOC feed not found', HttpStatus.NOT_FOUND);
      }
      
      return result;
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Post('feeds/update')
  @ApiOperation({ summary: 'Update IOC feeds' })
  @ApiResponse({ status: 200, description: 'IOC feeds updated successfully' })
  @Roles('admin')
  async updateFeeds() {
    try {
      return await this.iocService.updateFeeds();
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Get('matches/all')
  @ApiOperation({ summary: 'Get IOC matches' })
  @ApiResponse({ status: 200, description: 'Returns IOC matches' })
  @ApiQuery({ name: 'iocType', required: false, description: 'Filter by IOC type' })
  @ApiQuery({ name: 'eventType', required: false, description: 'Filter by event type' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'skip', required: false, type: Number })
  async getMatches(
    @Query('iocType') iocType?: string,
    @Query('eventType') eventType?: string,
    @Query('limit') limit?: number,
    @Query('skip') skip?: number
  ) {
    try {
      const filters: any = {};
      
      if (iocType) filters.iocType = iocType;
      if (eventType) filters.eventType = eventType;
      
      const options: any = {};
      if (limit) options.limit = parseInt(limit.toString());
      if (skip) options.skip = parseInt(skip.toString());
      
      return await this.iocService.getMatches(filters, options);
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Get('matches/:id')
  @ApiOperation({ summary: 'Get IOC match by ID' })
  @ApiResponse({ status: 200, description: 'Return IOC match' })
  @ApiResponse({ status: 404, description: 'IOC match not found' })
  async getMatchById(@Param('id') id: string) {
    try {
      const match = await this.iocService.getMatchById(id);
      
      if (!match) {
        throw new HttpException('IOC match not found', HttpStatus.NOT_FOUND);
      }
      
      return match;
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}