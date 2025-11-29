// backend/utils/dbManager.js
// Database manager for agents to interact with MongoDB

const Entity = require('../models/Entity');
const MetricsLog = require('../models/MetricsLog');
const AgentActivity = require('../models/AgentActivity');
const { getConnectionStatus } = require('../config/database');

class DatabaseManager {
  constructor() {
    this.isConnected = getConnectionStatus;
  }

  // ==================== ENTITY OPERATIONS ====================

  async getAllHospitals() {
    try {
      return await Entity.find({ entityType: 'hospital', status: 'active' }).lean();
    } catch (error) {
      console.error('Error fetching hospitals:', error);
      return [];
    }
  }

  async getAllLabs() {
    try {
      return await Entity.find({ entityType: 'lab', status: 'active' }).lean();
    } catch (error) {
      console.error('Error fetching labs:', error);
      return [];
    }
  }

  async getAllPharmacies() {
    try {
      return await Entity.find({ entityType: 'pharmacy', status: 'active' }).lean();
    } catch (error) {
      console.error('Error fetching pharmacies:', error);
      return [];
    }
  }

  async getAllSuppliers() {
    try {
      return await Entity.find({ entityType: 'supplier', status: 'active' }).lean();
    } catch (error) {
      console.error('Error fetching suppliers:', error);
      return [];
    }
  }

  async getEntityById(entityId) {
    try {
      return await Entity.findById(entityId);
    } catch (error) {
      console.error(`Error fetching entity ${entityId}:`, error);
      return null;
    }
  }

  async getEntitiesByZone(zone, entityType = null) {
    try {
      const query = { zone, status: 'active' };
      if (entityType) query.entityType = entityType;
      return await Entity.find(query).lean();
    } catch (error) {
      console.error(`Error fetching entities in zone ${zone}:`, error);
      return [];
    }
  }

  // ==================== UPDATE OPERATIONS ====================

  async updateEntityState(entityId, currentState) {
    try {
      const entity = await Entity.findByIdAndUpdate(
        entityId,
        { 
          $set: { 
            currentState,
            lastActive: Date.now()
          } 
        },
        { new: true, runValidators: true }
      );

      if (entity) {
        // Also log to metrics
        await this.logMetrics(entityId, entity.entityType, entity.zone, currentState);
      }

      return entity;
    } catch (error) {
      console.error(`Error updating entity ${entityId}:`, error);
      return null;
    }
  }

  async updateEntityField(entityId, field, value) {
    try {
      const update = { 
        [`currentState.${field}`]: value,
        lastActive: Date.now()
      };
      
      return await Entity.findByIdAndUpdate(
        entityId,
        { $set: update },
        { new: true }
      );
    } catch (error) {
      console.error(`Error updating ${field} for ${entityId}:`, error);
      return null;
    }
  }

  // ==================== METRICS LOGGING ====================

  async logMetrics(entityId, entityType, zone, data, meta = {}) {
    try {
      return await MetricsLog.create({
        timestamp: Date.now(),
        entityId: entityId.toString(),
        entityType,
        zone,
        data,
        meta
      });
    } catch (error) {
      console.error('Error logging metrics:', error);
      return null;
    }
  }

  async getRecentMetrics(entityId, hours = 24) {
    try {
      return await MetricsLog.getRecent(entityId.toString(), hours);
    } catch (error) {
      console.error(`Error fetching metrics for ${entityId}:`, error);
      return [];
    }
  }

  // ==================== AGENT ACTIVITY LOGGING ====================

  async logActivity(agentType, entityId, action, message, metadata = {}, severity = 'info') {
    try {
      return await AgentActivity.create({
        timestamp: Date.now(),
        agentType,
        entityId: entityId ? entityId.toString() : null,
        action,
        message,
        metadata,
        severity
      });
    } catch (error) {
      console.error('Error logging activity:', error);
      return null;
    }
  }

  // ==================== AGGREGATION QUERIES ====================

  async getCityWideSummary() {
    try {
      const [hospitals, labs, pharmacies, suppliers] = await Promise.all([
        this.getAllHospitals(),
        this.getAllLabs(),
        this.getAllPharmacies(),
        this.getAllSuppliers()
      ]);

      // Calculate totals
      let totalBeds = 0, usedBeds = 0;
      hospitals.forEach(h => {
        if (h.currentState?.beds) {
          Object.values(h.currentState.beds).forEach(bedType => {
            totalBeds += bedType.total || 0;
            usedBeds += bedType.used || 0;
          });
        }
      });

      return {
        hospitals: hospitals.length,
        labs: labs.length,
        pharmacies: pharmacies.length,
        suppliers: suppliers.length,
        totalBeds,
        usedBeds,
        bedOccupancy: totalBeds > 0 ? (usedBeds / totalBeds) * 100 : 0
      };
    } catch (error) {
      console.error('Error getting city-wide summary:', error);
      return null;
    }
  }

  async getZoneStatistics(zone) {
    try {
      const entities = await this.getEntitiesByZone(zone);
      
      const byType = {
        hospitals: entities.filter(e => e.entityType === 'hospital'),
        labs: entities.filter(e => e.entityType === 'lab'),
        pharmacies: entities.filter(e => e.entityType === 'pharmacy')
      };

      return {
        zone,
        totalEntities: entities.length,
        ...byType,
        counts: {
          hospitals: byType.hospitals.length,
          labs: byType.labs.length,
          pharmacies: byType.pharmacies.length
        }
      };
    } catch (error) {
      console.error(`Error getting zone statistics for ${zone}:`, error);
      return null;
    }
  }

  // ==================== HELPER METHODS ====================

  formatEntityForWorldState(entity) {
    // Convert MongoDB entity back to worldState format for compatibility
    return {
      id: entity._id.toString(),
      name: entity.name,
      type: entity.profile?.type,
      zone: entity.zone,
      address: entity.address,
      coordinates: entity.coordinates,
      ...entity.profile,
      ...entity.currentState
    };
  }

  async buildWorldStateFromDB() {
    // Build a worldState-like object from database for backward compatibility
    try {
      const [hospitals, labs, pharmacies, suppliers] = await Promise.all([
        this.getAllHospitals(),
        this.getAllLabs(),
        this.getAllPharmacies(),
        this.getAllSuppliers()
      ]);

      const convertToObject = (arr) => {
        const obj = {};
        arr.forEach((item, index) => {
          const key = `${item.entityType.charAt(0).toUpperCase()}${index + 1}`;
          obj[key] = this.formatEntityForWorldState(item);
        });
        return obj;
      };

      // Calculate city-level aggregates
      const summary = await this.getCityWideSummary();
      
      // Build zones with entity counts
      const zones = {};
      const zoneNames = ['Zone-1', 'Zone-2', 'Zone-3', 'Zone-4'];
      
      for (const zoneName of zoneNames) {
        const zoneHospitals = hospitals.filter(h => h.zone === zoneName).map(h => h._id.toString());
        const zoneLabs = labs.filter(l => l.zone === zoneName).map(l => l._id.toString());
        const zonePharmacies = pharmacies.filter(p => p.zone === zoneName).map(p => p._id.toString());
        
        zones[zoneName] = {
          name: zoneName,
          population: 400000, // Default population
          area: "35 sq km",
          hospitals: zoneHospitals,
          labs: zoneLabs,
          pharmacies: zonePharmacies,
          coordinates: { lat: 19.0760, lng: 72.8777 } // Default Mumbai center
        };
      }
      
      // Build city object
      const city = {
        name: 'Mumbai Healthcare System',
        totalResources: {
          beds: {
            total: summary?.totalBeds || 0,
            available: (summary?.totalBeds || 0) - (summary?.usedBeds || 0)
          },
          hospitals: summary?.hospitals || 0,
          labs: summary?.labs || 0,
          pharmacies: summary?.pharmacies || 0
        },
        activeAlerts: [],
        diseaseStats: {
          dengue: { activeCases: 0, newToday: 0, trend: 'stable' },
          malaria: { activeCases: 0, newToday: 0, trend: 'stable' },
          covid: { activeCases: 0, newToday: 0, trend: 'stable' },
          typhoid: { activeCases: 0, newToday: 0, trend: 'stable' },
          influenza: { activeCases: 0, newToday: 0, trend: 'stable' }
        },
        zones
      };

      return {
        hospitals: convertToObject(hospitals),
        labs: convertToObject(labs),
        pharmacies: convertToObject(pharmacies),
        suppliers: convertToObject(suppliers),
        city
      };
    } catch (error) {
      console.error('Error building world state from DB:', error);
      return { 
        hospitals: {}, 
        labs: {}, 
        pharmacies: {}, 
        suppliers: {},
        city: { name: 'Mumbai Healthcare System', totalResources: {}, activeAlerts: [], diseaseStats: {} }
      };
    }
  }
}

// Export singleton instance
const dbManager = new DatabaseManager();
module.exports = dbManager;

