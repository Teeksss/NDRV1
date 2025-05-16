import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { IntegrationService } from '../services/integration.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';

@ApiTags('System Integration')
@Controller('api/v3/integration')
@UseGuards(JwtAuthGuard)
export class IntegrationController {
    private readonly controllerInfo = {
        timestamp: '2025-05-16 06:31:00',
        maintainer: 'Teeksss',
        version: '3.0.3',
        buildNumber: '202505160631'
    };

    constructor(private readonly integrationService: IntegrationService) {}

    @Get('status')
    @ApiOperation({ summary: 'Get integration status' })
    async getStatus() {
        return {
            timestamp: new Date('2025-05-16 06:31:00').toISOString(),
            status: 'operational',
            version: this.controllerInfo.version,
            components: await this.integrationService.getComponentsStatus(),
            metadata: {
                maintainer: this.controllerInfo.maintainer,
                buildNumber: this.controllerInfo.buildNumber
            }
        };
    }

    @Post('validate')
    @ApiOperation({ summary: 'Validate system integration' })
    async validateIntegration() {
        return await this.integrationService.validateIntegration();
    }
}