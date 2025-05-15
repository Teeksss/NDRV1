async addEventToEntity(id: string, eventId: string): Promise<Entity> {
  try {
    const entity = await this.findOne(id);
    
    // Add event ID if not already present
    const updatedEntity = await this.entityModel
      .findByIdAndUpdate(
        id,
        {
          $addToSet: { eventIds: eventId },
          lastSeen: new Date()
        },
        { new: true }
      )
      .exec();
    
    this.logger.log(`Added event to entity: ${id} - Event: ${eventId}`, 'EntitiesService');
    
    return updatedEntity;
  } catch (error) {
    this.logger.error(`Error adding event to entity ${id}: ${error.message}`, error.stack, 'EntitiesService');
    throw error;
  }
}

  async addAlertToEntity(id: string, alertId: string): Promise<Entity> {
    try {
      const entity = await this.findOne(id);
      
      // Add alert ID if not already present
      const updatedEntity = await this.entityModel
        .findByIdAndUpdate(
          id,
          {
            $addToSet: { alertIds: alertId },
            lastSeen: new Date()
          },
          { new: true }
        )
        .exec();
      
      this.logger.log(`Added alert to entity: ${id} - Alert: ${alertId}`, 'EntitiesService');
      
      return updatedEntity;
    } catch (error) {
      this.logger.error(`Error adding alert to entity ${id}: ${error.message}`, error.stack, 'EntitiesService');
      throw error;
    }
  }

  async addVulnerabilityToEntity(id: string, vulnerabilityData: any): Promise<Entity> {
    try {
      const entity = await this.findOne(id);
      
      // Check if vulnerability with same ID already exists
      const existingVulnerability = entity.vulnerabilities?.find(
        vuln => vuln.id === vulnerabilityData.id
      );
      
      if (existingVulnerability) {
        // Update existing vulnerability
        const updatedEntity = await this.entityModel
          .findOneAndUpdate(
            { 
              _id: id,
              'vulnerabilities.id': vulnerabilityData.id
            },
            {
              $set: {
                'vulnerabilities.$': {
                  ...vulnerabilityData,
                  discoveredAt: existingVulnerability.discoveredAt
                }
              },
              lastSeen: new Date()
            },
            { new: true }
          )
          .exec();
        
        this.logger.log(`Updated vulnerability on entity: ${id} - Vulnerability: ${vulnerabilityData.id}`, 'EntitiesService');
        
        return updatedEntity;
      } else {
        // Add new vulnerability
        const newVulnerability = {
          ...vulnerabilityData,
          discoveredAt: new Date()
        };
        
        const updatedEntity = await this.entityModel
          .findByIdAndUpdate(
            id,
            {
              $push: { vulnerabilities: newVulnerability },
              lastSeen: new Date()
            },
            { new: true }
          )
          .exec();
        
        this.logger.log(`Added vulnerability to entity: ${id} - Vulnerability: ${vulnerabilityData.id}`, 'EntitiesService');
        
        return updatedEntity;
      }
    } catch (error) {
      this.logger.error(`Error adding vulnerability to entity ${id}: ${error.message}`, error.stack, 'EntitiesService');
      throw error;
    }
  }

  async markVulnerabilityAsPatched(id: string, vulnerabilityId: string): Promise<Entity> {
    try {
      const entity = await this.findOne(id);
      
      // Check if vulnerability exists
      const existingVulnerability = entity.vulnerabilities?.find(
        vuln => vuln.id === vulnerabilityId
      );
      
      if (!existingVulnerability) {
        throw new NotFoundException(`Vulnerability with ID ${vulnerabilityId} not found on entity ${id}`);
      }
      
      // Mark vulnerability as patched
      const updatedEntity = await this.entityModel
        .findOneAndUpdate(
          { 
            _id: id,
            'vulnerabilities.id': vulnerabilityId
          },
          {
            $set: {
              'vulnerabilities.$.patched': true,
              'vulnerabilities.$.patchedAt': new Date()
            },
            lastSeen: new Date()
          },
          { new: true }
        )
        .exec();
      
      this.logger.log(`Marked vulnerability as patched: ${id} - Vulnerability: ${vulnerabilityId}`, 'EntitiesService');
      
      return updatedEntity;
    } catch (error) {
      this.logger.error(`Error marking vulnerability as patched ${id}: ${error.message}`, error.stack, 'EntitiesService');
      throw error;
    }
  }

  async addScanResultToEntity(id: string, scanResult: any): Promise<Entity> {
    try {
      const entity = await this.findOne(id);
      
      // Add scan result
      const newScan = {
        ...scanResult,
        timestamp: new Date()
      };
      
      const updatedEntity = await this.entityModel
        .findByIdAndUpdate(
          id,
          {
            $push: { 
              scanHistory: {
                $each: [newScan],
                $position: 0
              }
            },
            lastSeen: new Date()
          },
          { new: true }
        )
        .exec();
      
      this.logger.log(`Added scan result to entity: ${id} - Scan type: ${scanResult.type}`, 'EntitiesService');
      
      return updatedEntity;
    } catch (error) {
      this.logger.error(`Error adding scan result to entity ${id}: ${error.message}`, error.stack, 'EntitiesService');
      throw error;
    }
  }

  async remove(id: string): Promise<void> {
    try {
      const result = await this.entityModel.deleteOne({ _id: id }).exec();
      
      if (result.deletedCount === 0) {
        throw new NotFoundException(`Entity with ID ${id} not found`);
      }
      
      this.logger.log(`Entity deleted: ${id}`, 'EntitiesService');
    } catch (error) {
      this.logger.error(`Error removing entity ${id}: ${error.message}`, error.stack, 'EntitiesService');
      
      if (error instanceof NotFoundException) {
        throw error;
      }
      
      throw new BadRequestException(`Failed to delete entity: ${error.message}`);
    }
  }

  async getEntityStatistics(): Promise<any> {
    try {
      const [
        totalEntities,
        entityCountByType,
        entityCountByStatus,
        riskDistribution,
        vulnerableEntities,
        topVulnerableEntities
      ] = await Promise.all([
        // Total entities
        this.entityModel.countDocuments().exec(),
        
        // Count by type
        this.entityModel.aggregate([
          { $group: { _id: '$type', count: { $sum: 1 } } },
          { $sort: { count: -1 } }
        ]).exec(),
        
        // Count by status
        this.entityModel.aggregate([
          { $group: { _id: '$status', count: { $sum: 1 } } },
          { $sort: { count: -1 } }
        ]).exec(),
        
        // Risk distribution
        this.entityModel.aggregate([
          { 
            $group: { 
              _id: {
                $switch: {
                  branches: [
                    { case: { $lte: ['$riskScore', 20] }, then: 'Very Low (0-20)' },
                    { case: { $lte: ['$riskScore', 40] }, then: 'Low (21-40)' },
                    { case: { $lte: ['$riskScore', 60] }, then: 'Medium (41-60)' },
                    { case: { $lte: ['$riskScore', 80] }, then: 'High (61-80)' },
                  ],
                  default: 'Critical (81-100)'
                }
              }, 
              count: { $sum: 1 } 
            } 
          },
          { $sort: { _id: 1 } }
        ]).exec(),
        
        // Vulnerable entities count
        this.entityModel.countDocuments({
          vulnerabilities: { $exists: true, $ne: [] }
        }).exec(),
        
        // Top vulnerable entities
        this.entityModel.aggregate([
          { $match: { vulnerabilities: { $exists: true, $ne: [] } } },
          { 
            $project: { 
              name: 1, 
              type: 1, 
              ipAddress: 1,
              hostname: 1,
              vulnerabilityCount: { $size: '$vulnerabilities' },
              criticalVulnerabilities: {
                $size: {
                  $filter: {
                    input: '$vulnerabilities',
                    as: 'vuln',
                    cond: { $eq: ['$$vuln.severity', 'critical'] }
                  }
                }
              }
            } 
          },
          { $sort: { criticalVulnerabilities: -1, vulnerabilityCount: -1 } },
          { $limit: 10 }
        ]).exec()
      ]);
      
      return {
        totalEntities,
        byType: entityCountByType.map(item => ({ type: item._id || 'unknown', count: item.count })),
        byStatus: entityCountByStatus.map(item => ({ status: item._id || 'unknown', count: item.count })),
        riskDistribution: riskDistribution.map(item => ({ range: item._id, count: item.count })),
        vulnerableEntities,
        topVulnerableEntities
      };
    } catch (error) {
      this.logger.error(`Error getting entity statistics: ${error.message}`, error.stack, 'EntitiesService');
      throw error;
    }
  }

  async getEntitiesByOperatingSystem(): Promise<any> {
    try {
      const result = await this.entityModel.aggregate([
        { 
          $group: { 
            _id: '$operatingSystem', 
            count: { $sum: 1 } 
          } 
        },
        { $sort: { count: -1 } },
        { $limit: 10 }
      ]).exec();
      
      return result.map(item => ({
        operatingSystem: item._id || 'Unknown',
        count: item.count
      }));
    } catch (error) {
      this.logger.error(`Error getting entities by OS: ${error.message}`, error.stack, 'EntitiesService');
      throw error;
    }
  }

  // Other utility methods

  async findOrCreateByIp(ipAddress: string, entityData: any = {}): Promise<Entity> {
    try {
      // Try to find existing entity
      let entity = await this.entityModel.findOne({ ipAddress }).exec();
      
      // If not found, create new entity
      if (!entity) {
        entity = await this.create({
          name: entityData.name || ipAddress,
          type: entityData.type || 'unknown',
          ipAddress,
          ...entityData
        });
      } else {
        // Update last seen
        entity = await this.entityModel
          .findByIdAndUpdate(
            entity.id,
            { lastSeen: new Date() },
            { new: true }
          )
          .exec();
      }
      
      return entity;
    } catch (error) {
      this.logger.error(`Error finding or creating entity by IP ${ipAddress}: ${error.message}`, error.stack, 'EntitiesService');
      throw error;
    }
  }
}