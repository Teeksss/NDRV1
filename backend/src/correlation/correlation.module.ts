import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ScheduleModule } from '@nestjs/schedule';
import { CorrelationController } from './correlation.controller';
import { CorrelationService } from './correlation.service';
import { CorrelationEngineService } from './correlation-engine.service';
import { CorrelationRule, CorrelationRuleSchema } from './schemas/correlation-rule.schema';
import { CorrelationEvent, CorrelationEventSchema } from './schemas/correlation-event.schema';
import { EventsModule } from '../events/events.module';
import { AlertsModule } from '../alerts/alerts.module';
import { EntitiesModule } from '../entities/entities.module';
import { LoggerModule } from '../logger/logger.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { WebsocketModule } from '../websocket/websocket.module';
import { RuleEvaluatorService } from './helpers/rule-evaluator.service';
import { PatternMatcherService } from './helpers/pattern-matcher.service';
import { ConditionBuilderService } from './helpers/condition-builder.service';
import { CorrelationMetricsService } from './correlation-metrics.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: CorrelationRule.name, schema: CorrelationRuleSchema },
      { name: CorrelationEvent.name, schema: CorrelationEventSchema }
    ]),
    ScheduleModule.forRoot(),
    EventsModule,
    AlertsModule,
    EntitiesModule,
    LoggerModule,
    NotificationsModule,
    WebsocketModule
  ],
  controllers: [CorrelationController],
  providers: [
    CorrelationService,
    CorrelationEngineService,
    RuleEvaluatorService,
    PatternMatcherService,
    ConditionBuilderService,
    CorrelationMetricsService
  ],
  exports: [
    CorrelationService,
    CorrelationEngineService,
    CorrelationMetricsService
  ]
})
export class CorrelationModule {}