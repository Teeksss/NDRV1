import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { NetworkEntity } from './entities/network-entity.entity';
import { EntityGroup } from './entities/entity-group.entity';
import { EntityRelationship } from './entities/entity-relationship.entity';
import { ConfigService } from '@nestjs/config';
import { EventEmitter2 } from '@nestjs/event-emitter';

@Injectable()
export class EntityService {
  private readonly logger = new Logger(EntityService.name);

  constructor(
    private configService: ConfigService,
    private eventEmitter: EventEmitter2,
    @InjectModel(NetworkEntity.name) private entityModel: Model<NetworkEntity>,
    @InjectModel(EntityGroup.name) private groupModel: Model<EntityGroup>,
    @InjectModel(EntityRelationship.name) private relationshipModel: Model<EntityRelationship>
  ) {}

  /**
   * Get entities with filters
   */
  async getEntities(filters: any = {}, options: any = {}) {
    try {
      const { limit = 100, skip = 0, sort = { createdAt: -1 } } = options;
      
      return this.entityModel
        .find(filters)
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .exec();
    } catch (error) {
      this.logger.error(`Error getting entities: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Get entity by ID
   */
  async getEntityById(entityId: string) {
    try {
      return this.entityModel.findById(entityId).exec();
    } catch (error) {
      this.logger.error(`Error getting entity by ID: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Create a new entity
   */
  async createEntity(entityData: any) {
    try {
      // Validate required fields
      if (!entityData.name) {
        throw new Error('Entity name is required');
      }
      
      if (!entityData.type) {
        throw new Error('Entity type is required');
      }
      
      // Check if entity with same IP exists
      if (entityData.ipAddress) {
        const existingEntity = await this.entityModel.findOne({ 
          ipAddress: entityData.ipAddress 
        }).exec();
        
        if (existingEntity) {
          throw new Error(`Entity with IP ${entityData.ipAddress} already exists`);
        }
      }
      
      // Set first seen
      entityData.firstSeen = entityData.firstSeen || new Date();
      
      // Create entity
      const entity = await this.entityModel.create({
        ...entityData,
        lastSeen: new Date(),
        createdAt: new Date()
      });
      
      // Emit event
      this.eventEmitter.emit('entity.created', {
        entityId: entity._id,
        type: entity.type,
        name: entity.name,
        ipAddress: entity.ipAddress
      });
      
      return entity;
    } catch (error) {
      this.logger.error(`Error creating entity: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Update entity
   */
  async updateEntity(entityId: string, entityData: any) {
    try {
      // Check if entity with same IP exists (if IP is being changed)
      if (entityData.ipAddress) {
        const existingEntity = await this.entityModel.findOne({ 
          ipAddress: entityData.ipAddress,
          _id: { $ne: entityId }
        }).exec();
        
        if (existingEntity) {
          throw new Error(`Entity with IP ${entityData.ipAddress} already exists`);
        }
      }
      
      // Update entity
      const entity = await this.entityModel.findByIdAndUpdate(
        entityId,
        {
          ...entityData,
          updatedAt: new Date()
        },
        { new: true }
      ).exec();
      
      if (!entity) {
        throw new Error(`Entity not found: ${entityId}`);
      }
      
      // Emit event
      this.eventEmitter.emit('entity.updated', {
        entityId: entity._id,
        type: entity.type,
        name: entity.name,
        ipAddress: entity.ipAddress
      });
      
      return entity;
    } catch (error) {
      this.logger.error(`Error updating entity: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Delete entity
   */
  async deleteEntity(entityId: string) {
    try {
      const entity = await this.entityModel.findByIdAndDelete(entityId).exec();
      
      if (!entity) {
        throw new Error(`Entity not found: ${entityId}`);
      }
      
      // Remove from groups
      await this.groupModel.updateMany(
        { entityIds: entityId },
        { $pull: { entityIds: entityId } }
      ).exec();
      
      // Remove relationships
      await this.relationshipModel.deleteMany({
        $or: [
          { sourceEntityId: entityId },
          { targetEntityId: entityId }
        ]
      }).exec();
      
      // Emit event
      this.eventEmitter.emit('entity.deleted', {
        entityId,
        type: entity.type,
        name: entity.name,
        ipAddress: entity.ipAddress
      });
      
      return { success: true };
    } catch (error) {
      this.logger.error(`Error deleting entity: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Get entity groups
   */
  async getEntityGroups(filters: any = {}) {
    try {
      return this.groupModel.find(filters).exec();
    } catch (error) {
      this.logger.error(`Error getting entity groups: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Create entity group
   */
  async createEntityGroup(groupData: any) {
    try {
      // Validate required fields
      if (!groupData.name) {
        throw new Error('Group name is required');
      }
      
      // Create group
      return this.groupModel.create({
        ...groupData,
        createdAt: new Date()
      });
    } catch (error) {
      this.logger.error(`Error creating entity group: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Update entity group
   */
  async updateEntityGroup(groupId: string, groupData: any) {
    try {
      // Update group
      const group = await this.groupModel.findByIdAndUpdate(
        groupId,
        {
          ...groupData,
          updatedAt: new Date()
        },
        { new: true }
      ).exec();
      
      if (!group) {
        throw new Error(`Group not found: ${groupId}`);
      }
      
      return group;
    } catch (error) {
      this.logger.error(`Error updating entity group: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Delete entity group
   */
  async deleteEntityGroup(groupId: string) {
    try {
      const group = await this.groupModel.findByIdAndDelete(groupId).exec();
      
      if (!group) {
        throw new Error(`Group not found: ${groupId}`);
      }
      
      return { success: true };
    } catch (error) {
      this.logger.error(`Error deleting entity group: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Add entity to group
   */
  async addEntityToGroup(entityId: string, groupId: string) {
    try {
      // Check if entity exists
      const entity = await this.entityModel.findById(entityId).exec();
      
      if (!entity) {
        throw new Error(`Entity not found: ${entityId}`);
      }
      
      // Check if group exists
      const group = await this.groupModel.findById(groupId).exec();
      
      if (!group) {
        throw new Error(`Group not found: ${groupId}`);
      }
      
      // Add entity to group if not already in group
      if (!group.entityIds.includes(entityId)) {
        await this.groupModel.updateOne(
          { _id: groupId },
          { 
            $addToSet: { entityIds: entityId },
            updatedAt: new Date()
          }
        ).exec();
      }
      
      // Add group to entity
      await this.entityModel.updateOne(
        { _id: entityId },
        { 
          $addToSet: { groupIds: groupId },
          updatedAt: new Date()
        }
      ).exec();
      
      return { success: true };
    } catch (error) {
      this.logger.error(`Error adding entity to group: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Remove entity from group
   */
  async removeEntityFromGroup(entityId: string, groupId: string) {
    try {
      // Remove entity from group
      await this.groupModel.updateOne(
        { _id: groupId },
        { 
          $pull: { entityIds: entityId },
          updatedAt: new Date()
        }
      ).exec();
      
      // Remove group from entity
      await this.entityModel.updateOne(
        { _id: entityId },
        { 
          $pull: { groupIds: groupId },
          updatedAt: new Date()
        }
      ).exec();
      
      return { success: true };
    } catch (error) {
      this.logger.error(`Error removing entity from group: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Get entity relationships
   */
  async getRelationships(filters: any = {}) {
    try {
      return this.relationshipModel.find(filters).exec();
    } catch (error) {
      this.logger.error(`Error getting relationships: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Create entity relationship
   */
  async createRelationship(relationshipData: any) {
    try {
      // Validate required fields
      if (!relationshipData.sourceEntityId) {
        throw new Error('Source entity ID is required');
      }
      
      if (!relationshipData.targetEntityId) {
        throw new Error('Target entity ID is required');
      }
      
      if (!relationshipData.type) {
        throw new Error('Relationship type is required');
      }
      
      // Check if custom type is provided for custom relationships
      if (relationshipData.type === 'custom' && !relationshipData.customType) {
        throw new Error('Custom type is required for custom relationships');
      }
      
      // Check if source entity exists
      const sourceEntity = await this.entityModel.findById(relationshipData.sourceEntityId).exec();
      
      if (!sourceEntity) {
        throw new Error(`Source entity not found: ${relationshipData.sourceEntityId}`);
      }
      
      // Check if target entity exists
      const targetEntity = await this.entityModel.findById(relationshipData.targetEntityId).exec();
      
      if (!targetEntity) {
        throw new Error(`Target entity not found: ${relationshipData.targetEntityId}`);
      }
      
      // Create relationship
      return this.relationshipModel.create({
        ...relationshipData,
        createdAt: new Date()
      });
    } catch (error) {
      this.logger.error(`Error creating relationship: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Delete entity relationship
   */
  async deleteRelationship(relationshipId: string) {
    try {
      const relationship = await this.relationshipModel.findByIdAndDelete(relationshipId).exec();
      
      if (!relationship) {
        throw new Error(`Relationship not found: ${relationshipId}`);
      }
      
      return { success: true };
    } catch (error) {
      this.logger.error(`Error deleting relationship: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Update entity last seen
   */
  async updateEntityLastSeen(ipAddress: string) {
    try {
      if (!ipAddress) {
        return null;
      }
      
      // Find entity by IP address
      const entity = await this.entityModel.findOne({ ipAddress }).exec();
      
      if (!entity) {
        return null;
      }
      
      // Update last seen
      await this.entityModel.updateOne(
        { _id: entity._id },
        { 
          lastSeen: new Date(),
          status: 'active'
        }
      ).exec();
      
      return entity;
    } catch (error) {
      this.logger.error(`Error updating entity last seen: ${error.message}`, error.stack);
      return null;
    }
  }

  /**
   * Get entity statistics
   */
  async getStatistics() {
    try {
      // Count total entities
      const totalEntities = await this.entityModel.countDocuments().exec();
      
      // Count by type
      const byType = await this.entityModel.aggregate([
        { $group: { _id: '$type', count: { $sum: 1 } } }
      ]).exec();
      
      // Count by status
      const byStatus = await this.entityModel.aggregate([
        { $group: { _id: '$status', count: { $sum: 1 } } }
      ]).exec();
      
      // Get recently seen entities
      const oneDayAgo = new Date();
      oneDayAgo.setDate(oneDayAgo.getDate() - 1);
      
      const recentlySeen = await this.entityModel
        .find({ lastSeen: { $gte: oneDayAgo } })
        .sort({ lastSeen: -1 })
        .limit(10)
        .exec();
      
      return {
        totalEntities,
        byType: byType.reduce((acc, item) => {
          acc[item._id || 'unknown'] = item.count;
          return acc;
        }, {}),
        byStatus: byStatus.reduce((acc, item) => {
          acc[item._id || 'unknown'] = item.count;
          return acc;
        }, {}),
        recentlySeen
      };
    } catch (error) {
      this.logger.error(`Error getting entity statistics: ${error.message}`, error.stack);
      throw error;
    }
  }
}