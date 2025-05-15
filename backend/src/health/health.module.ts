import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { HealthService } from './health.service';

@Module({
  imports: [ConfigModule],
  providers: [HealthService],
  exports: [HealthService]
})
export class HealthModule {}