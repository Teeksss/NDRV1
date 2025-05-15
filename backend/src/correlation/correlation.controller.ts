import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
  HttpStatus,
  HttpCode,
  BadRequestException
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { RequestWithUser } from '../auth/interfaces/request-with-user.interface';
import { CorrelationService } from './correlation.service';
import { CorrelationEngineService } from './correlation-engine.service';
import { CorrelationMetricsService } from './correlation-metrics.service';
import { CreateCorrelationRuleDto } from './dto/create-correlation-rule.dto';
import { UpdateCorrelationRuleDto } from './dto/update-correlation-rule.dto';
import { QueryCorrelationRuleDto } from './dto/query-correlation-rule.dto';
import { LoggerService } from '../logger/logger.service';

@ApiTags('correlation')
@Controller('correlation')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class CorrelationController {
  constructor(
    private readonly correlationService: CorrelationService,
    private readonly correlationEngineService: CorrelationEngineService,
    private readonly correlationMetricsService: CorrelationMetricsService,
    private readonly logger: LoggerService
  ) {}

  @Post('rules')
  @Roles('admin', 'analyst')
  @ApiOperation({ summary: 'Create a new correlation rule' })
  @ApiResponse({ status: 201, description: 'The rule has been successfully created.' })
  @ApiResponse({ status: 400, description: 'Invalid input.' })
  async createRule(
    @Body() createRuleDto: CreateCorrelationRuleDto,
    @Req() req: RequestWithUser
  ) {
    this.logger.log(`Creating correlation rule: ${createRuleDto.name}`, 'CorrelationController');
    return this.correlationService.create(createRuleDto, req.user.id);
  }

  @Get('rules')
  @ApiOperation({ summary: 'Get all correlation rules' })
  @ApiResponse({ status: 200, description: 'Return all rules.' })
  async findAllRules(@Query() query: QueryCorrelationRuleDto) {
    this.logger.log('Fetching all correlation rules', 'CorrelationController');
    return this.correlationService.findAll(query);
  }

  @Get('rules/:id')
  @ApiOperation({ summary: 'Get a correlation rule by ID' })
  @ApiResponse({ status: 200, description: 'Return the rule.' })
  @ApiResponse({ status: 404, description: 'Rule not found.' })
  async findOneRule(@Param('id') id: string) {
    this.logger.log(`Fetching correlation rule: ${id}`, 'CorrelationController');
    return this.correlationService.findOne(id);
  }

  @Patch('rules/:id')
  @Roles('admin', 'analyst')
  @ApiOperation({ summary: 'Update a correlation rule' })
  @ApiResponse({ status: 200, description: 'The rule has been successfully updated.' })
  @ApiResponse({ status: 404, description: 'Rule not found.' })
  async updateRule(
    @Param('id') id: string,
    @Body() updateRuleDto: UpdateCorrelationRuleDto,
    @Req() req: RequestWithUser
  ) {
    this.logger.log(`Updating correlation rule: ${id}`, 'CorrelationController');
    return this.correlationService.update(id, updateRuleDto, req.user.id);
  }

  @Delete('rules/:id')
  @Roles('admin')
  @ApiOperation({ summary: 'Delete a correlation rule' })
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiResponse({ status: 204, description: 'The rule has been successfully deleted.' })
  @ApiResponse({ status: 404, description: 'Rule not found.' })
  async removeRule(@Param('id') id: string) {
    this.logger.log(`Deleting correlation rule: ${id}`, 'CorrelationController');
    await this.correlationService.remove(id);
  }

  @Post('rules/:id/toggle')
  @Roles('admin', 'analyst')
  @ApiOperation({ summary: 'Toggle rule enabled status' })
  @ApiResponse({ status: 200, description: 'The rule status has been toggled.' })
  @ApiResponse({ status: 404, description: 'Rule not found.' })
  async toggleRuleStatus(
    @Param('id') id: string,
    @Body() body: { enabled: boolean },
    @Req() req: RequestWithUser
  ) {
    this.logger.log(`Toggling correlation rule status: ${id} to ${body.enabled}`, 'CorrelationController');
    return this.correlationService.toggleRuleStatus(id, body.enabled, req.user.id);
  }

  @Post('rules/:id/simulate')
  @Roles('admin', 'analyst')
  @ApiOperation({ summary: 'Simulate a correlation rule with test event data' })
  @ApiResponse({ status: 200, description: 'Rule simulation results.' })
  @ApiResponse({ status: 404, description: 'Rule not found.' })
  async simulateRule(
    @Param('id') id: string,
    @Body() eventData: any,
    @Req() req: RequestWithUser
  ) {
    this.logger.log(`Simulating correlation rule: ${id}`, 'CorrelationController');
    return this.correlationService.simulateRule(id, eventData);
  }

  @Post('rules/test')
  @Roles('admin', 'analyst')
  @ApiOperation({ summary: 'Test a correlation rule definition without saving' })
  @ApiResponse({ status: 200, description: 'Rule validation results.' })
  async testRule(
    @Body() ruleDefinition: CreateCorrelationRuleDto,
    @Req() req: RequestWithUser
  ) {
    this.logger.log(`Testing correlation rule: ${ruleDefinition.name}`, 'CorrelationController');
    return this.correlationService.validateRule(ruleDefinition);
  }

  @Post('rules/import')
  @Roles('admin')
  @ApiOperation({ summary: 'Import correlation rules from JSON' })
  @ApiResponse({ status: 200, description: 'Rules import results.' })
  async importRules(
    @Body() data: { rules: CreateCorrelationRuleDto[] },
    @Req() req: RequestWithUser
  ) {
    if (!data.rules || !Array.isArray(data.rules)) {
      throw new BadRequestException('Invalid rules data format');
    }

    this.logger.log(`Importing ${data.rules.length} correlation rules`, 'CorrelationController');
    return this.correlationService.importRules(data.rules, req.user.id);
  }

  @Get('rules/export')
  @Roles('admin', 'analyst')
  @ApiOperation({ summary: 'Export correlation rules to JSON' })
  @ApiResponse({ status: 200, description: 'Rules export data.' })
  async exportRules(@Query() query: QueryCorrelationRuleDto) {
    this.logger.log('Exporting correlation rules', 'CorrelationController');
    return this.correlationService.exportRules(query);
  }

  @Get('engine/status')
  @Roles('admin', 'analyst')
  @ApiOperation({ summary: 'Get correlation engine status' })
  @ApiResponse({ status: 200, description: 'Engine status information.' })
  async getEngineStatus() {
    this.logger.log('Getting correlation engine status', 'CorrelationController');
    return this.correlationEngineService.getStatus();
  }

  @Post('engine/reload')
  @Roles('admin')
  @ApiOperation({ summary: 'Reload all correlation rules in the engine' })
  @ApiResponse({ status: 200, description: 'Engine reload results.' })
  async reloadEngine(@Req() req: RequestWithUser) {
    this.logger.log('Reloading correlation engine', 'CorrelationController');
    return this.correlationEngineService.reloadRules();
  }

  @Get('metrics')
  @ApiOperation({ summary: 'Get correlation engine metrics' })
  @ApiResponse({ status: 200, description: 'Engine metrics.' })
  async getMetrics(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string
  ) {
    this.logger.log('Getting correlation metrics', 'CorrelationController');
    return this.correlationMetricsService.getMetrics(startDate, endDate);
  }

  @Get('metrics/rules')
  @ApiOperation({ summary: 'Get metrics by correlation rule' })
  @ApiResponse({ status: 200, description: 'Rule performance metrics.' })
  async getRuleMetrics(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('limit') limit?: number
  ) {
    this.logger.log('Getting correlation rule metrics', 'CorrelationController');
    return this.correlationMetricsService.getRuleMetrics(startDate, endDate, limit);
  }

  @Get('categories')
  @ApiOperation({ summary: 'Get all correlation rule categories' })
  @ApiResponse({ status: 200, description: 'List of categories.' })
  async getCategories() {
    this.logger.log('Getting correlation rule categories', 'CorrelationController');
    return this.correlationService.getCategories();
  }

  @Get('types')
  @ApiOperation({ summary: 'Get all correlation rule types' })
  @ApiResponse({ status: 200, description: 'List of types.' })
  async getTypes() {
    this.logger.log('Getting correlation rule types', 'CorrelationController');
    return this.correlationService.getTypes();
  }
}