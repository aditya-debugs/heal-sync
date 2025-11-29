// backend/agents/CityAgent.js
const { subscribe, publish } = require("../eventBus");
const EVENTS = require("../constants/events");

class CityAgent {
  constructor(worldState, log) {
    this.worldState = worldState;
    this.log = log;
    this.ML_SERVICE_URL = "http://localhost:8000"; // Python ML service

    // Subscribe to all major events for city-wide monitoring
    subscribe(
      "DENGUE_OUTBREAK_PREDICTED",
      this.onOutbreak.bind(this, "dengue")
    );
    subscribe(
      "MALARIA_OUTBREAK_PREDICTED",
      this.onOutbreak.bind(this, "malaria")
    );
    subscribe(
      "TYPHOID_OUTBREAK_PREDICTED",
      this.onOutbreak.bind(this, "typhoid")
    );
    subscribe(
      "INFLUENZA_OUTBREAK_PREDICTED",
      this.onOutbreak.bind(this, "influenza")
    );
    subscribe("COVID_OUTBREAK_PREDICTED", this.onOutbreak.bind(this, "covid"));

    subscribe("HOSPITAL_OVERLOAD_RISK", this.onHospitalOverload.bind(this));
    subscribe("MEDICINE_SHORTAGE_RISK", this.onMedicineShortage.bind(this));
    subscribe("LAB_CAPACITY_WARNING", this.onLabCapacity.bind(this));
    subscribe("EQUIPMENT_SHORTAGE", this.onEquipmentShortage.bind(this));
  }

  start() {
    // Log initialization
    this.log(
      `✅ City Agent initialized - Coordinating citywide healthcare across 3 zones with 12 facilities`,
      { agent: "City", type: "INIT", entityId: "CITY" }
    );

    // Periodic city health summary every 15 seconds (faster for demo)
    setInterval(() => this.tick(), 15000);
  }

  async tick() {
    const city = this.worldState.city;

    // Update citywide metrics
    this.updateCityMetrics();

    // 🤖 ML-POWERED: Crisis Prediction using ML service
    await this.predictCrisisWithML();

    // Calculate key citywide metrics for logging
    const totalActiveCases = city.diseaseStats
      ? Object.values(city.diseaseStats).reduce(
          (sum, d) => sum + (d.activeCases || 0),
          0
        )
      : 0;
    const bedsAvailable = city.totalResources?.beds?.available || 0;
    const bedsTotal = city.totalResources?.beds?.total || 0;
    const bedUtilization = Math.round(
      ((bedsTotal - bedsAvailable) / bedsTotal) * 100
    );

    // Assess overall risk status
    const riskAssessment = this.assessCityRisk();
    const highRiskZones = riskAssessment.highRiskZones;

    // ALWAYS log comprehensive city status
    if (highRiskZones.length > 0) {
      this.log(
        `🏙️ City Health Status: 🔴 ${
          highRiskZones.length
        } HIGH-RISK zones (${highRiskZones.join(
          ", "
        )}) | ${totalActiveCases} active cases | ${bedsAvailable}/${bedsTotal} beds (${bedUtilization}% used) | ${
          city.activeAlerts.length
        } alerts`,
        {
          agent: "City",
          type: "STATUS",
          entityId: "CITY",
          highRiskZones,
          overallRisk: riskAssessment.overallRisk,
          activeAlerts: city.activeAlerts.length,
          totalCases: totalActiveCases,
          bedUtilization,
        }
      );
    } else {
      this.log(
        `🏙️ City Health Status: 🟢 All zones STABLE | ${totalActiveCases} active cases | ${bedsAvailable}/${bedsTotal} beds available | ${city.activeAlerts.length} alerts`,
        {
          agent: "City",
          type: "STATUS",
          entityId: "CITY",
          overallRisk: "low",
          totalCases: totalActiveCases,
        }
      );
    }
  }

  async predictCrisisWithML() {
    /**
     * 🤖 ML-POWERED CRISIS PREDICTION
     * Uses Python FastAPI ML service with Crisis Prediction Score (CPS)
     * Formula: CPS = (Disease×0.4) + (Capacity×0.3) + (Medicine×0.2) + (Zone×0.1)
     */

    try {
      const city = this.worldState.city;

      // Prepare data for ML service
      const diseaseMetrics = {};
      const capacityMetrics = {};
      const medicineMetrics = {};
      const zoneMetrics = {};

      // Disease metrics from all labs
      const labs = this.worldState.labs;
      Object.entries(labs).forEach(([labId, lab]) => {
        const zone = lab.zone;
        if (!diseaseMetrics[zone])
          diseaseMetrics[zone] = { total_cases: 0, positive_rate: 0 };

        Object.values(lab.testData || {}).forEach((test) => {
          diseaseMetrics[zone].total_cases += test.today || 0;
          if (test.today > 0) {
            diseaseMetrics[zone].positive_rate +=
              test.positive / test.today || 0;
          }
        });
      });

      // Capacity metrics from all hospitals
      const hospitals = this.worldState.hospitals;
      Object.entries(hospitals).forEach(([hospId, hosp]) => {
        const zone = hosp.zone;
        if (!capacityMetrics[zone])
          capacityMetrics[zone] = { bed_utilization: 0, icu_utilization: 0 };

        const totalBeds = Object.values(hosp.beds).reduce(
          (sum, b) => sum + b.total,
          0
        );
        const usedBeds = Object.values(hosp.beds).reduce(
          (sum, b) => sum + b.used,
          0
        );
        capacityMetrics[zone].bed_utilization =
          totalBeds > 0 ? usedBeds / totalBeds : 0;
        capacityMetrics[zone].icu_utilization =
          hosp.beds.icu.total > 0
            ? hosp.beds.icu.used / hosp.beds.icu.total
            : 0;
      });

      // Medicine metrics from all pharmacies
      const pharmacies = this.worldState.pharmacies;
      Object.entries(pharmacies).forEach(([pharmId, pharm]) => {
        const zone = pharm.zone;
        if (!medicineMetrics[zone])
          medicineMetrics[zone] = { shortage_count: 0, critical_shortage: 0 };

        Object.values(pharm.medicines || {}).forEach((med) => {
          if (med.stock <= med.reorderPoint) {
            medicineMetrics[zone].shortage_count++;
            if (med.stock <= med.reorderPoint * 0.5) {
              medicineMetrics[zone].critical_shortage++;
            }
          }
        });
      });

      // Zone metrics from city risk zones
      Object.entries(city.riskZones || {}).forEach(([zoneName, risks]) => {
        zoneMetrics[zoneName] = {
          overall_risk:
            risks.overall === "high"
              ? 1.0
              : risks.overall === "medium"
              ? 0.5
              : 0.0,
          alert_count: city.activeAlerts.filter((a) => a.zone === zoneName)
            .length,
        };
      });

      // Call Python ML service
      const response = await fetch(`${this.ML_SERVICE_URL}/predict/crisis`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          disease_metrics: diseaseMetrics,
          capacity_metrics: capacityMetrics,
          medicine_metrics: medicineMetrics,
          zone_metrics: zoneMetrics,
        }),
      });

      if (!response.ok) {
        throw new Error(`ML Service error: ${response.status}`);
      }

      const prediction = await response.json();

      // Log ML prediction
      this.log(
        `🤖 ML CRISIS PREDICTION: CPS Score = ${prediction.crisis_prediction_score.toFixed(
          1
        )} | Severity: ${prediction.severity_level} | ${
          prediction.high_risk_zones.length
        } high-risk zones`,
        {
          agent: "City",
          type: `ML_CRISIS_PREDICTION`,
          entityId: "CITY",
          cps: prediction.crisis_prediction_score,
          severity: prediction.severity_level,
          mlPowered: true,
        }
      );

      // Log advisory
      if (prediction.advisory) {
        this.log(`📡 City Advisory: ${prediction.advisory}`, {
          agent: "City",
          type: `ML_ADVISORY`,
          entityId: "CITY",
          advisory: prediction.advisory,
        });
      }

      // Publish crisis alert if severe
      if (
        prediction.severity_level === "HIGH" ||
        prediction.severity_level === "CRITICAL"
      ) {
        publish("CITY_CRISIS_ALERT", {
          cps: prediction.crisis_prediction_score,
          severity: prediction.severity_level,
          highRiskZones: prediction.high_risk_zones,
          recommendations: prediction.recommendations,
          advisory: prediction.advisory,
          timestamp: new Date().toISOString(),
          mlPowered: true,
        });
      }
    } catch (error) {
      // Fallback: Use rule-based assessment if ML service unavailable
      this.log(
        `⚠️ ML service unavailable, using fallback assessment: ${error.message}`,
        { agent: "City", type: "ML_FALLBACK", error: error.message }
      );
    }
  }

  updateCityMetrics() {
    const city = this.worldState.city;
    const hospitals = this.worldState.hospitals;

    // Calculate total resources across all hospitals
    let totalBeds = 0,
      usedBeds = 0;
    let totalICU = 0,
      usedICU = 0;
    let totalVentilators = 0,
      usedVentilators = 0;
    let totalAmbulances = 0,
      availableAmbulances = 0;
    let totalDoctors = 0,
      doctorsOnDuty = 0;
    let totalNurses = 0,
      nursesOnDuty = 0;

    Object.values(hospitals).forEach((h) => {
      // Sum all bed types
      Object.values(h.beds).forEach((bedType) => {
        totalBeds += bedType.total;
        usedBeds += bedType.used;
      });

      // ICU specifically
      totalICU += h.beds.icu.total;
      usedICU += h.beds.icu.used;

      // Equipment
      totalVentilators += h.equipment.ventilators.total;
      usedVentilators += h.equipment.ventilators.inUse;

      totalAmbulances += h.equipment.ambulances.total;
      availableAmbulances += h.equipment.ambulances.available;

      // Staff
      totalDoctors += h.staff.doctors.total;
      doctorsOnDuty += h.staff.doctors.onDuty;

      totalNurses += h.staff.nurses.total;
      nursesOnDuty += h.staff.nurses.onDuty;
    });

    // Update city totals
    city.totalResources = {
      beds: {
        total: totalBeds,
        used: usedBeds,
        available: totalBeds - usedBeds,
        utilization: usedBeds / totalBeds,
      },
      icuBeds: {
        total: totalICU,
        used: usedICU,
        available: totalICU - usedICU,
        utilization: usedICU / totalICU,
      },
      ventilators: {
        total: totalVentilators,
        used: usedVentilators,
        available: totalVentilators - usedVentilators,
        utilization: usedVentilators / totalVentilators,
      },
      ambulances: {
        total: totalAmbulances,
        available: availableAmbulances,
        busy: totalAmbulances - availableAmbulances,
        utilization: (totalAmbulances - availableAmbulances) / totalAmbulances,
      },
      doctors: {
        total: totalDoctors,
        onDuty: doctorsOnDuty,
        available: doctorsOnDuty,
      },
      nurses: {
        total: totalNurses,
        onDuty: nursesOnDuty,
        available: nursesOnDuty,
      },
    };
  }

  assessCityRisk() {
    const city = this.worldState.city;
    const riskZones = city.riskZones;

    const highRiskZones = [];
    const mediumRiskZones = [];

    Object.entries(riskZones).forEach(([zoneName, risks]) => {
      // Check if any disease risk is high
      const hasHighRisk = Object.values(risks).some((risk) => risk === "high");
      const hasMediumRisk = Object.values(risks).some(
        (risk) => risk === "medium"
      );

      if (risks.overall === "high" || hasHighRisk) {
        highRiskZones.push(zoneName);
      } else if (risks.overall === "medium" || hasMediumRisk) {
        mediumRiskZones.push(zoneName);
      }
    });

    const overallRisk =
      highRiskZones.length > 0
        ? "high"
        : mediumRiskZones.length > 1
        ? "medium"
        : "low";

    return { highRiskZones, mediumRiskZones, overallRisk };
  }

  onOutbreak(disease, event) {
    const { zone, riskLevel, labId } = event;
    const city = this.worldState.city;

    // Ensure risk zone exists
    if (!city.riskZones[zone]) {
      city.riskZones[zone] = {
        dengue: "low",
        malaria: "low",
        covid: "low",
        typhoid: "low",
        influenza: "low",
        heatwave: "low",
        airQuality: "good",
        waterborne: "low",
        overall: "low",
      };
    }

    // Update risk level for this disease
    city.riskZones[zone][disease] = riskLevel || "high";

    // Update overall zone risk
    this.updateOverallZoneRisk(zone);

    // Add to active alerts
    city.activeAlerts.push({
      id: `alert-${Date.now()}`,
      type: `${disease.toUpperCase()}_OUTBREAK`,
      disease,
      zone,
      riskLevel: riskLevel || "high",
      message: `${
        disease.charAt(0).toUpperCase() + disease.slice(1)
      } outbreak predicted in ${zone}`,
      details: event,
      timestamp: new Date().toISOString(),
      status: "active",
    });

    // Keep only last 50 alerts
    if (city.activeAlerts.length > 50) {
      city.activeAlerts = city.activeAlerts.slice(-50);
    }

    this.log(
      `[CityAgent] ${disease.toUpperCase()} outbreak alert in ${zone}. Risk level: ${
        riskLevel || "high"
      }. Lab ${labId} detected pattern.`,
      {
        agent: "City",
        type: "OUTBREAK_ALERT",
        disease,
        zone,
        riskLevel: riskLevel || "high",
      }
    );

    // Update disease stats
    if (city.diseaseStats[disease]) {
      city.diseaseStats[disease].newToday += Math.round(
        event.predictedCases || 20
      );
      city.diseaseStats[disease].activeCases += Math.round(
        (event.predictedCases || 20) * 0.8
      );
    }
  }

  updateOverallZoneRisk(zoneName) {
    const city = this.worldState.city;
    const zoneRisks = city.riskZones[zoneName];

    // Count high and medium risks
    const highCount = Object.values(zoneRisks).filter(
      (r) => r === "high" || r === "critical"
    ).length;
    const mediumCount = Object.values(zoneRisks).filter(
      (r) => r === "medium"
    ).length;

    // Determine overall risk
    if (highCount >= 2) {
      zoneRisks.overall = "high";
    } else if (highCount >= 1 || mediumCount >= 2) {
      zoneRisks.overall = "medium";
    } else {
      zoneRisks.overall = "low";
    }
  }

  onHospitalOverload(event) {
    const { hospitalId, occupancy, zone, name } = event;
    const city = this.worldState.city;

    city.activeAlerts.push({
      id: `alert-${Date.now()}`,
      type: "HOSPITAL_OVERLOAD",
      zone,
      hospitalId,
      message: `${name || hospitalId} overload risk (${Math.round(
        occupancy * 100
      )}% occupancy)`,
      timestamp: new Date().toISOString(),
      status: "active",
      severity: occupancy > 0.95 ? "critical" : "high",
    });

    this.log(
      `[CityAgent] Hospital overload: ${
        name || hospitalId
      } in ${zone} at ${Math.round(occupancy * 100)}% capacity`,
      { agent: "City", type: "OVERLOAD_ALERT", hospitalId, zone, occupancy }
    );

    // Check if we can redirect patients to other hospitals
    this.suggestPatientRedirection(hospitalId, zone);
  }

  suggestPatientRedirection(overloadedHospitalId, zone) {
    const hospitals = this.worldState.hospitals;

    // Find hospitals in same or adjacent zones with available capacity
    const availableHospitals = Object.values(hospitals).filter((h) => {
      if (h.id === overloadedHospitalId) return false;

      const totalBeds = Object.values(h.beds).reduce(
        (sum, b) => sum + b.total,
        0
      );
      const usedBeds = Object.values(h.beds).reduce(
        (sum, b) => sum + b.used,
        0
      );
      const occupancy = usedBeds / totalBeds;

      return occupancy < 0.7; // Less than 70% occupied
    });

    if (availableHospitals.length > 0) {
      this.log(
        `[CityAgent] Recommendation: Redirect patients from ${overloadedHospitalId} to ${availableHospitals
          .map((h) => h.id)
          .join(", ")}`,
        {
          agent: "City",
          type: "REDIRECT_SUGGESTION",
          from: overloadedHospitalId,
          to: availableHospitals.map((h) => h.id),
        }
      );
    }
  }

  onMedicineShortage(event) {
    const { pharmacyId, medicine, zone, urgency, criticality } = event;
    const city = this.worldState.city;

    // Only alert for high criticality medicines
    if (criticality === "high" || urgency === "high") {
      city.activeAlerts.push({
        id: `alert-${Date.now()}`,
        type: "MEDICINE_SHORTAGE",
        zone,
        pharmacyId,
        medicine,
        message: `${
          urgency?.toUpperCase() || "HIGH"
        } priority: ${medicine} shortage at Pharmacy ${pharmacyId}`,
        timestamp: new Date().toISOString(),
        status: "active",
        severity: urgency,
      });

      this.log(
        `[CityAgent] Medicine shortage: ${medicine} at Pharmacy ${pharmacyId} in ${zone} (${urgency} urgency)`,
        {
          agent: "City",
          type: "MED_SHORTAGE_ALERT",
          pharmacyId,
          medicine,
          zone,
          urgency,
        }
      );
    }
  }

  onLabCapacity(event) {
    const { labId, zone, utilization } = event;
    const city = this.worldState.city;

    city.activeAlerts.push({
      id: `alert-${Date.now()}`,
      type: "LAB_CAPACITY",
      zone,
      labId,
      message: `Lab ${labId} at ${Math.round(utilization * 100)}% capacity`,
      timestamp: new Date().toISOString(),
      status: "active",
      severity: "medium",
    });

    this.log(
      `[CityAgent] Lab capacity warning: ${labId} in ${zone} at ${Math.round(
        utilization * 100
      )}% utilization`,
      { agent: "City", type: "LAB_CAPACITY_ALERT", labId, zone, utilization }
    );
  }

  onEquipmentShortage(event) {
    const { hospitalId, zone, equipment } = event;
    const city = this.worldState.city;

    city.activeAlerts.push({
      id: `alert-${Date.now()}`,
      type: "EQUIPMENT_SHORTAGE",
      zone,
      hospitalId,
      equipment,
      message: `Critical: ${equipment} shortage at Hospital ${hospitalId}`,
      timestamp: new Date().toISOString(),
      status: "active",
      severity: "critical",
    });

    this.log(
      `[CityAgent] Equipment shortage: ${equipment} at Hospital ${hospitalId} in ${zone}`,
      { agent: "City", type: "EQUIPMENT_ALERT", hospitalId, zone, equipment }
    );
  }
}

module.exports = CityAgent;
