import { 
  Controller, 
  Get, 
  Post, 
  Param, 
  Query, 
  Body, 
  UseGuards, 
  HttpException, 
  HttpStatus 
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { EventService } from '../../events/event.service';

@ApiTags('events')
@Controller('events')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class EventsController {
  constructor(private readonly eventService: EventService) {}

  @Get()
  @ApiOperation({ summary: 'Get all events' })
  @ApiResponse({ status: 200, description: 'Returns events' })
  @ApiQuery({ name: 'type', required: false, description: 'Filter by event type' })
  @ApiQuery({ name: 'source', required: false, description: 'Filter by source' })
  @ApiQuery({ name: 'sourceIp', required: false, description: 'Filter by source IP' })
  @ApiQuery({ name: 'destinationIp', required: false, description: 'Filter by destination IP' })
  @ApiQuery({ name: 'startDate', required: false, description: 'Start date (ISO format)' })
  @ApiQuery({ name: 'endDate', required: false, description: 'End date (ISO format)' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'skip', required: false, type: Number })
  async getEvents(
    @Query('type') type?: string,
    @Query('source') source?: string,
    @Query('sourceIp') sourceIp?: string,
    @Query('destinationIp') destinationIp?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('limit') limit?: number,
    @Query('skip') skip?: number
  ) {
    try {
      const filters: any = {};
      
      if (type) filters.type = type;
      if (source) filters.source = source;
      if (sourceIp) filters.sourceIp = sourceIp;
      if (destinationIp) filters.destinationIp = destinationIp;
      
      // Date range filter
      if (startDate || endDate) {
        filters.timestamp = {};
        if (startDate) filters.timestamp.$gte = new Date(startDate);
        if (endDate) filters.timestamp.$lte = new Date(endDate);
      }
      
      const options: any = {};
      if (limit) options.limit = parseInt(limit.toString());
      if (skip) options.skip = parseInt(skip.toString());
      
      return await this.eventService.getEvents(filters, options);
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Get('statistics')
  @ApiOperation({ summary: 'Get event statistics' })
  @ApiResponse({ status: 200, description: 'Returns event statistics' })
  @ApiQuery({ name: 'hours', required: false, type: Number, description: 'Number of hours to include' })
  async getStatistics(@Query('hours') hours?: number) {
    try {
      return await this.eventService.getEventStatistics(
        hours ? parseInt(hours.toString()) : 24
      );
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get event by ID' })
  @ApiResponse({ status: 200, description: 'Return event' })
  @ApiResponse({ status: 404, description: 'Event not found' })
  async getEventById(@Param('id') id: string) {
    try {
      const event = await this.eventService.getEventById(id);
      
      if (!event) {
        throw new HttpException('Event not found', HttpStatus.NOT_FOUND);
      }
      
      return event;
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Post()
  @ApiOperation({ summary: 'Create new event' })
  @ApiResponse({ status: 201, description: 'Event created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid event data' })
  @Roles('admin', 'system')
  async createEvent(@Body() eventData: any) {
    try {
      return await this.eventService.createEvent(eventData);
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }

  @Get('aggregated/all')
  @ApiOperation({ summary: 'Get aggregated events' })
  @ApiResponse({ status: 200, description: 'Returns aggregated events' })
  @ApiQuery({ name: 'type', required: false, description: 'Filter by event type' })
  @ApiQuery({ name: 'source', required: false, description: 'Filter by source' })
  @ApiQuery({ name: 'sourceIp', required: false, description: 'Filter by source IP' })
  @ApiQuery({ name: 'destinationIp', required: false, description: 'Filter by destination IP' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'skip', required: false, type: Number })
  async getAggregatedEvents(
    @Query('type') type?: string,
    @Query('source') source?: string,
    @Query('sourceIp') sourceIp?: string,
    @Query('destinationIp') destinationIp?: string,
    @Query('limit') limit?: number,
    @Query('skip') skip?: number
  ) {
    try {
      const filters: any = {};
      
      if (type) filters.type = type;
      if (source) filters.source = source;
      if (sourceIp) filters.sourceIp = sourceIp;
      if (destinationIp) filters.destinationIp = destinationIp;
      
      const options: any = {};
      if (limit) options.limit = parseInt(limit.toString());
      if (skip) options.skip = parseInt(skip.toString());
      
      return await this.eventService.getAggregatedEvents(filters, options);
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Get('aggregated/:id')
  @ApiOperation({ summary: 'Get aggregated event by ID' })
  @ApiResponse({ status: 200, description: 'Return aggregated event' })
  @ApiResponse({ status: 404, description: 'Aggregated event not found' })
  async getAggregatedEventById(@Param('id') id: string) {
    try {
      const event = await this.eventService.getAggregatedEventById(id);
      
      if (!event) {
        throw new HttpException('Aggregated event not found', HttpStatus.NOT_FOUND);
      }
      
      return event;
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Get('by/type/:type')
  @ApiOperation({ summary: 'Get events by type' })
  @ApiResponse({ status: 200, description: 'Returns events of specified type' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async getEventsByType(
    @Param('type') type: string,
    @Query('limit') limit?: number
  ) {
    try {
      const options: any = {};
      if (limit) options.limit = parseInt(limit.toString());
      
      return await this.eventService.getEvents({ type }, options);
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Get('by/source/:source')
  @ApiOperation({ summary: 'Get events by source' })
  @ApiResponse({ status: 200, description: 'Returns events from specified source' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async getEventsBySource(
    @Param('source') source: string,
    @Query('limit') limit?: number
  ) {
    try {
      const options: any = {};
      if (limit) options.limit = parseInt(limit.toString());
      
      return await this.eventService.getEvents({ source }, options);
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Get('by/ip/:ip')
  @ApiOperation({ summary: 'Get events by IP address' })
  @ApiResponse({ status: 200, description: 'Returns events involving specified IP' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async getEventsByIP(
    @Param('ip') ip: string,
    @Query('limit') limit?: number
  ) {
    try {
      const filters = {
        $or: [
          { sourceIp: ip },
          { destinationIp: ip }
        ]
      };
      
      const options: any = {};
      if (limit) options.limit = parseInt(limit.toString());
      
      return await this.eventService.getEvents(filters, options);
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}