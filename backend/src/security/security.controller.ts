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
    HttpStatus,
    HttpException
} from '@nestjs/common';
import { SecurityService } from './security.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('security')
@UseGuards(JwtAuthGuard, RolesGuard)
export class SecurityController {
    private readonly controllerInfo = {
        timestamp: '2025-05-16 07:04:06',
        maintainer: 'Teeksss',
        version: '3.2.4',
        buildNumber: '202505160704'
    };

    constructor(private readonly securityService: SecurityService) {}

    @Get('status')
    @Roles('admin', 'security')
    async getSecurityStatus() {
        try {
            const status = await this.securityService.getStatus();
            return {
                ...status,
                timestamp: new Date().toISOString(),
                controllerInfo: this.controllerInfo
            };
        } catch (error) {
            throw new HttpException(
                'Failed to get security status',
                HttpStatus.INTERNAL_SERVER_ERROR
            );
        }
    }

    @Get('metrics')
    @Roles('admin', 'security', 'analyst')
    async getSecurityMetrics(@Query() query: any) {
        try {
            const metrics = await this.securityService.getMetrics(query);
            return {
                ...metrics,
                timestamp: new Date().toISOString(),
                controllerInfo: this.controllerInfo
            };
        } catch (error) {
            throw new HttpException(
                'Failed to get security metrics',
                HttpStatus.INTERNAL_SERVER_ERROR
            );
        }
    }

    @Post('alerts')
    @Roles('admin', 'security')
    async createSecurityAlert(@Body() alertData: any) {
        try {
            const alert = await this.securityService.createAlert(alertData);
            return {
                ...alert,
                timestamp: new Date().toISOString(),
                controllerInfo: this.controllerInfo
            };
        } catch (error) {
            throw new HttpException(
                'Failed to create security alert',
                HttpStatus.INTERNAL_SERVER_ERROR
            );
        }
    }

    @Put('alerts/:id')
    @Roles('admin', 'security')
    async updateSecurityAlert(@Param('id') id: string, @Body() updateData: any) {
        try {
            const alert = await this.securityService.updateAlert(id, updateData);
            return {
                ...alert,
                timestamp: new Date().toISOString(),
                controllerInfo: this.controllerInfo
            };
        } catch (error) {
            throw new HttpException(
                'Failed to update security alert',
                HttpStatus.INTERNAL_SERVER_ERROR
            );
        }
    }

    @Delete('alerts/:id')
    @Roles('admin')
    async deleteSecurityAlert(@Param('id') id: string) {
        try {
            await this.securityService.deleteAlert(id);
            return {
                success: true,
                timestamp: new Date().toISOString(),
                controllerInfo: this.controllerInfo
            };
        } catch (error) {
            throw new HttpException(
                'Failed to delete security alert',
                HttpStatus.INTERNAL_SERVER_ERROR
            );
        }
    }
}