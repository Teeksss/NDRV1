import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Query,
  UseGuards,
  HttpStatus,
  Req,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { EventsService } from './events.service';
import { CreateEventDto } from './dto/create-event.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { RequestWithUser } from '../auth/interfaces/request-with-user.interface';

@ApiTags('events')
@Controller('events')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class EventsController {
  constructor(private readonly eventsService: EventsService) {}

  @Post()
  @Roles('admin', 'analyst')
  @ApiOperation({ summary: 'Create a new event' })
  @ApiResponse({ status: 201, description: 'Event created successfully' })
  create(@Body() createEventDto: CreateEventDto, @Req() req: RequestWithUser) {
    return this.eventsService.create(createEventDto, req.user.id);
  }

  @Get()
  @ApiOperation({ summary: 'Get all events with filtering' })
  @ApiResponse({ status: 200, description: 'Return all events' })
  findAll(
    @Query('type') type?: string,
    @Query('entityId') entityId?: string,
    @Query('sourceIp') sourceIp?: string,
    @Query('destinationIp') destinationIp?: string,
    @Query('protocol') protocol?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('sort') sort?: string,
    @Query('order') order?: string,
    @Query('limit') limit?: number,
    @Query('page') page?: number,
  ) {
    return this.eventsService.findAll({
      type,
      entityId,
      sourceIp,
      destinationIp,
      protocol,
      startDate,
      endDate,
      sort,
      order,
      limit,
      page,
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get an event by ID' })
  @ApiResponse({ status: 200, description: 'Return the event' })
  @ApiResponse({ status: 404, description: 'Event not found' })
  findOne(@Param('id') id: string) {
    return this.eventsService.findOne(id);
  }

  @Delete(':id')
  @Roles('admin', 'analyst')
  @ApiOperation({ summary: 'Delete an event' })
  @ApiResponse({ status: 200, description: 'Event deleted successfully' })
  @ApiResponse({ status: 404, description: 'Event not found' })
  remove(@Param('id') id: string) {
    return this.eventsService.remove(id);
  }

  @Get('/batch')
  @ApiOperation({ summary: 'Get events by IDs' })
  @ApiResponse({ status: 200, description: 'Return events by IDs' })
  getByIds(@Query('ids') ids: string) {
    const eventIds = ids.split(',');
    return this.eventsService.findByIds(eventIds);
  }

  @Get(':id/related')
  @ApiOperation({ summary: 'Get related events' })
  @ApiResponse({ status: 200, description: 'Return related events' })
  getRelatedEvents(@Param('id') id: string, @Query('limit') limit?: number) {
    return this.eventsService.getRelatedEvents(id, limit);
  }

  @Get('stats/type')
  @ApiOperation({ summary: 'Get events count by type' })
  @ApiResponse({ status: 200, description: 'Return events statistics by type' })
  getStatsByType(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.eventsService.getStatsByType(startDate, endDate);
  }

  @Get('stats/trend')
  @ApiOperation({ summary: 'Get events trend over time' })
  @ApiResponse({ status: 200, description: 'Return events trend data' })
  getTrend(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('interval') interval?: string,
  ) {
    return this.eventsService.getTrend(startDate, endDate, interval);
  }

  @Get('stats/protocols')
  @ApiOperation({ summary: 'Get top protocols' })
  @ApiResponse({ status: 200, description: 'Return top protocols' })
  getTopProtocols(
    @Query('limit') limit?: number,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.eventsService.getTopProtocols(limit, startDate, endDate);
  }

  @Get('stats/source-ips')
  @ApiOperation({ summary: 'Get top source IPs' })
  @ApiResponse({ status: 200, description: 'Return top source IPs' })
  getTopSourceIps(
    @Query('limit') limit?: number,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.eventsService.getTopSourceIps(limit, startDate, endDate);
  }

  @Get('stats/destination-ips')
  @ApiOperation({ summary: 'Get top destination IPs' })
  @ApiResponse({ status: 200, description: 'Return top destination IPs' })
  getTopDestinationIps(
    @Query('limit') limit?: number,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.eventsService.getTopDestinationIps(limit, startDate, endDate);
  }
}