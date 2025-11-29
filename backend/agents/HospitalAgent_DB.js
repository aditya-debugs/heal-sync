// backend/agents/HospitalAgent_DB.js - MongoDB Version
const { subscribe, publish } = require('../eventBus');
const EVENTS = require('../constants/events');
const dbManager = require('../utils/dbManager');
const Entity = require('../models/Entity');

class HospitalAgent {
  constructor(entityId, log) {
    this.entityId = entityId;
    this.log = log;
    this.entity = null;

    // Listen to Lab outbreak events for all diseases
    subscribe('DENGUE_OUTBREAK_PREDICTED', this.onOutbreakAlert.bind(this, 'dengue'));
    subscribe('MALARIA_OUTBREAK_PREDICTED', this.onOutbreakAlert.bind(this, 'malaria'));
    subscribe('TYPHOID_OUTBREAK_PREDICTED', this.onOutbreakAlert.bind(this, 'typhoid'));
    subscribe('INFLUENZA_OUTBREAK_PREDICTED', this.onOutbreakAlert.bind(this, 'influenza'));
    subscribe('COVID_OUTBREAK_PREDICTED', this.onOutbreakAlert.bind(this, 'covid'));
  }

  async start() {
    // Load hospital data from database
    this.entity = await Entity.findById(this.entityId);
    
    if (!this.entity) {
      console.error(`Hospital ${this.entityId} not found in database`);
      return;
    }

    // Initialize current state if not exists
    if (!this.entity.currentState.beds) {
      this.entity.currentState.beds = this.entity.profile.beds;
      this.entity.currentState.equipment = this.entity.profile.equipment;
      this.entity.currentState.patientMetrics = {
        inflowPerHour: 12,
        avgStayDuration: 48,
        dischargesPerDay: 20,
        emergencyCases: 8,
        outpatients: 45,
        admissionsToday: 38,
        erWaitingTime: 30
      };
      this.entity.currentState.diseasePrep = {
        dengue: { prepared: false, wardReady: false, medicineStock: "low", staffAlerted: false },
        malaria: { prepared: false, wardReady: false, medicineStock: "adequate", staffAlerted: false },
        covid: { prepared: true, wardReady: true, medicineStock: "high", staffAlerted: true },
        typhoid: { prepared: false, wardReady: false, medicineStock: "adequate", staffAlerted: false },
        influenza: { prepared: true, wardReady: true, medicineStock: "adequate", staffAlerted: true }
      };
      await this.entity.save();
    }

    this.log(
      `✅ Hospital Agent ${this.entity.name} initialized - Monitoring ${this.getTotalBeds()} beds in ${this.entity.zone}`,
      { agent: 'Hospital', type: 'INIT', entityId: this.entityId.toString() }
    );

    // Runs every 8 seconds
    setInterval(() => this.tick(), 8000);
  }

  async tick() {
    // Reload fresh data from database
    this.entity = await Entity.findById(this.entityId);
    if (!this.entity || !this.entity.currentState.beds) return;

    const state = this.entity.currentState;

    // DYNAMIC SIMULATION: Simulate patient flow naturally
    this.simulatePatientFlow(state);
    
    // DYNAMIC SIMULATION: Simulate equipment usage and degradation
    this.simulateEquipmentUsage(state);

    // Calculate total bed usage across all bed types
    const totalBeds = this.getTotalBeds();
    const usedBeds = this.getUsedBeds();
    
    // Predict future bed needs
    const inflowRate = state.patientMetrics?.inflowPerHour || 12;
    const predictedBeds = usedBeds + (0.5 * inflowRate); // Next 30 minutes
    const occupancy = predictedBeds / totalBeds;
    const occupancyPercent = Math.round(occupancy * 100);

    // ALWAYS log current status (not just problems)
    const status = occupancy > 0.85 ? '🔴 HIGH' : occupancy > 0.7 ? '🟡 MODERATE' : '🟢 NORMAL';
    this.log(
      `${this.entity.name}: ${status} occupancy ${occupancyPercent}% (${usedBeds}/${totalBeds} beds) | ICU: ${state.beds.icu.used}/${state.beds.icu.total} | ER Wait: ${state.patientMetrics.erWaitingTime}min`,
      { agent: 'Hospital', type: 'STATUS', entityId: this.entityId.toString(), occupancy: occupancyPercent }
    );

    // Check for overload risk
    if (occupancy > 0.85) {
      this.log(
        `⚠️ ${this.entity.name}: CAPACITY ALERT! Predicted ${occupancyPercent}% occupancy - Preparing for overflow`,
        { agent: 'Hospital', type: 'OVERLOAD_RISK', entityId: this.entityId.toString(), occupancy }
      );

      publish('HOSPITAL_OVERLOAD_RISK', {
        hospitalId: this.entityId.toString(),
        name: this.entity.name,
        occupancy,
        zone: this.entity.zone,
        predictedBeds: Math.round(predictedBeds),
        totalBeds,
        inflowRate
      });
    }

    // Check equipment status
    this.checkEquipmentStatus(state);
    
    // Check ICU capacity specifically
    this.checkICUCapacity(state);

    // Save updated state to database
    this.entity.markModified('currentState');
    await this.entity.save();
    
    // Log metrics
    await dbManager.logMetrics(
      this.entityId,
      'hospital',
      this.entity.zone,
      {
        beds: state.beds,
        occupancy: occupancyPercent,
        equipment: state.equipment
      }
    );
  }

  simulatePatientFlow(state) {
    const baseArrivalRate = state.patientMetrics?.inflowPerHour || 12;
    
    const randomFactor = 0.6 + (Math.random() * 0.8);
    const tickDuration = 8;
    const arrivalsThisTick = Math.floor((baseArrivalRate / 450) * tickDuration * randomFactor);
    
    if (arrivalsThisTick > 0) {
      const probabilities = {
        general: 0.5,
        icu: 0.1,
        isolation: 0.15,
        pediatric: 0.15,
        maternity: 0.1
      };
      
      for (let i = 0; i < arrivalsThisTick; i++) {
        const rand = Math.random();
        let cumulative = 0;
        
        for (const [bedType, prob] of Object.entries(probabilities)) {
          cumulative += prob;
          if (rand <= cumulative && state.beds[bedType]) {
            if (state.beds[bedType].used < state.beds[bedType].total) {
              state.beds[bedType].used++;
              state.patientMetrics.admissionsToday++;
              break;
            }
          }
        }
      }
    }
    
    const dischargeRate = 0.03 + (Math.random() * 0.02);
    
    Object.keys(state.beds).forEach(bedType => {
      const beds = state.beds[bedType];
      if (beds.used > 0) {
        const discharges = Math.floor(beds.used * dischargeRate);
        if (discharges > 0) {
          beds.used = Math.max(0, beds.used - discharges);
        }
      }
    });
    
    const totalBeds = this.getTotalBeds();
    const usedBeds = this.getUsedBeds();
    const occupancy = usedBeds / totalBeds;
    
    const baseWait = 10;
    state.patientMetrics.erWaitingTime = Math.floor(baseWait + (occupancy * 50));
  }

  simulateEquipmentUsage(state) {
    const equipment = state.equipment;
    
    if (Math.random() < 0.01 && equipment.ventilators.available > 0) {
      equipment.ventilators.available--;
      equipment.ventilators.maintenance = (equipment.ventilators.maintenance || 0) + 1;
      this.log(
        `🔧 ${this.entity.name}: Ventilator requires maintenance - Available: ${equipment.ventilators.available}/${equipment.ventilators.total}`,
        { agent: 'Hospital', type: 'EQUIPMENT_MAINTENANCE', entityId: this.entityId.toString(), equipment: 'ventilator' }
      );
    }
    
    if (Math.random() < 0.05 && (equipment.ventilators.maintenance || 0) > 0) {
      equipment.ventilators.maintenance--;
      equipment.ventilators.available++;
    }
    
    const oxygenConsumption = Math.floor(Math.random() * 3);
    if (equipment.oxygenCylinders.available > oxygenConsumption) {
      equipment.oxygenCylinders.available -= oxygenConsumption;
      equipment.oxygenCylinders.inUse += oxygenConsumption;
    }
    
    if (Math.random() < 0.1) {
      const refillAmount = Math.min(5, equipment.oxygenCylinders.empty || 0);
      equipment.oxygenCylinders.available += refillAmount;
      equipment.oxygenCylinders.empty = Math.max(0, (equipment.oxygenCylinders.empty || 0) - refillAmount);
    }
    
    if ((equipment.oxygenCylinders.inUse || 0) > 0 && Math.random() < 0.15) {
      const emptyAmount = Math.min(2, equipment.oxygenCylinders.inUse);
      equipment.oxygenCylinders.inUse -= emptyAmount;
      equipment.oxygenCylinders.empty = (equipment.oxygenCylinders.empty || 0) + emptyAmount;
    }
    
    if (equipment.ambulances) {
      if (Math.random() < 0.1 && equipment.ambulances.available > 0) {
        equipment.ambulances.available--;
        equipment.ambulances.onRoute = (equipment.ambulances.onRoute || 0) + 1;
      }
      
      if (Math.random() < 0.15 && (equipment.ambulances.onRoute || 0) > 0) {
        equipment.ambulances.onRoute--;
        equipment.ambulances.available++;
      }
    }
  }

  getTotalBeds() {
    return Object.values(this.entity.currentState.beds).reduce((sum, bedType) => sum + (bedType.total || 0), 0);
  }

  getUsedBeds() {
    return Object.values(this.entity.currentState.beds).reduce((sum, bedType) => sum + (bedType.used || 0), 0);
  }

  checkEquipmentStatus(state) {
    const ventilators = state.equipment.ventilators;
    const ventilatorsAvailable = ventilators.available / ventilators.total;
    
    if (ventilatorsAvailable < 0.2) {
      this.log(
        `[Hospital ${this.entity.name}] Critical: Only ${ventilators.available}/${ventilators.total} ventilators available`,
        { agent: 'Hospital', type: 'EQUIPMENT_CRITICAL', entityId: this.entityId.toString(), equipment: 'ventilators' }
      );

      publish('EQUIPMENT_SHORTAGE', {
        hospitalId: this.entityId.toString(),
        zone: this.entity.zone,
        equipment: 'ventilators',
        available: ventilators.available,
        total: ventilators.total
      });
    }
  }

  checkICUCapacity(state) {
    const icu = state.beds.icu;
    const icuOccupancy = icu.used / icu.total;
    
    if (icuOccupancy > 0.8) {
      this.log(
        `[Hospital ${this.entity.name}] ICU capacity critical: ${icu.used}/${icu.total} beds occupied (${Math.round(icuOccupancy * 100)}%)`,
        { agent: 'Hospital', type: 'ICU_CRITICAL', entityId: this.entityId.toString() }
      );
    }
  }

  async onOutbreakAlert(disease, event) {
    // Add staggered delay to prevent parallel saves (increased for 10 hospitals)
    const hospitalIndex = this.entityId.toString().charCodeAt(this.entityId.toString().length - 1) % 10;
    const baseDelay = hospitalIndex * 400; // Stagger by hospital (0-4000ms)
    const randomDelay = Math.random() * 1500; // Additional random (0-1500ms)
    await new Promise(resolve => setTimeout(resolve, baseDelay + randomDelay));
    
    // Reload entity to get latest data
    this.entity = await Entity.findById(this.entityId);
    if (!this.entity) return;

    const state = this.entity.currentState;

    // Only respond if outbreak is in our zone or adjacent
    if (this.entity.zone !== event.zone) return;

    this.log(
      `🏥 ${this.entity.name}: OUTBREAK ALERT RECEIVED for ${disease.toUpperCase()} in ${event.zone}! Activating emergency response`,
      { 
        agent: 'Hospital', 
        type: 'ALERT_RECEIVED', 
        entityId: this.entityId.toString(), 
        disease,
        zone: event.zone
      }
    );

    // Initialize diseasePrep if not exists
    if (!state.diseasePrep) {
      state.diseasePrep = {};
    }
    if (!state.diseasePrep[disease]) {
      state.diseasePrep[disease] = { prepared: false, wardReady: false, medicineStock: "low", staffAlerted: false };
    }

    // Prepare hospital for this disease
    state.diseasePrep[disease].prepared = true;
    state.diseasePrep[disease].staffAlerted = true;
    
    // Prepare isolation ward for infectious diseases
    if (['dengue', 'malaria', 'typhoid', 'covid', 'influenza'].includes(disease)) {
      state.diseasePrep[disease].wardReady = true;
      
      const isolationBeds = state.beds.isolation;
      const bedsToReserve = Math.min(10, isolationBeds.total - isolationBeds.used);
      if (bedsToReserve > 0) {
        isolationBeds.used = Math.min(isolationBeds.total, isolationBeds.used + Math.floor(bedsToReserve / 2));
        
        this.log(
          `🛏️ ${this.entity.name}: Preparing isolation ward for ${disease} - Occupancy increased to ${isolationBeds.used}/${isolationBeds.total} beds`,
          { 
            agent: 'Hospital', 
            type: 'BED_ALLOCATION', 
            entityId: this.entityId.toString(), 
            disease,
            bedsOccupied: isolationBeds.used
          }
        );
      }
      
      const generalBeds = state.beds.general;
      const generalToPrep = Math.min(5, generalBeds.total - generalBeds.used);
      if (generalToPrep > 0) {
        generalBeds.used = Math.min(generalBeds.total, generalBeds.used + generalToPrep);
      }
    }

    this.log(
      `✅ ${this.entity.name}: ${disease.toUpperCase()} ward prepared - Staff alerted, beds reserved, requesting medicine supplies`,
      { 
        agent: 'Hospital', 
        type: 'OUTBREAK_PREP', 
        entityId: this.entityId.toString(), 
        disease,
        riskLevel: event.riskLevel
      }
    );

    // Get pharmacies in this zone from database
    const zonePharmacies = await dbManager.getEntitiesByZone(this.entity.zone, 'pharmacy');
    const pharmacyNames = zonePharmacies.map(p => p.name);

    // Request medicines from pharmacy
    publish('MEDICINE_REQUEST', {
      hospitalId: this.entityId.toString(),
      hospitalName: this.entity.name,
      zone: this.entity.zone,
      disease,
      urgency: event.riskLevel === 'critical' ? 'high' : 'medium',
      estimatedPatients: event.predictedCases || 50
    });

    this.log(
      `📡 ${this.entity.name}: Sending ${disease} medicine request to ${zonePharmacies.length} pharmacies in ${this.entity.zone} (${pharmacyNames.join(', ')})`,
      { 
        agent: 'Hospital', 
        type: 'COORDINATION', 
        entityId: this.entityId.toString(), 
        disease,
        recipients: pharmacyNames
      }
    );

    // Save updated state to database with retry on parallel save error
    this.entity.markModified('currentState');
    try {
      await this.entity.save();
    } catch (error) {
      if (error.name === 'ParallelSaveError') {
        // Wait and retry once
        await new Promise(resolve => setTimeout(resolve, 1000));
        this.entity = await Entity.findById(this.entityId);
        if (this.entity) {
          // Re-apply the changes
          const state = this.entity.currentState;
          if (state.diseasePrep && state.diseasePrep[disease]) {
            state.diseasePrep[disease].prepared = true;
            state.diseasePrep[disease].wardReady = true;
            state.diseasePrep[disease].staffAlerted = true;
          }
          this.entity.markModified('currentState');
          await this.entity.save();
        }
      } else {
        throw error;
      }
    }
  }
}

module.exports = HospitalAgent;

