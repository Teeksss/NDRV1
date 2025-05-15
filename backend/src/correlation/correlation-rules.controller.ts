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
import { CorrelationRulesService } from './correlation-rules.service';
import { CreateCorrelationRuleDto } from './dto/create-correlation-rule.dto';
import { UpdateCorrelationRuleDto } from './dto/update-correlation-rule.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('correlation-rules')
@Controller('correlation-rules')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class CorrelationRulesController {
  constructor(
    private readonly correlationRulesService: CorrelationRulesService,
  ) {}

  @Post()
  @Roles('admin', 'analyst')
  @ApiOperation({ summary: 'Create a new correlation rule' })
  @ApiResponse({ status: 201, description: 'Correlation rule created successfully' })
  create(@Body() createCorrelationRuleDto: CreateCorrelationRuleDto) {
    return this.correlationRulesService.create(createCorrelationRuleDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all correlation rules' })
  @ApiResponse({ status: 200, description: 'Return all correlation rules' })
  findAll(
    @Query('name') name?: string,
    @Query('enabled') enabled?: boolean,
    @Query('severity') severity?: string,
    @Query('sortBy') sortBy?: string,
    @Query('sortOrder') sortOrder?: 'asc' | 'desc',
    @Query('limit') limit?: number,
    @Query('page') page?: number,
  ) {
    return this.correlationRulesService.findAll({
      name,
      enabled,
      severity,
      sortBy,
      sortOrder,
      limit,
      page,
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a correlation rule by ID' })
  @ApiResponse({ status: 200, description: 'Return the correlation rule' })
  @ApiResponse({ status: 404, description: 'Correlation rule not found' })
  findOne(@Param('id') id: string) {
    return this.correlationRulesService.findOne(id);
  }

  @Patch(':id')
  @Roles('admin', 'analyst')
  @ApiOperation({ summary: 'Update a correlation rule' })
  @ApiResponse({ status: 200, description: 'Correlation rule updated successfully' })
  @ApiResponse({ status: 404, description: 'Correlation rule not found' })
  update(
    @Param('id') id: string,
    @Body() updateCorrelationRuleDto: UpdateCorrelationRuleDto,
  ) {
    return this.correlationRulesService.update(id, updateCorrelationRuleDto);
  }

  @Delete(':id')
  @Roles('admin')
  @ApiOperation({ summary: 'Delete a correlation rule' })
  @ApiResponse({ status: 200, description: 'Correlation rule deleted successfully' })
  @ApiResponse({ status: 404, description: 'Correlation rule not found' })
  remove(@Param('id') id: string) {
    return this.correlationRulesService.remove(id);
  }

  @Patch(':id/enable')
  @Roles('admin', 'analyst')
  @ApiOperation({ summary: 'Enable a correlation rule' })
  @ApiResponse({ status: 200, description: 'Correlation rule enabled successfully' })
  @ApiResponse({ status: 404, description: 'Correlation rule not found' })
  enable(@Param('id') id: string) {
    return this.correlationRulesService.enable(id);
  }

  @Patch(':id/disable')
  @Roles('admin', 'analyst')
  @ApiOperation({ summary: 'Disable a correlation rule' })
  @ApiResponse({ status: 200, description: 'Correlation rule disabled successfully' })
  @ApiResponse({ status: 404, description: 'Correlation rule not found' })
  disable(@Param('id') id: string) {
    return this.correlationRulesService.disable(id);
  }

  @Post(':id/test')
  @Roles('admin', 'analyst')
  @ApiOperation({ summary: 'Test a correlation rule' })
  @ApiResponse({ status: 200, description: 'Correlation rule test results' })
  @ApiResponse({ status: 404, description: 'Correlation rule not found' })
  test(@Param('id') id: string, @Body() testData: any) {
    return this.correlationRulesService.testRule(id, testData);
  }

  @Get('templates/all')
  @ApiOperation({ summary: 'Get correlation rule templates' })
  @ApiResponse({ status: 200, description: 'Return correlation rule templates' })
  getTemplates() {
    return this.correlationRulesService.getTemplates();
  }

  @Get(':id/history')
  @ApiOperation({ summary: 'Get correlation rule history' })
  @ApiResponse({ status: 200, description: 'Return correlation rule history' })
  @ApiResponse({ status: 404, description: 'Correlation rule not found' })
  getHistory(@Param('id') id: string) {
    return this.correlationRulesService.getHistory(id);
  }

  @Post(':id/clone')
  @Roles('admin', 'analyst')
  @ApiOperation({ summary: 'Clone a correlation rule' })
  @ApiResponse({ status: 201, description: 'Correlation rule cloned successfully' })
  @ApiResponse({ status: 404, description: 'Correlation rule not found' })
  clone(@Param('id') id: string) {
    return this.correlationRulesService.clone(id);
  }
}