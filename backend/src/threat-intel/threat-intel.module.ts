import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { HttpModule } from '@nestjs/axios';
import { ThreatIntelController } from './threat-intel.controller';
import { ThreatIntelService } from './threat-intel.service';
import { IntelFeed, IntelFeedSchema } from './schemas/intel-feed.schema';
import { Indicator, IndicatorSchema } from './schemas/indicator.schema';
import { MispProvider } from './providers/misp-provider';
import { OtxProvider } from './providers/otx-provider';
import { AbuseIPDBProvider } from './providers/abuseipdb-provider';
import { ThreatIntelManager } from './threat-intel-manager.service';
import { LoggerModule } from '../logger/logger.module';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: IntelFeed.name, schema: IntelFeedSchema },
      { name: Indicator.name, schema: IndicatorSchema },
    ]),
    HttpModule.registerAsync({
      useFactory: () => ({
        timeout: 5000,
        maxRedirects: 5,
      }),
    }),
    LoggerModule,
    ConfigModule,
  ],
  controllers: [ThreatIntelController],
  providers: [
    ThreatIntelService,
    ThreatIntelManager,
    MispProvider,
    OtxProvider,
    AbuseIPDBProvider,
  ],
  exports: [ThreatIntelService, ThreatIntelManager],
})
export class ThreatIntelModule {}