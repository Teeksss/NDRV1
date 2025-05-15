import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { LoggerService } from '../logger/logger.service';
import { FlowData, FlowDataDocument } from './schemas/flow-data.schema';
import { TrafficData, TrafficDataDocument } from './schemas/traffic-data.schema';
import { Scan, ScanDocument } from './schemas/scan.schema';
import { WebsocketGateway } from '../websocket/websocket.gateway';

@Injectable()
export class NetworkService {
  constructor(
    @InjectModel(FlowData.name) private flowDataModel: Model<FlowDataDocument>,
    @InjectModel(TrafficData.name) private trafficDataModel: Model<TrafficDataDocument>,
    @InjectModel(Scan.name) private scanModel: Model<ScanDocument>,
    private logger: LoggerService,
    private websocketGateway: WebsocketGateway,
  ) {}

  // Traffic analysis methods
  
  async getBandwidthUsage(startDate?: string, endDate?: string, interval: string = 'hour'): Promise<any> {
    try {
      const start = startDate ? new Date(startDate) : new Date(Date.now() - 24 * 60 * 60 * 1000);
      const end = endDate ? new Date(endDate) : new Date();
      
      // Different interval aggregations
      let timeFormat;
      let groupByInterval;
      
      switch (interval) {
        case 'minute':
          timeFormat = { year: '$year', month: '$month', day: '$day', hour: '$hour', minute: '$minute' };
          groupByInterval = { minute: 1 };
          break;
        case 'hour':
          timeFormat = { year: '$year', month: '$month', day: '$day', hour: '$hour' };
          groupByInterval = { hour: 1 };
          break;
        case 'day':
          timeFormat = { year: '$year', month: '$month', day: '$day' };
          groupByInterval = { day: 1 };
          break;
        case 'week':
          timeFormat = { year: '$year', week: '$week' };
          groupByInterval = { week: 1 };
          break;
        case 'month':
          timeFormat = { year: '$year', month: '$month' };
          groupByInterval = { month: 1 };
          break;
        default:
          timeFormat = { year: '$year', month: '$month', day: '$day', hour: '$hour' };
          groupByInterval = { hour: 1 };
      }
      
      // Aggregate traffic data
      const trafficData = await this.trafficDataModel.aggregate([
        {
          $match: {
            timestamp: { $gte: start, $lte: end }
          }
        },
        {
          $group: {
            _id: {
              interval: timeFormat,
              direction: '$direction'
            },
            bytes: { $sum: '$bytes' },
            packets: { $sum: '$packets' }
          }
        },
        {
          $sort: { '_id.interval': 1 }
        }
      ]);
      
      // Process data for inbound and outbound
      const inbound = [];
      const outbound = [];
      let totalInbound = 0;
      let totalOutbound = 0;
      
      trafficData.forEach(item => {
        const timestamp = this.reconstructTimestamp(item._id.interval);
        
        if (item._id.direction === 'inbound') {
          inbound.push({
            timestamp,
            bytes: item.bytes,
            packets: item.packets
          });
          totalInbound += item.bytes;
        } else if (item._id.direction === 'outbound') {
          outbound.push({
            timestamp,
            bytes: item.bytes,
            packets: item.packets
          });
          totalOutbound += item.bytes;
        }
      });
      
      return {
        inbound,
        outbound,
        totalInbound,
        totalOutbound,
        startDate: start,
        endDate: end,
        interval
      };
    } catch (error) {
      this.logger.error(`Error getting bandwidth usage: ${error.message}`, error.stack, 'NetworkService');
      throw error;
    }
  }

  async getProtocolDistribution(startDate?: string, endDate?: string): Promise<any> {
    try {
      const start = startDate ? new Date(startDate) : new Date(Date.now() - 24 * 60 * 60 * 1000);
      const end = endDate ? new Date(endDate) : new Date();
      
      // Aggregate flow data by protocol
      const protocolData = await this.flowDataModel.aggregate([
        {
          $match: {
            timestamp: { $gte: start, $lte: end }
          }
        },
        {
          $group: {
            _id: '$protocol',
            count: { $sum: 1 },
            bytes: { $sum: '$bytes' }
          }
        },
        {
          $sort: { bytes: -1 }
        }
      ]);
      
      // Format results
      const distribution = protocolData.map(item => ({
        protocol: item._id,
        count: item.count,
        bytes: item.bytes,
        percentage: 0 // Will be calculated next
      }));
      
      // Calculate total bytes for percentage
      const totalBytes = distribution.reduce((sum, item) => sum + item.bytes, 0);
      
      // Calculate percentages
      distribution.forEach(item => {
        item.percentage = totalBytes > 0 ? (item.bytes / totalBytes) * 100 : 0;
      });
      
      return {
        distribution,
        totalBytes,
        startDate: start,
        endDate: end
      };
    } catch (error) {
      this.logger.error(`Error getting protocol distribution: ${error.message}`, error.stack, 'NetworkService');
      throw error;
    }
  }

  async getTopPorts(limit: number = 10, startDate?: string, endDate?: string): Promise<any[]> {
    try {
      const start = startDate ? new Date(startDate) : new Date(Date.now() - 24 * 60 * 60 * 1000);
      const end = endDate ? new Date(endDate) : new Date();
      
      // Aggregate flow data by destination port
      const portData = await this.flowDataModel.aggregate([
        {
          $match: {
            timestamp: { $gte: start, $lte: end },
            destinationPort: { $exists: true, $ne: null }
          }
        },
        {
          $group: {
            _id: {
              port: '$destinationPort',
              protocol: '$protocol'
            },
            count: { $sum: 1 },
            bytes: { $sum: '$bytes' }
          }
        },
        {
          $sort: { count: -1 }
        },
        {
          $limit: limit
        }
      ]);
      
      // Format results
      return portData.map(item => ({
        port: item._id.port,
        protocol: item._id.protocol,
        count: item.count,
        bytes: item.bytes,
        service: this.getServiceByPort(item._id.port, item._id.protocol)
      }));
    } catch (error) {
      this.logger.error(`Error getting top ports: ${error.message}`, error.stack, 'NetworkService');
      throw error;
    }
  }

  async getFlows(query: any = {}): Promise<any[]> {
    try {
      const {
        startDate,
        endDate,
        protocol,
        sourceIp,
        destinationIp,
        limit = 100,
        page = 1,
        sort = 'timestamp',
        order = 'desc'
      } = query;
      
      const filter: any = {};
      
      if (startDate || endDate) {
        filter.timestamp = {};
        if (startDate) {
          filter.timestamp.$gte = new Date(startDate);
        }
        if (endDate) {
          filter.timestamp.$lte = new Date(endDate);
        }
      }
      
      if (protocol) {
        filter.protocol = protocol;
      }
      
      if (sourceIp) {
        filter.sourceIp = sourceIp;
      }
      
      if (destinationIp) {
        filter.destinationIp = destinationIp;
      }
      
      const skip = (page - 1) * limit;
      const sortOptions = { [sort]: order === 'asc' ? 1 : -1 };
      
      return this.flowDataModel
        .find(filter)
        .sort(sortOptions)
        .skip(skip)
        .limit(limit)
        .exec();
    } catch (error) {
      this.logger.error(`Error getting flows: ${error.message}`, error.stack, 'NetworkService');
      throw error;
    }
  }

  async getTopSources(startDate?: string, endDate?: string, limit: number = 10): Promise<any[]> {
    try {
      const start = startDate ? new Date(startDate) : new Date(Date.now() - 24 * 60 * 60 * 1000);
      const end = endDate ? new Date(endDate) : new Date();
      
      // Aggregate flow data by source IP
      const sourceData = await this.flowDataModel.aggregate([
        {
          $match: {
            timestamp: { $gte: start, $lte: end }
          }
        },
        {
          $group: {
            _id: '$sourceIp',
            count: { $sum: 1 },
            bytes: { $sum: '$bytes' },
            protocols: { $addToSet: '$protocol' }
          }
        },
        {
          $sort: { bytes: -1 }
        },
        {
          $limit: limit
        }
      ]);
      
      // Format results
      return sourceData.map(item => ({
        sourceIp: item._id,
        count: item.count,
        bytes: item.bytes,
        protocols: item.protocols,
        location: this.getIpLocation(item._id)
      }));
    } catch (error) {
      this.logger.error(`Error getting top sources: ${error.message}`, error.stack, 'NetworkService');
      throw error;
    }
  }

  async getTopDestinations(startDate?: string, endDate?: string, limit: number = 10): Promise<any[]> {
    try {
      const start = startDate ? new Date(startDate) : new Date(Date.now() - 24 * 60 * 60 * 1000);
      const end = endDate ? new Date(endDate) : new Date();
      
      // Aggregate flow data by destination IP
      const destinationData = await this.flowDataModel.aggregate([
        {
          $match: {
            timestamp: { $gte: start, $lte: end }
          }
        },
        {
          $group: {
            _id: '$destinationIp',
            count: { $sum: 1 },
            bytes: { $sum: '$bytes' },
            ports: { $addToSet: '$destinationPort' }
          }
        },
        {
          $sort: { bytes: -1 }
        },
        {
          $limit: limit
        }
      ]);
      
      // Format results
      return destinationData.map(item => ({
        destinationIp: item._id,
        count: item.count,
        bytes: item.bytes,
        ports: item.ports,
        location: this.getIpLocation(item._id)
      }));
    } catch (error) {
      this.logger.error(`Error getting top destinations: ${error.message}`, error.stack, 'NetworkService');
      throw error;
    }
  }

  async getGeoDistribution(startDate?: string, endDate?: string): Promise<any> {
    try {
      const start = startDate ? new Date(startDate) : new Date(Date.now() - 24 * 60 * 60 * 1000);
      const end = endDate ? new Date(endDate) : new Date();
      
      // Aggregate flow data by country
      const countryData = await this.flowDataModel.aggregate([
        {
          $match: {
            timestamp: { $gte: start, $lte: end },
            'destinationLocation.country': { $exists: true, $ne: null }
          }
        },
        {
          $group: {
            _id: '$destinationLocation.country',
            count: { $sum: 1 },
            bytes: { $sum: '$bytes' }
          }
        },
        {
          $sort: { count: -1 }
        }
      ]);
      
      // Format results
      const countries = countryData.map(item => ({
        country: item._id,
        count: item.count,
        bytes: item.bytes
      }));
      
      // Get flow data for visualization
      const flows = await this.flowDataModel.aggregate([
        {
          $match: {
            timestamp: { $gte: start, $lte: end },
            'sourceLocation.coordinates': { $exists: true },
            'destinationLocation.coordinates': { $exists: true }
          }
        },
        {
          $project: {
            sourceLocation: 1,
            destinationLocation: 1,
            bytes: 1,
            protocol: 1,
            isMalicious: { $ifNull: ['$isMalicious', false] },
            isSuspicious: { $ifNull: ['$isSuspicious', false] }
          }
        },
        {
          $limit: 1000 // Limit to prevent visualization overload
        }
      ]);
      
      return {
        countries,
        flows,
        startDate: start,
        endDate: end
      };
    } catch (error) {
      this.logger.error(`Error getting geo distribution: ${error.message}`, error.stack, 'NetworkService');
      throw error;
    }
  }

  // Network scan methods
  
  async startNetworkScan(scanData: any): Promise<any> {
    try {
      // Create scan record
      const newScan = new this.scanModel({
        type: 'network',
        status: 'pending',
        ipRange: scanData.ipRange,
        options: scanData.options,
        createdBy: scanData.userId,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      
      const savedScan = await newScan.save();
      
      // Start scan asynchronously
      this.executeNetworkScan(savedScan);
      
      return {
        id: savedScan.id,
        status: savedScan.status,
        message: 'Network scan started'
      };
    } catch (error) {
      this.logger.error(`Error starting network scan: ${error.message}`, error.stack, 'NetworkService');
      throw error;
    }
  }

  async startPortScan(scanData: any): Promise<any> {
    try {
      // Create scan record
      const newScan = new this.scanModel({
        type: 'port',
        status: 'pending',
        target: scanData.target,
        portRange: scanData.portRange,
        options: scanData.options,
        createdBy: scanData.userId,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      
      const savedScan = await newScan.save();
      
      // Start scan asynchronously
      this.executePortScan(savedScan);
      
      return {
        id: savedScan.id,
        status: savedScan.status,
        message: 'Port scan started'
      };
    } catch (error) {
      this.logger.error(`Error starting port scan: ${error.message}`, error.stack, 'NetworkService');
      throw error;
    }
  }

  async getScanStatus(id: string): Promise<any> {
    try {
      const scan = await this.scanModel.findById(id).exec();
      
      if (!scan) {
        throw new Error(`Scan with ID ${id} not found`);
      }
      
      return {
        id: scan.id,
        type: scan.type,
        status: scan.status,
        progress: scan.progress,
        createdAt: scan.createdAt,
        updatedAt: scan.updatedAt,
        completedAt: scan.completedAt
      };
    } catch (error) {
      this.logger.error(`Error getting scan status: ${error.message}`, error.stack, 'NetworkService');
      throw error;
    }
  }

  async getScanResults(id: string): Promise<any> {
    try {
      const scan = await this.scanModel.findById(id).exec();
      
      if (!scan) {
        throw new Error(`Scan with ID ${id} not found`);
      }
      
      return {
        id: scan.id,
        type: scan.type,
        status: scan.status,
        results: scan.results,
        createdAt: scan.createdAt,
        completedAt: scan.completedAt
      };
    } catch (error) {
      this.logger.error(`Error getting scan results: ${error.message}`, error.stack, 'NetworkService');
      throw error;
    }
  }

  async getScanHistory(filters: any = {}): Promise<any[]> {
    try {
      const { type, startDate, endDate, limit = 100, page = 1 } = filters;
      
      const filter: any = {};
      
      if (type) {
        filter.type = type;
      }
      
      if (startDate || endDate) {
        filter.createdAt = {};
        if (startDate) {
          filter.createdAt.$gte = new Date(startDate);
        }
        if (endDate) {
          filter.createdAt.$lte = new Date(endDate);
        }
      }
      
      const skip = (page - 1) * limit;
      
      return this.scanModel
        .find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .exec();
    } catch (error) {
      this.logger.error(`Error getting scan history: ${error.message}`, error.stack, 'NetworkService');
      throw error;
    }
  }

  // Topology methods
  
  async getTopology(): Promise<any> {
    try {
      // This would be implemented with actual network discovery data
      // For now, return a mock topology
      return {
        nodes: [
          { id: '1', name: 'Router 1', type: 'router', status: 'active' },
          { id: '2', name: 'Switch 1', type: 'switch', status: 'active' },
          { id: '3', name: 'Server 1', type: 'server', status: 'active' },
          { id: '4', name: 'Server 2', type: 'server', status: 'warning' },
          { id: '5', name: 'Workstation 1', type: 'endpoint', status: 'active' },
          { id: '6', name: 'Workstation 2', type: 'endpoint', status: 'active' },
          { id: '7', name: 'Firewall', type: 'firewall', status: 'active' },
          { id: '8', name: 'Internet Gateway', type: 'router', status: 'active' }
        ],
        links: [
          { source: '8', target: '7', value: 10 },
          { source: '7', target: '1', value: 8 },
          { source: '1', target: '2', value: 5 },
          { source: '2', target: '3', value: 3 },
          { source: '2', target: '4', value: 4 },
          { source: '2', target: '5', value: 2 },
          { source: '2', target: '6', value: 2 }
        ]
      };
    } catch (error) {
      this.logger.error(`Error getting topology: ${error.message}`, error.stack, 'NetworkService');
      throw error;
    }
  }

  // Private helper methods
  
  private async executeNetworkScan(scan: Scan): Promise<void> {
    try {
      // Update scan status
      scan.status = 'running';
      scan.progress = 0;
      await scan.save();
      
      // Notify about scan start
      this.websocketGateway.broadcastToChannel('scans', 'scan_update', {
        id: scan.id,
        status: scan.status,
        progress: scan.progress,
        message: 'Network scan started'
      });
      
      // Mock scan execution with progress updates
      for (let i = 0; i <= 10; i++) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        scan.progress = i * 10;
        await scan.save();
        
        // Send progress update
        this.websocketGateway.broadcastToChannel('scans', 'scan_update', {
          id: scan.id,
          status: scan.status,
          progress: scan.progress
        });
      }
      
      // Generate mock results
      const results = {
        discoveredHosts: 15,
        activeHosts: 12,
        devices: [
          { ip: '192.168.1.1', mac: '00:11:22:33:44:55', type: 'router', status: 'active' },
          { ip: '192.168.1.10', mac: '00:11:22:33:44:56', type: 'server', status: 'active' },
          { ip: '192.168.1.20', mac: '00:11:22:33:44:57', type: 'workstation', status: 'active' }
        ]
      };
      
      // Update scan with results
      scan.status = 'completed';
      scan.progress = 100;
      scan.results = results;
      scan.completedAt = new Date();
      await scan.save();
      
      // Notify about scan completion
      this.websocketGateway.broadcastToChannel('scans', 'scan_complete', {
        id: scan.id,
        status: scan.status,
        results: {
          discoveredHosts: results.discoveredHosts,
          activeHosts: results.activeHosts
        }
      });
    } catch (error) {
      this.logger.error(`Error executing network scan: ${error.message}`, error.stack, 'NetworkService');
      
      // Update scan status to failed
      scan.status = 'failed';
      scan.error = error.message;
      await scan.save();
      
      // Notify about scan failure
      this.websocketGateway.broadcastToChannel('scans', 'scan_error', {
        id: scan.id,
        status: scan.status,
        error: error.message
      });
    }
  }

  private async executePortScan(scan: Scan): Promise<void> {
    try {
      // Update scan status
      scan.status = 'running';
      scan.progress = 0;
      await scan.save();
      
      // Notify about scan start
      this.websocketGateway.broadcastToChannel('scans', 'scan_update', {
        id: scan.id,
        status: scan.status,
        progress: scan.progress,
        message: 'Port scan started'
      });
      
      // Mock scan execution with progress updates
      for (let i = 0; i <= 10; i++) {
        await new Promise(resolve => setTimeout(resolve, 500));
        
        scan.progress = i * 10;
        await scan.save();
        
        // Send progress update
        this.websocketGateway.broadcastToChannel('scans', 'scan_update', {
          id: scan.id,
          status: scan.status,
          progress: scan.progress
        });
      }
      
      // Generate mock results
      const results = {
        openPorts: [
          { port: 22, protocol: 'tcp', service: 'SSH', version: 'OpenSSH 8.2' },
          { port: 80, protocol: 'tcp', service: 'HTTP', version: 'nginx 1.18.0' },
          { port: 443, protocol: 'tcp', service: 'HTTPS', version: 'nginx 1.18.0' }
        ],
        filtered: [
          { port: 21, protocol: 'tcp', state: 'filtered' }
        ],
        closed: 997
      };
      
      // Update scan with results
      scan.status = 'completed';
      scan.progress = 100;
      scan.results = results;
      scan.completedAt = new Date();
      await scan.save();
      
      // Notify about scan completion
      this.websocketGateway.broadcastToChannel('scans', 'scan_complete', {
        id: scan.id,
        status: scan.status,
        results: {
          openPorts: results.openPorts.length,
          filtered: results.filtered.length,
          closed: results.closed
        }
      });
    } catch (error) {
      this.logger.error(`Error executing port scan: ${error.message}`, error.stack, 'NetworkService');
      
      // Update scan status to failed
      scan.status = 'failed';
      scan.error = error.message;
      await scan.save();
      
      // Notify about scan failure
      this.websocketGateway.broadcastToChannel('scans', 'scan_error', {
        id: scan.id,
        status: scan.status,
        error: error.message
      });
    }
  }

  private reconstructTimestamp(intervalData: any): Date {
    const date = new Date();
    
    if (intervalData.year) date.setFullYear(intervalData.year);
    if (intervalData.month) date.setMonth(intervalData.month - 1); // Months are 0-indexed in JS
    if (intervalData.day) date.setDate(intervalData.day);
    if (intervalData.hour) date.setHours(intervalData.hour);
    if (intervalData.minute) date.setMinutes(intervalData.minute);
    else date.setMinutes(0);
    date.setSeconds(0);
    date.setMilliseconds(0);
    
    return date;
  }

  private getServiceByPort(port: number, protocol: string): string {
    // Common port mappings
    const commonPorts: Record<string, string> = {
      '21': 'FTP',
      '22': 'SSH',
      '23': 'Telnet',
      '25': 'SMTP',
      '53': 'DNS',
      '80': 'HTTP',
      '110': 'POP3',
      '143': 'IMAP',
      '443': 'HTTPS',
      '3306': 'MySQL',
      '3389': 'RDP',
      '5432': 'PostgreSQL',
      '8080': 'HTTP-ALT'
    };
    
    return commonPorts[port.toString()] || 'Unknown';
  }

  private getIpLocation(ip: string): any {
    // In a real implementation, this would use a geolocation database or service
    // For now, return mock data
    if (ip.startsWith('192.168.') || ip.startsWith('10.') || ip.startsWith('172.16.')) {
      return {
        country: 'Local',
        city: 'Internal Network',
        coordinates: [0, 0]
      };
    }
    
    // Mock external IP locations
    return {
      country: 'United States',
      city: 'New York',
      coordinates: [-74.006, 40.7128]
    };
  }
}