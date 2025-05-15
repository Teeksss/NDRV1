import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule } from '@nestjs/config';

// Services
import { IOCScannerService } from './ioc/ioc-scanner.service';
import { TrafficAnomalyDetectorService } from './network/traffic-anomaly-detector.service';

// Entities
import { IOC, IOCSchema } from './ioc/entities/ioc.entity';
import { IOCFeed, IOCFeedSchema } from './ioc/entities/ioc-feed.entity';
import { IOCMatch, IOCMatchSchema } from './ioc/entities/ioc-match.entity';
import { TrafficAnomaly, TrafficAnomalySchema } from './network/entities/traffic-anomaly.entity';
import { BaselineStats, BaselineStatsSchema } from './network/entities/baseline-stats.entity';

// Dependencies
import { AlertsModule } from '../alerts/alerts.module';
import { NetworkModule } from '../network/network.module';

@Module({
  imports: [
    ConfigModule,
    MongooseModule.forFeature([
      { name: IOC.name, schema: IOCSchema },
      { name: IOCFeed.name, schema: IOCFeedSchema },
      { name: IOCMatch.name, schema: IOCMatchSchema },
      { name: TrafficAnomaly.name, schema: TrafficAnomalySchema },
      { name: BaselineStats.name, schema: BaselineStatsSchema }
    ]),
    AlertsModule,
    NetworkModule
  ],
  providers: [
    IOCScannerService,
    TrafficAnomalyDetectorService
  ],
  exports: [
    IOCScannerService,
    TrafficAnomalyDetectorService
  ]
})
export class DetectionModule {}