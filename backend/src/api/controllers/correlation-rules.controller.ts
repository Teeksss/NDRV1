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
import { CorrelationService } from '../../correlation/correlation.service';

@ApiTags('correlation-rules')
@Controller('correlation-rules')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class CorrelationRulesController {
  constructor(private readonly correlationService: CorrelationService) {}

  @Get()
  @ApiOperation({ summary: 'Get all correlation rules' })
  @ApiResponse({ status: 200, description: 'Returns correlation rules' })
  @ApiQuery({ name: 'enabled', required: false, type: Boolean, description: 'Filter by enabled status' })
  @ApiQuery({ name: 'severity', required: false, description: 'Filter by severity' })
  @ApiQuery({ name: 'category', required: false, description: 'Filter by category' })
  @ApiQuery({ name: 'search', required: false, description: 'Search in name or description' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'skip', required: false, type: Number })
  async getRules(
    @Query('enabled') enabled?: boolean,
    @Query('severity') severity?: string,
    @Query('category') category?: string,
    @Query('search') search?: string,
    @Query('limit') limit?: number,
    @Query('skip') skip?: number
  ) {
    try {
      const filters: any = {};
      
      if (enabled !== undefined) filters.enabled = enabled;
      if (severity) filters.severity = severity;
      if (category) filters.category = category;
      
      if (search) {
        filters.$or = [
          { name: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } }
        ];
      }
      
      const options: any = {};
      if (limit) options.limit = parseInt(limit.toString(), 10);
      if (skip) options.skip = parseInt(skip.toString(), 10);
      
      return await this.correlationService.getRules(filters, options);
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Get('statistics')
  @ApiOperation({ summary: 'Get correlation rule statistics' })
  @ApiResponse({ status: 200, description: 'Returns correlation rule statistics' })
  async getStatistics() {
    try {
      return await this.correlationService.getRuleStatistics();
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get correlation rule by ID' })
  @ApiResponse({ status: 200, description: 'Return correlation rule' })
  @ApiResponse({ status: 404, description: 'Correlation rule not found' })
  async getRuleById(@Param('id') id: string) {
    try {
      const rule = await this.correlationService.getRuleById(id);
      
      if (!rule) {
        throw new HttpException('Correlation rule not found', HttpStatus.NOT_FOUND);
      }
      
      return rule;
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Post()
  @ApiOperation({ summary: 'Create new correlation rule' })
  @ApiResponse({ status: 201, description: 'Correlation rule created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid rule data' })
  @Roles('admin')
  async createRule(@Body() ruleData: any) {
    try {
      return await this.correlationService.createRule(ruleData);
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update correlation rule' })
  @ApiResponse({ status: 200, description: 'Correlation rule updated successfully' })
  @ApiResponse({ status: 404, description: 'Correlation rule not found' })
  @Roles('admin')
  async updateRule(@Param('id') id: string, @Body() ruleData: any) {
    try {
      const rule = await this.correlationService.updateRule(id, ruleData);
      
      if (!rule) {
        throw new HttpException('Correlation rule not found', HttpStatus.NOT_FOUND);
      }
      
      return rule;
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete correlation rule' })
  @ApiResponse({ status: 200, description: 'Correlation rule deleted successfully' })
  @ApiResponse({ status: 404, description: 'Correlation rule not found' })
  @Roles('admin')
  async deleteRule(@Param('id') id: string) {
    try {
      const result = await this.correlationService.deleteRule(id);
      
      if (!result) {
        throw new HttpException('Correlation rule not found', HttpStatus.NOT_FOUND);
      }
      
      return { success: true };
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Put(':id/status')
  @ApiOperation({ summary: 'Enable or disable correlation rule' })
  @ApiResponse({ status: 200, description: 'Correlation rule status updated successfully' })
  @ApiResponse({ status: 404, description: 'Correlation rule not found' })
  @Roles('admin')
  async updateRuleStatus(
    @Param('id') id: string,
    @Body() data: { enabled: boolean }
  ) {
    try {
      if (data.enabled === undefined) {
        throw new HttpException('Enabled status is required', HttpStatus.BAD_REQUEST);
      }
      
      const rule = await this.correlationService.setRuleStatus(id, data.enabled);
      
      if (!rule) {
        throw new HttpException('Correlation rule not found', HttpStatus.NOT_FOUND);
      }
      
      return rule;
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Get('sessions/all')
  @ApiOperation({ summary: 'Get correlation sessions' })
  @ApiResponse({ status: 200, description: 'Returns correlation sessions' })
  @ApiQuery({ name: 'ruleId', required: false, description: 'Filter by rule ID' })
  @ApiQuery({ name: 'status', required: false, description: 'Filter by status' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'skip', required: false, type: Number })
  async getSessions(
    @Query('ruleId') ruleId?: string,
    @Query('status') status?: string,
    @Query('limit') limit?: number,
    @Query('skip') skip?: number
  ) {
    try {
      const filters: any = {};
      
      if (ruleId) filters.ruleId = ruleId;
      if (status) filters.status = status;
      
      const options: any = {};
      if (limit) options.limit = parseInt(limit.toString(), 10);
      if (skip) options.skip = parseInt(skip.toString(), 10);
      
      return await this.correlationService.getSessions(filters, options);
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Get('sessions/:id')
  @ApiOperation({ summary: 'Get correlation session by ID' })
  @ApiResponse({ status: 200, description: 'Return correlation session' })
  @ApiResponse({ status: 404, description: 'Correlation session not found' })
  async getSessionById(@Param('id') id: string) {
    try {
      const session = await this.correlationService.getSessionById(id);
      
      if (!session) {
        throw new HttpException('Correlation session not found', HttpStatus.NOT_FOUND);
      }
      
      return session;
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Get('sessions/:id/events')
  @ApiOperation({ summary: 'Get events for correlation session' })
  @ApiResponse({ status: 200, description: 'Returns session events' })
  @ApiResponse({ status: 404, description: 'Correlation session not found' })
  async getSessionEvents(@Param('id') id: string) {
    try {
      const events = await this.correlationService.getSessionEvents(id);
      
      if (!events) {
        throw new HttpException('Correlation session not found', HttpStatus.NOT_FOUND);
      }
      
      return events;
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Get('by/category/:category')
  @ApiOperation({ summary: 'Get rules by category' })
  @ApiResponse({ status: 200, description: 'Returns rules for specified category' })
  async getRulesByCategory(@Param('category') category: string) {
    try {
      return await this.correlationService.getRules({ category });
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Get('by/severity/:severity')
  @ApiOperation({ summary: 'Get rules by severity' })
  @ApiResponse({ status: 200, description: 'Returns rules for specified severity' })
  async getRulesBySeverity(@Param('severity') severity: string) {
    try {
      return await this.correlationService.getRules({ severity });
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}