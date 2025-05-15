import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AppService } from './app.service';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard';
import { Public } from './auth/decorators/public.decorator';

@ApiTags('app')
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'Get application information' })
  @ApiResponse({ status: 200, description: 'Returns application information' })
  getInfo() {
    return this.appService.getInfo();
  }

  @Public()
  @Get('health')
  @ApiOperation({ summary: 'Health check endpoint' })
  @ApiResponse({ status: 200, description: 'Application is healthy' })
  @ApiResponse({ status: 503, description: 'Application is unhealthy' })
  healthCheck() {
    return this.appService.healthCheck();
  }

  @UseGuards(JwtAuthGuard)
  @Get('system')
  @ApiOperation({ summary: 'Get system information' })
  @ApiResponse({ status: 200, description: 'Returns system information' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  getSystemInfo() {
    return this.appService.getSystemInfo();
  }
}