import { 
  Controller, 
  Get, 
  UseGuards, 
  HttpException, 
  HttpStatus 
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { HealthService } from '../../health/health.service';

@ApiTags('health')
@Controller('health')
export class HealthCheckController {
  constructor(private readonly healthService: HealthService) {}

  @Get()
  @ApiOperation({ summary: 'Get basic health status' })
  @ApiResponse({ status: 200, description: 'Returns basic health status' })
  @ApiResponse({ status: 503, description: 'Service unavailable' })
  async getBasicHealth() {
    try {
      const health = await this.healthService.getHealth();
      
      // Return 503 if status is down
      if (health.status === 'down') {
        throw new HttpException(
          { status: health.status, timestamp: health.timestamp },
          HttpStatus.SERVICE_UNAVAILABLE
        );
      }
      
      // Return basic health info
      return {
        status: health.status,
        timestamp: health.timestamp
      };
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Get('detailed')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get detailed health status' })
  @ApiResponse({ status: 200, description: 'Returns detailed health status' })
  async getDetailedHealth() {
    try {
      return await this.healthService.getHealth();
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}