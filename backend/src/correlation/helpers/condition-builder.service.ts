import { Injectable } from '@nestjs/common';
import { LoggerService } from '../../logger/logger.service';

@Injectable()
export class ConditionBuilderService {
  private validOperators: string[] = [
    'eq', 'neq', 'gt', 'gte', 'lt', 'lte',
    'contains', 'notContains', 'startsWith', 'endsWith',
    'matches', 'in', 'notIn', 'exists', 'notExists'
  ];

  constructor(private logger: LoggerService) {}

  isValidOperator(operator: string): boolean {
    return this.validOperators.includes(operator);
  }

  buildConditionFunction(conditions: any[]): (event: any) => boolean {
    if (!conditions || !Array.isArray(conditions) || conditions.length === 0) {
      return () => false;
    }

    return (event: any) => {
      // Check if we have a logical operator at the root
      if (conditions[0].logic) {
        return this.evaluateLogicalGroup(conditions[0], event);
      }
      
      // Otherwise, evaluate all conditions (implicit AND)
      return conditions.every(condition => this.evaluateCondition(condition, event));
    };
  }

  private evaluateLogicalGroup(group: any, event: any): boolean {
    if (!group.conditions || !Array.isArray(group.conditions)) {
      return false;
    }

    switch (group.logic.toLowerCase()) {
      case 'and':
        return group.conditions.every(condition => {
          if (condition.logic) {
            return this.evaluateLogicalGroup(condition, event);
          }
          return this.evaluateCondition(condition, event);
        });
      case 'or':
        return group.conditions.some(condition => {
          if (condition.logic) {
            return this.evaluateLogicalGroup(condition, event);
          }
          return this.evaluateCondition(condition, event);
        });
      case 'not':
        return !group.conditions.every(condition => {
          if (condition.logic) {
            return this.evaluateLogicalGroup(condition, event);
          }
          return this.evaluateCondition(condition, event);
        });
      default:
        this.logger.warn(`Unknown logical operator: ${group.logic}`, 'ConditionBuilderService');
        return false;
    }
  }

  private evaluateCondition(condition: any, event: any): boolean {
    const { field, operator, value } = condition;
    
    // Get field value
    const fieldValue = this.getFieldValue(event, field);
    
    // Evaluate based on operator
    switch (operator) {
      case 'eq':
        return fieldValue === value;
      case 'neq':
        return fieldValue !== value;
      case 'gt':
        return fieldValue > value;
      case 'gte':
        return fieldValue >= value;
      case 'lt':
        return fieldValue < value;
      case 'lte':
        return fieldValue <= value;
      case 'contains':
        return this.evaluateContains(fieldValue, value);
      case 'notContains':
        return !this.evaluateContains(fieldValue, value);
      case 'startsWith':
        return this.evaluateStartsWith(fieldValue, value);
      case 'endsWith':
        return this.evaluateEndsWith(fieldValue, value);
      case 'matches':
        return this.evaluateMatches(fieldValue, value);
      case 'in':
        return this.evaluateIn(fieldValue, value);
      case 'notIn':
        return !this.evaluateIn(fieldValue, value);
      case 'exists':
        return fieldValue !== undefined && fieldValue !== null;
      case 'notExists':
        return fieldValue === undefined || fieldValue === null;
      default:
        this.logger.warn(`Unknown operator: ${operator}`, 'ConditionBuilderService');
        return false;
    }
  }

  private getFieldValue(obj: any, path: string): any {
    if (!path) return undefined;
    
    const parts = path.split('.');
    let value = obj;
    
    for (const part of parts) {
      if (value === null || value === undefined) {
        return undefined;
      }
      
      value = value[part];
    }
    
    return value;
  }

  private evaluateContains(fieldValue: any, value: any): boolean {
    if (fieldValue === null || fieldValue === undefined) {
      return false;
    }
    
    if (typeof fieldValue === 'string') {
      return fieldValue.includes(value);
    }
    
    if (Array.isArray(fieldValue)) {
      return fieldValue.includes(value);
    }
    
    return false;
  }

  private evaluateStartsWith(fieldValue: any, value: any): boolean {
    if (fieldValue === null || fieldValue === undefined || typeof fieldValue !== 'string') {
      return false;
    }
    
    return fieldValue.startsWith(value);
  }

  private evaluateEndsWith(fieldValue: any, value: any): boolean {
    if (fieldValue === null || fieldValue === undefined || typeof fieldValue !== 'string') {
      return false;
    }
    
    return fieldValue.endsWith(value);
  }

  private evaluateMatches(fieldValue: any, pattern: string): boolean {
    if (fieldValue === null || fieldValue === undefined) {
      return false;
    }
    
    try {
      const regex = new RegExp(pattern);
      return regex.test(String(fieldValue));
    } catch (error) {
      this.logger.error(`Invalid regex pattern: ${pattern}`, error.stack, 'ConditionBuilderService');
      return false;
    }
  }

  private evaluateIn(fieldValue: any, valueList: any[]): boolean {
    if (fieldValue === null || fieldValue === undefined) {
      return false;
    }
    
    if (!Array.isArray(valueList)) {
      return false;
    }
    
    return valueList.includes(fieldValue);
  }
}