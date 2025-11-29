// backend/agents/PharmacyAgent_DB.js - MongoDB Version
const { subscribe, publish } = require('../eventBus');
const EVENTS = require('../constants/events');
const dbManager = require('../utils/dbManager');
const Entity = require('../models/Entity');

class PharmacyAgent {
  constructor(entityId, log) {
    this.entityId = entityId;
    this.log = log;
    this.entity = null;

    // Subscribe to outbreak alerts
    subscribe('DENGUE_OUTBREAK_PREDICTED', this.onOutbreakAlert.bind(this, 'dengue', 'dengueMed'));
    subscribe('MALARIA_OUTBREAK_PREDICTED', this.onOutbreakAlert.bind(this, 'malaria', 'chloroquine'));
    subscribe('TYPHOID_OUTBREAK_PREDICTED', this.onOutbreakAlert.bind(this, 'typhoid', 'ceftriaxone'));
    subscribe('INFLUENZA_OUTBREAK_PREDICTED', this.onOutbreakAlert.bind(this, 'influenza', 'oseltamivir'));
    subscribe('COVID_OUTBREAK_PREDICTED', this.onOutbreakAlert.bind(this, 'covid', 'oseltamivir'));
    
    // Subscribe to medicine requests from hospitals
    subscribe('MEDICINE_REQUEST', this.onMedicineRequest.bind(this));
  }

  async start() {
    // Load pharmacy data from database
    this.entity = await Entity.findById(this.entityId);
    
    if (!this.entity) {
      console.error(`Pharmacy ${this.entityId} not found in database`);
      return;
    }

    // Initialize medicines if not exists
    if (!this.entity.currentState.medicines) {
      this.entity.currentState.medicines = {
        dengueMed: { stock: 500, dailyUsage: 30, reorderPoint: 100, criticality: 'high', supplier: 'MedSupply Corp', usagePerDay: 30 },
        chloroquine: { stock: 300, dailyUsage: 20, reorderPoint: 80, criticality: 'high', supplier: 'MedSupply Corp', usagePerDay: 20 },
        paracetamol: { stock: 1000, dailyUsage: 150, reorderPoint: 300, criticality: 'medium', supplier: 'MedSupply Corp', usagePerDay: 150 },
        oseltamivir: { stock: 200, dailyUsage: 15, reorderPoint: 50, criticality: 'high', supplier: 'MedSupply Corp', usagePerDay: 15 },
        ceftriaxone: { stock: 250, dailyUsage: 25, reorderPoint: 70, criticality: 'high', supplier: 'MedSupply Corp', usagePerDay: 25 }
      };
      this.entity.currentState.pendingOrders = [];
      await this.entity.save();
    }

    const medicineCount = Object.keys(this.entity.currentState.medicines || {}).length;
    this.log(
      `✅ Pharmacy Agent ${this.entity.name} initialized - Managing ${medicineCount} medicines in ${this.entity.zone}`,
      { agent: 'Pharmacy', type: 'INIT', entityId: this.entityId.toString() }
    );

    // Runs every 12 seconds
    setInterval(() => this.tick(), 12000);
  }

  async tick() {
    // Reload fresh data from database
    this.entity = await Entity.findById(this.entityId);
    if (!this.entity || !this.entity.currentState.medicines) return;

    const state = this.entity.currentState;

    // Simulate daily medicine consumption
    this.consumeMedicines(state.medicines);

    // Count low stock items
    const lowStockItems = Object.entries(state.medicines).filter(([_, med]) => 
      med.stock <= med.reorderPoint
    ).length;

    // Count pending orders
    const pendingOrders = state.pendingOrders?.length || 0;

    // ALWAYS log current status
    const status = lowStockItems > 0 ? '🟡 MONITORING' : '🟢 NORMAL';
    this.log(
      `${this.entity.name}: ${status} stock levels | ${lowStockItems} items need restock | ${pendingOrders} pending orders`,
      { agent: 'Pharmacy', type: 'STATUS', entityId: this.entityId.toString(), lowStockItems, pendingOrders }
    );

    // Check all medicines for shortage risk
    Object.keys(state.medicines).forEach((medicineName) => {
      this.checkMedicineStock(state, medicineName);
    });

    // Save updated state to database
    this.entity.markModified('currentState');
    await this.entity.save();
    
    // Log metrics
    await dbManager.logMetrics(
      this.entityId,
      'pharmacy',
      this.entity.zone,
      {
        medicines: state.medicines,
        pendingOrders: state.pendingOrders?.length || 0,
        lowStockItems
      }
    );
  }

  consumeMedicines(medicines) {
    Object.entries(medicines).forEach(([medName, medicine]) => {
      if (medicine.usagePerDay && medicine.usagePerDay > 0) {
        let consumptionRate = 0.015; // 1.5% of daily usage
        
        // Random variation
        const randomFactor = 0.8 + (Math.random() * 0.4);
        const consumptionAmount = Math.ceil(medicine.usagePerDay * consumptionRate * randomFactor);
        
        if (medicine.stock > 0) {
          medicine.stock = Math.max(0, medicine.stock - consumptionAmount);
        }
      }
    });
  }

  checkMedicineStock(state, medicineName) {
    const medicine = state.medicines[medicineName];
    if (!medicine) return;

    const stock = medicine.stock;
    const dailyUsage = medicine.dailyUsage || medicine.usagePerDay;
    const reorderPoint = medicine.reorderPoint;
    const daysLeft = dailyUsage > 0 ? stock / dailyUsage : 999;

    if (stock <= reorderPoint) {
      const urgency = daysLeft < 2 ? 'high' : daysLeft < 5 ? 'medium' : 'low';
      
      this.log(
        `⚠️ ${this.entity.name}: ${urgency.toUpperCase()} shortage alert for ${medicineName}! Stock: ${stock} units (~${daysLeft.toFixed(1)} days remaining)`,
        { 
          agent: 'Pharmacy', 
          type: 'MED_SHORTAGE', 
          entityId: this.entityId.toString(), 
          medicine: medicineName,
          urgency,
          criticality: medicine.criticality
        }
      );

      const orderQuantity = this.calculateOrderQuantity(medicine, daysLeft);

      // Add to pending orders if not already there
      if (!state.pendingOrders) state.pendingOrders = [];
      
      if (!state.pendingOrders.some(o => o.medicine === medicineName)) {
        state.pendingOrders.push({
          medicine: medicineName,
          quantity: orderQuantity,
          supplier: medicine.supplier,
          urgency,
          timestamp: new Date().toISOString(),
          status: 'requested'
        });

        this.log(
          `📤 ${this.entity.name}: Placing ${urgency} priority order with ${medicine.supplier} - Ordering ${orderQuantity} units of ${medicineName}`,
          { 
            agent: 'Pharmacy', 
            type: 'ORDER_PLACED', 
            entityId: this.entityId.toString(), 
            medicine: medicineName,
            quantity: orderQuantity,
            supplier: medicine.supplier,
            urgency
          }
        );

        this.log(
          `📡 ${this.entity.name}: Sent order request to ${medicine.supplier} for ${medicineName} (${orderQuantity} units)`,
          { 
            agent: 'Pharmacy', 
            type: 'COORDINATION', 
            entityId: this.entityId.toString(), 
            medicine: medicineName,
            quantity: orderQuantity,
            recipient: medicine.supplier
          }
        );
      }

      publish('MEDICINE_SHORTAGE_RISK', {
        pharmacyId: this.entityId.toString(),
        pharmacyName: this.entity.name,
        medicine: medicineName,
        stock,
        daysLeft: daysLeft.toFixed(1),
        reorderPoint,
        urgency,
        criticality: medicine.criticality,
        zone: this.entity.zone,
        orderQuantity,
        supplier: medicine.supplier
      });
    }
  }

  calculateOrderQuantity(medicine, daysLeft) {
    const targetDays = medicine.criticality === 'high' ? 14 : 10;
    const dailyUsage = medicine.dailyUsage || medicine.usagePerDay;
    const optimalStock = dailyUsage * targetDays;
    const orderQuantity = Math.max(optimalStock - medicine.stock, dailyUsage * 7);
    
    return Math.ceil(orderQuantity / 10) * 10;
  }

  async onOutbreakAlert(disease, primaryMedicine, event) {
    // Add staggered delay to prevent parallel saves
    const pharmacyIndex = this.entityId.toString().charCodeAt(this.entityId.toString().length - 1) % 3;
    const baseDelay = pharmacyIndex * 600; // Stagger by pharmacy (0-1800ms)
    const randomDelay = Math.random() * 1000; // Additional random (0-1000ms)
    await new Promise(resolve => setTimeout(resolve, baseDelay + randomDelay));
    
    // Reload entity
    this.entity = await Entity.findById(this.entityId);
    if (!this.entity) return;

    const state = this.entity.currentState;

    // Only respond if outbreak is in our zone
    if (this.entity.zone !== event.zone) return;

    this.log(
      `💊 ${this.entity.name}: ${disease.toUpperCase()} OUTBREAK ALERT received from labs! Preparing medicine supplies`,
      { 
        agent: 'Pharmacy', 
        type: 'ALERT_RECEIVED', 
        entityId: this.entityId.toString(),
        disease,
        zone: event.zone
      }
    );

    const medicine = state.medicines[primaryMedicine];
    if (medicine) {
      const multiplier = event.riskLevel === 'critical' ? 2.5 : 
                        event.riskLevel === 'high' ? 2.0 : 1.5;
      
      const oldUsage = medicine.dailyUsage || medicine.usagePerDay;
      medicine.dailyUsage = Math.round(oldUsage * multiplier);
      medicine.usagePerDay = medicine.dailyUsage;
      const currentStock = medicine.stock;
      const daysRemaining = currentStock / medicine.dailyUsage;

      this.log(
        `📊 ${this.entity.name}: Adjusting ${primaryMedicine} demand forecast - Usage: ${oldUsage} → ${medicine.dailyUsage}/day | Stock: ${currentStock} units (${daysRemaining.toFixed(1)} days supply)`,
        { 
          agent: 'Pharmacy', 
          type: 'DEMAND_FORECAST', 
          entityId: this.entityId.toString(),
          disease,
          medicine: primaryMedicine,
          multiplier
        }
      );

      // Immediately check stock
      this.checkMedicineStock(state, primaryMedicine);
    }

    // Also increase related medicines
    const relatedMedicines = this.getRelatedMedicines(disease);
    relatedMedicines.forEach(medName => {
      if (state.medicines[medName]) {
        const oldUsage = state.medicines[medName].dailyUsage || state.medicines[medName].usagePerDay;
        state.medicines[medName].dailyUsage = Math.round(oldUsage * 1.3);
        state.medicines[medName].usagePerDay = state.medicines[medName].dailyUsage;
      }
    });

    // Save updated state
    this.entity.markModified('currentState');
    await this.entity.save();
  }

  getRelatedMedicines(disease) {
    const relatedMap = {
      dengue: ['paracetamol'],
      malaria: ['paracetamol'],
      typhoid: ['paracetamol'],
      influenza: ['paracetamol'],
      covid: ['paracetamol']
    };
    return relatedMap[disease] || [];
  }

  async onMedicineRequest(event) {
    // Reload entity
    this.entity = await Entity.findById(this.entityId);
    if (!this.entity) return;

    const state = this.entity.currentState;

    // Check if request is for our zone
    if (this.entity.zone !== event.zone) return;

    this.log(
      `📩 ${this.entity.name}: Medicine request received from ${event.hospitalName || 'Hospital'} for ${event.disease} outbreak (${event.urgency} priority)`,
      { agent: 'Pharmacy', type: 'REQUEST_RECEIVED', entityId: this.entityId.toString(), hospitalId: event.hospitalId, urgency: event.urgency }
    );

    const disease = event.disease;
    const primaryMedicine = this.getPrimaryMedicineForDisease(disease);
    
    if (primaryMedicine && state.medicines[primaryMedicine]) {
      const medicine = state.medicines[primaryMedicine];
      const stockStatus = medicine.stock > medicine.reorderPoint ? 'sufficient' : 'low';
      
      this.log(
        `📦 ${this.entity.name}: Checking ${primaryMedicine} inventory - Stock: ${medicine.stock} units (Status: ${stockStatus})`,
        { agent: 'Pharmacy', type: 'STOCK_CHECK', entityId: this.entityId.toString(), medicine: primaryMedicine, stock: medicine.stock }
      );
      
      this.checkMedicineStock(state, primaryMedicine);
    }

    // Save state
    this.entity.markModified('currentState');
    await this.entity.save();
  }

  getPrimaryMedicineForDisease(disease) {
    const diseaseMap = {
      dengue: 'dengueMed',
      malaria: 'chloroquine',
      typhoid: 'ceftriaxone',
      influenza: 'oseltamivir',
      covid: 'oseltamivir'
    };
    return diseaseMap[disease];
  }
}

module.exports = PharmacyAgent;

