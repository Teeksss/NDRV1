import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule } from '@nestjs/config';

// Services
import { FlowService } from './flow-analyzer/flow.service';

// Entities
import { Flow, FlowSchema } from './flow-analyzer/entities/flow.entity';
import { TopN, TopNSchema } from './flow-analyzer/entities/top-n.entity';
import { FlowStats, FlowStatsSchema } from './flow-analyzer/entities/flow-stats.entity';

// Dependencies
import { EntityModule } from '../entity/entity.module';

@Module({
  imports: [
    ConfigModule,
    MongooseModule.forFeature([
      { name: Flow.name, schema: FlowSchema },
      { name: TopN.name, schema: TopNSchema },
      { name: FlowStats.name, schema: FlowStatsSchema }
    ]),
    EntityModule
  ],
  providers: [
    FlowService
  ],
  exports: [
    FlowService
  ]
})
export class NetworkModule {}