import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { EventEmitter2, OnEvent } from '@nestjs/event-emitter';
import { Anomaly, AnomalyDocument } from './schemas/anomaly.schema';
import { CreateAnomalyDto } from './dto/create-anomaly.dto';
import { UpdateAnomalyDto } from './dto/update-anomaly.dto';
import { StatisticalDetector } from './detectors/statistical.detector';
import { MachineLearningDetector } from './detectors/machine-learning.detector';
import { BehavioralDetector } from './detectors/behavioral.detector';
import { LoggerService } from '../logger/logger.service';
import { AlertsService } from '../alerts/alerts.service';
import { AnomalyBaselineService } from './anomaly-baseline.service';
import { Cron, CronExpression } from '@nestjs/schedule';

@Injectable()
export class AnomalyService implements OnModuleInit {
  constructor(
    @InjectModel(Anomaly.name) private anomalyModel: Model<AnomalyDocument>,
    private statisticalDetector: StatisticalDetector,
    private machineLearningDetector: MachineLearningDetector,
    private behavioralDetector: BehavioralDetector,
    private anomalyBaselineService: AnomalyBaselineService,
    private logger: LoggerService,
    private alertsService: AlertsService,
    private eventEmitter: EventEmitter2,
  ) {}

  async onModuleInit() {
    // Initialize detectors and baselines
    await this.anomalyBaselineService.initializeBaselines();
    this.logger.log('Anomaly detection service initialized', 'AnomalyService');
  }

  @OnEvent('event.created')
  async handleEventCreated(event: any) {
    // Process event through anomaly detectors
    this.processEvent(event);
  }

  async processEvent(event: any) {
    try {
      // Apply different detection techniques
      const [
        statisticalResults,
        mlResults,
        behavioralResults
      ] = await Promise.all([
        this.statisticalDetector.detectAnomalies(event),
        this.machineLearningDetector.detectAnomalies(event),
        this.behavioralDetector.detectAnomalies(event)
      ]);

      // Combine and analyze results
      const anomalies = this.combineDetectionResults(
        event,
        statisticalResults,
        mlResults,
        behavioralResults
      );

      // Create anomaly records and alerts if anomalies are detected
      if (anomalies.length > 0) {
        await this.processDetectedAnomalies(anomalies);
      }
    } catch (error) {
      this.logger.error(
        `Error processing event for anomalies: ${error.message}`,
        error.stack,
        'AnomalyService'
      );
    }
  }

  private combineDetectionResults(
    event: any,
    statisticalResults: any[],
    mlResults: any[],
    behavioralResults: any[]
  ): CreateAnomalyDto[] {
    const combinedResults: CreateAnomalyDto[] = [];

    // Process statistical anomalies
    for (const result of statisticalResults) {
      if (result.score >= result.threshold) {
        combinedResults.push({
          eventId: event.id,
          entityId: event.entityId,
          type: 'statistical',
          subType: result.type,
          score: result.score,
          threshold: result.threshold,
          description: result.description,
          details: result.details,
          timestamp: new Date(),
        });
      }
    }

    // Process machine learning anomalies
    for (const result of mlResults) {
      if (result.score >= result.threshold) {
        combinedResults.push({
          eventId: event.id,
          entityId: event.entityId,
          type: 'machine_learning',
          subType: result.type,
          score: result.score,
          threshold: result.threshold,
          description: result.description,
          details: result.details,
          timestamp: new Date(),
        });
      }
    }

    // Process behavioral anomalies
    for (const result of behavioralResults) {
      if (result.score >= result.threshold) {
        combinedResults.push({
          eventId: event.id,
          entityId: event.entityId,
          type: 'behavioral',
          subType: result.type,
          score: result.score,
          threshold: result.threshold,
          description: result.description,
          details: result.details,
          timestamp: new Date(),
        });
      }
    }

    return combinedResults;
  }

  private async processDetectedAnomalies(anomalies: CreateAnomalyDto[]) {
    for (const anomalyData of anomalies) {
      try {
        // Create anomaly record
        const anomaly = await this.create(anomalyData);

        // Generate alert for the anomaly
        await this.generateAlert(anomaly);

        // Emit event for other components
        this.eventEmitter.emit('anomaly.detected', anomaly);

        this.logger.log(
          `Anomaly detected: ${anomaly.type}/${anomaly.subType} with score ${anomaly.score}`,
          'AnomalyService'
        );
      } catch (error) {
        this.logger.error(
          `Error processing detected anomaly: ${error.message}`,
          error.stack,
          'AnomalyService'
        );
      }
    }
  }

  private async generateAlert(anomaly: Anomaly) {
    try {
      // Determine alert severity based on anomaly score
      let severity = 'low';
      if (anomaly.score >= 0.9) {
        severity = 'critical';
      } else if (anomaly.score >= 0.7) {
        severity = 'high';
      } else if (anomaly.score >= 0.5) {
        severity = 'medium';
      }

      // Create alert
      await this.alertsService.create({
        title: `Anomaly detected: ${anomaly.description}`,
        description: `Anomaly detection system identified suspicious activity: ${anomaly.description}. Score: ${anomaly.score}, Threshold: ${anomaly.threshold}`,
        severity,
        source: 'anomaly_detection',
        type: anomaly.type,
        entityId: anomaly.entityId,
        eventIds: [anomaly.eventId],
        timestamp: anomaly.timestamp,
        payload: {
          anomalyId: anomaly.id,
          anomalyType: anomaly.type,
          anomalySubType: anomaly.subType,
          score: anomaly.score,
          threshold: anomaly.threshold,
          details: anomaly.details
        }
      });
    } catch (error) {
      this.logger.error(
        `Error generating alert for anomaly: ${error.message}`,
        error.stack,
        'AnomalyService'
      );
    }
  }

  async create(createAnomalyDto: CreateAnomalyDto): Promise<Anomaly> {
    const anomaly = new this.anomalyModel(createAnomalyDto);
    return anomaly.save();
  }

  async findAll(query: any = {}): Promise<{
    data: Anomaly[];
    total: number;
    page: number;
    limit: number;
  }> {
    const {
      type,
      subType,
      entityId,
      minScore,
      maxScore,
      startDate,
      endDate,
      page = 1,
      limit = 50,
      sort = 'timestamp',
      order = 'desc',
    } = query;

    // Build filter
    const filter: any = {};

    if (type) {
      filter.type = Array.isArray(type) ? { $in: type } : type;
    }

    if (subType) {
      filter.subType = Array.isArray(subType) ? { $in: subType } : subType;
    }

    if (entityId) {
      filter.entityId = entityId;
    }

    // Score range
    if (minScore !== undefined || maxScore !== undefined) {
      filter.score = {};
      if (minScore !== undefined) {
        filter.score.$gte = Number(minScore);
      }
      if (maxScore !== undefined) {
        filter.score.$lte = Number(maxScore);
      }
    }

    // Date range
    if (startDate || endDate) {
      filter.timestamp = {};
      if (startDate) {
        filter.timestamp.$gte = new Date(startDate);
      }
      if (endDate) {
        filter.timestamp.$lte = new Date(endDate);
      }
    }

    // Calculate pagination
    const skip = (Number(page) - 1) * Number(limit);
    const sortOption = { [sort]: order === 'asc' ? 1 : -1 };

    // Execute query
    const [data, total] = await Promise.all([
      this.anomalyModel
        .find(filter)
        .sort(sortOption)
        .skip(skip)
        .limit(Number(limit))
        .exec(),
      this.anomalyModel.countDocuments(filter),
    ]);

    return {
      data,
      total,
      page: Number(page),
      limit: Number(limit),
    };
  }

  async findOne(id: string): Promise<Anomaly> {
    return this.anomalyModel.findById(id).exec();
  }

  async update(id: string, updateAnomalyDto: UpdateAnomalyDto): Promise<Anomaly> {
    return this.anomalyModel
      .findByIdAndUpdate(id, updateAnomalyDto, { new: true })
      .exec();
  }

  async remove(id: string): Promise<void> {
    await this.anomalyModel.findByIdAndDelete(id).exec();
  }

  async getAnomalyStatistics(startDate?: Date, endDate?: Date): Promise<any> {
    const dateFilter: any = {};
    if (startDate || endDate) {
      dateFilter.timestamp = {};
      if (startDate) {
        dateFilter.timestamp.$gte = startDate;
      }
      if (endDate) {
        dateFilter.timestamp.$lte = endDate;
      }
    }

    const [
      total,
      byType,
      bySubType,
      scoreDistribution,
      topEntities
    ] = await Promise.all([
      // Total count
      this.anomalyModel.countDocuments(dateFilter),

      // Count by type
      this.anomalyModel.aggregate([
        { $match: dateFilter },
        { $group: { _id: '$type', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ]),

      // Count by subType
      this.anomalyModel.aggregate([
        { $match: dateFilter },
        { $group: { _id: { type: '$type', subType: '$subType' }, count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ]),

      // Score distribution
      this.anomalyModel.aggregate([
        { $match: dateFilter },
        {
          $group: {
            _id: {
              $switch: {
                branches: [
                  { case: { $lte: ['$score', 0.2] }, then: '0.0-0.2' },
                  { case: { $lte: ['$score', 0.4] }, then: '0.2-0.4' },
                  { case: { $lte: ['$score', 0.6] }, then: '0.4-0.6' },
                  { case: { $lte: ['$score', 0.8] }, then: '0.6-0.8' },
                ],
                default: '0.8-1.0'
              }
            },
            count: { $sum: 1 },
            avgScore: { $avg: '$score' }
          }
        },
        { $sort: { _id: 1 } }
      ]),

      // Top entities with anomalies
      this.anomalyModel.aggregate([
        { $match: { ...dateFilter, entityId: { $exists: true, $ne: null } } },
        { $group: { _id: '$entityId', count: { $sum: 1 }, avgScore: { $avg: '$score' } } },
        { $sort: { count: -1 } },
        { $limit: 10 }
      ])
    ]);

    return {
      total,
      byType: byType.map(item => ({
        type: item._id,
        count: item.count
      })),
      bySubType: bySubType.map(item => ({
        type: item._id.type,
        subType: item._id.subType,
        count: item.count
      })),
      scoreDistribution: scoreDistribution.map(item => ({
        range: item._id,
        count: item.count,
        avgScore: item.avgScore
      })),
      topEntities: topEntities.map(item => ({
        entityId: item._id,
        count: item.count,
        avgScore: item.avgScore
      }))
    };
  }

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async updateBaselines() {
    try {
      this.logger.log('Updating anomaly detection baselines', 'AnomalyService');
      await this.anomalyBaselineService.updateBaselines();
    } catch (error) {
      this.logger.error(
        `Error updating baselines: ${error.message}`,
        error.stack,
        'AnomalyService'
      );
    }
  }
}