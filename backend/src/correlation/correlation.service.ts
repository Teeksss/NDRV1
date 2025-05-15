import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { CorrelationRule, CorrelationRuleDocument } from './schemas/correlation-rule.schema';
import { CreateCorrelationRuleDto } from './dto/create-correlation-rule.dto';
import { UpdateCorrelationRuleDto } from './dto/update-correlation-rule.dto';
import { QueryCorrelationRuleDto } from './dto/query-correlation-rule.dto';
import { AlertsService } from '../alerts/alerts.service';
import { EventsService } from '../events/events.service';
import { EntitiesService } from '../entities/entities.service';
import { LoggerService } from '../logger/logger.service';
import { WebsocketGateway } from '../websocket/websocket.gateway';
import { RuleEvaluatorService } from './helpers/rule-evaluator.service';
import { ConditionBuilderService } from './helpers/condition-builder.service';
import { CORRELATION_RULE_TYPES, CORRELATION_RULE_CATEGORIES } from './constants/correlation.constants';

@Injectable()
export class CorrelationService {
  constructor(
    @InjectModel(CorrelationRule.name) private correlationRuleModel: Model<CorrelationRuleDocument>,
    private alertsService: AlertsService,
    private eventsService: EventsService,
    private entitiesService: EntitiesService,
    private eventEmitter: EventEmitter2,
    private logger: LoggerService,
    private websocketGateway: WebsocketGateway,
    private ruleEvaluatorService: RuleEvaluatorService,
    private conditionBuilderService: ConditionBuilderService
  ) {}

  async create(createRuleDto: CreateCorrelationRuleDto, userId: string): Promise<CorrelationRule> {
    try {
      // Validate rule type
      if (!CORRELATION_RULE_TYPES.includes(createRuleDto.type)) {
        throw new BadRequestException(`Invalid rule type: ${createRuleDto.type}`);
      }

      // Check for duplicate rule name
      const existingRule = await this.correlationRuleModel.findOne({ name: createRuleDto.name }).exec();
      if (existingRule) {
        throw new BadRequestException(`Rule with name '${createRuleDto.name}' already exists`);
      }

      // Validate conditions
      this.validateConditions(createRuleDto.conditions);

      // Create new rule
      const newRule = new this.correlationRuleModel({
        ...createRuleDto,
        createdBy: userId,
        updatedBy: userId,
      });

      // Add entry to rule history
      newRule.history = [{
        action: 'created',
        timestamp: new Date(),
        user: userId,
        details: { rule: createRuleDto }
      }];

      const savedRule = await newRule.save();
      this.logger.log(`Correlation rule created: ${savedRule.id}`, 'CorrelationService');

      // Emit event for correlation engine to pick up the new rule
      this.eventEmitter.emit('correlation.rule.created', savedRule);

      return savedRule;
    } catch (error) {
      this.logger.error(`Failed to create correlation rule: ${error.message}`, error.stack, 'CorrelationService');
      
      if (error instanceof BadRequestException) {
        throw error;
      }
      
      throw new BadRequestException(`Failed to create correlation rule: ${error.message}`);
    }
  }

  async findAll(query: QueryCorrelationRuleDto = {}): Promise<{
    data: CorrelationRule[];
    total: number;
    page: number;
    limit: number;
  }> {
    const {
      name,
      enabled,
      type,
      severity,
      tags,
      category,
      search,
      sort = 'name',
      order = 'asc',
      page = 1,
      limit = 50,
    } = query;

    // Build filter
    const filter: any = {};

    if (name) {
      filter.name = { $regex: name, $options: 'i' };
    }

    if (enabled !== undefined) {
      filter.enabled = enabled === 'true' || enabled === true;
    }

    if (type) {
      filter.type = Array.isArray(type) ? { $in: type } : type;
    }

    if (severity) {
      filter.severity = Array.isArray(severity) ? { $in: severity } : severity;
    }

    if (category) {
      filter.category = Array.isArray(category) ? { $in: category } : category;
    }

    if (tags) {
      const tagArray = Array.isArray(tags) ? tags : [tags];
      filter.tags = { $in: tagArray };
    }

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }

    // Calculate pagination
    const skip = (page - 1) * limit;
    const sortOption = { [sort]: order === 'asc' ? 1 : -1 };

    // Execute query
    const [data, total] = await Promise.all([
      this.correlationRuleModel
        .find(filter)
        .sort(sortOption)
        .skip(skip)
        .limit(limit)
        .exec(),
      this.correlationRuleModel.countDocuments(filter).exec(),
    ]);

    return {
      data,
      total,
      page: Number(page),
      limit: Number(limit),
    };
  }

  async findOne(id: string): Promise<CorrelationRule> {
    const rule = await this.correlationRuleModel.findById(id).exec();
    
    if (!rule) {
      throw new NotFoundException(`Correlation rule with ID ${id} not found`);
    }
    
    return rule;
  }

  async update(id: string, updateRuleDto: UpdateCorrelationRuleDto, userId: string): Promise<CorrelationRule> {
    // Check if rule exists
    const rule = await this.findOne(id);
    
    // Validate rule type if provided
    if (updateRuleDto.type && !CORRELATION_RULE_TYPES.includes(updateRuleDto.type)) {
      throw new BadRequestException(`Invalid rule type: ${updateRuleDto.type}`);
    }

    // Check rule name uniqueness if changing name
    if (updateRuleDto.name && updateRuleDto.name !== rule.name) {
      const existingRule = await this.correlationRuleModel
        .findOne({ name: updateRuleDto.name, _id: { $ne: id } })
        .exec();
      
      if (existingRule) {
        throw new BadRequestException(`Rule with name '${updateRuleDto.name}' already exists`);
      }
    }

    // Validate conditions if provided
    if (updateRuleDto.conditions) {
      this.validateConditions(updateRuleDto.conditions);
    }
    
    // Update rule
    const updates = {
      ...updateRuleDto,
      updatedBy: userId,
    };
    
    // Add entry to rule history
    if (!rule.history) rule.history = [];
    rule.history.push({
      action: 'updated',
      timestamp: new Date(),
      user: userId,
      details: { changes: updateRuleDto }
    });
    
    updates.history = rule.history;
    
    const updatedRule = await this.correlationRuleModel
      .findByIdAndUpdate(id, updates, { new: true })
      .exec();
    
    if (!updatedRule) {
      throw new NotFoundException(`Correlation rule with ID ${id} not found`);
    }
    
    this.logger.log(`Correlation rule updated: ${updatedRule.id}`, 'CorrelationService');
    
    // Emit event for correlation engine to update the rule
    this.eventEmitter.emit('correlation.rule.updated', updatedRule);
    
    return updatedRule;
  }

  async toggleRuleStatus(id: string, enabled: boolean, userId: string): Promise<CorrelationRule> {
    const rule = await this.findOne(id);
    
    // Don't update if already in the desired state
    if (rule.enabled === enabled) {
      return rule;
    }
    
    // Add entry to rule history
    if (!rule.history) rule.history = [];
    rule.history.push({
      action: enabled ? 'enabled' : 'disabled',
      timestamp: new Date(),
      user: userId,
      details: { enabled }
    });
    
    const updatedRule = await this.correlationRuleModel
      .findByIdAndUpdate(
        id,
        {
          enabled,
          updatedBy: userId,
          history: rule.history
        },
        { new: true }
      )
      .exec();
    
    if (!updatedRule) {
      throw new NotFoundException(`Correlation rule with ID ${id} not found`);
    }
    
    this.logger.log(`Correlation rule ${enabled ? 'enabled' : 'disabled'}: ${id}`, 'CorrelationService');
    
    // Emit event for correlation engine to update the rule
    this.eventEmitter.emit('correlation.rule.statusChanged', {
      rule: updatedRule,
      enabled
    });
    
    return updatedRule;
  }

  async remove(id: string): Promise<void> {
    const rule = await this.findOne(id);
    
    await this.correlationRuleModel.deleteOne({ _id: id }).exec();
    
    this.logger.log(`Correlation rule deleted: ${id}`, 'CorrelationService');
    
    // Emit event for correlation engine to remove the rule
    this.eventEmitter.emit('correlation.rule.deleted', { id, rule });
  }

  async simulateRule(id: string, eventData: any): Promise<any> {
    // Get the rule
    const rule = await this.findOne(id);
    
    if (!rule) {
      throw new NotFoundException(`Correlation rule with ID ${id} not found`);
    }
    
    // Create simulation context
    const context = {
      currentEvent: eventData,
      relatedEvents: [],
      timestamp: new Date(),
      simulation: true
    };
    
    // Evaluate rule
    try {
      const result = await this.ruleEvaluatorService.evaluateRule(rule, context);
      
      return {
        ruleId: rule.id,
        ruleName: rule.name,
        matched: result.matched,
        details: result.details,
        timestamp: new Date()
      };
    } catch (error) {
      this.logger.error(`Error simulating rule ${id}: ${error.message}`, error.stack, 'CorrelationService');
      throw new BadRequestException(`Error simulating rule: ${error.message}`);
    }
  }

  async validateRule(ruleDefinition: CreateCorrelationRuleDto): Promise<any> {
    try {
      // Validate rule type
      if (!CORRELATION_RULE_TYPES.includes(ruleDefinition.type)) {
        return {
          valid: false,
          errors: [{
            field: 'type',
            message: `Invalid rule type: ${ruleDefinition.type}`
          }]
        };
      }
      
      // Validate conditions
      try {
        this.validateConditions(ruleDefinition.conditions);
      } catch (error) {
        return {
          valid: false,
          errors: [{
            field: 'conditions',
            message: error.message
          }]
        };
      }
      
      // Check rule name uniqueness
      if (ruleDefinition.name) {
        const existingRule = await this.correlationRuleModel
          .findOne({ name: ruleDefinition.name })
          .exec();
        
        if (existingRule) {
          return {
            valid: false,
            errors: [{
              field: 'name',
              message: `Rule with name '${ruleDefinition.name}' already exists`
            }]
          };
        }
      }
      
      // All validations passed
      return {
        valid: true,
        errors: []
      };
    } catch (error) {
      this.logger.error(`Error validating rule: ${error.message}`, error.stack, 'CorrelationService');
      return {
        valid: false,
        errors: [{
          field: 'general',
          message: `Validation error: ${error.message}`
        }]
      };
    }
  }

  async importRules(rules: CreateCorrelationRuleDto[], userId: string): Promise<any> {
    const results = {
      total: rules.length,
      imported: 0,
      failed: 0,
      details: []
    };
    
    for (const rule of rules) {
      try {
        // Validate the rule
        const validation = await this.validateRule(rule);
        
        if (!validation.valid) {
          results.failed++;
          results.details.push({
            name: rule.name,
            success: false,
            errors: validation.errors
          });
          continue;
        }
        
        // Create the rule
        const newRule = await this.create(rule, userId);
        
        results.imported++;
        results.details.push({
          name: rule.name,
          success: true,
          id: newRule.id
        });
      } catch (error) {
        results.failed++;
        results.details.push({
          name: rule.name,
          success: false,
          errors: [{ message: error.message }]
        });
      }
    }
    
    this.logger.log(`Imported ${results.imported}/${results.total} correlation rules`, 'CorrelationService');
    
    return results;
  }

  async exportRules(query: QueryCorrelationRuleDto = {}): Promise<any> {
    const { data } = await this.findAll(query);
    
    // Format rules for export, removing internal fields
    const exportedRules = data.map(rule => ({
      name: rule.name,
      description: rule.description,
      type: rule.type,
      enabled: rule.enabled,
      severity: rule.severity,
      category: rule.category,
      timeWindow: rule.timeWindow,
      eventTypes: rule.eventTypes,
      conditions: rule.conditions,
      actions: rule.actions,
      threshold: rule.threshold,
      tags: rule.tags,
      metadata: rule.metadata,
      tactic: rule.tactic,
      technique: rule.technique,
    }));
    
    return {
      timestamp: new Date(),
      rules: exportedRules,
      count: exportedRules.length
    };
  }

  getCategories(): string[] {
    return CORRELATION_RULE_CATEGORIES;
  }

  getTypes(): string[] {
    return CORRELATION_RULE_TYPES;
  }

  private validateConditions(conditions: any[]): void {
    if (!conditions || !Array.isArray(conditions)) {
      throw new BadRequestException('Conditions must be an array');
    }
    
    if (conditions.length === 0) {
      throw new BadRequestException('At least one condition is required');
    }
    
    for (const condition of conditions) {
      if (!condition.field) {
        throw new BadRequestException('Condition field is required');
      }
      
      if (!condition.operator) {
        throw new BadRequestException('Condition operator is required');
      }
      
      // Validate operator
      if (!this.conditionBuilderService.isValidOperator(condition.operator)) {
        throw new BadRequestException(`Invalid operator: ${condition.operator}`);
      }
      
      // Validate value based on operator
      if (condition.operator !== 'exists' && condition.operator !== 'notExists' && condition.value === undefined) {
        throw new BadRequestException(`Value is required for operator: ${condition.operator}`);
      }
    }
  }
}