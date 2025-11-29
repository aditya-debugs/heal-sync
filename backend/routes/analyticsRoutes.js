// backend/routes/analyticsRoutes.js
const express = require("express");
const Entity = require("../models/Entity");
const MetricsLog = require("../models/MetricsLog");
const AgentActivity = require("../models/AgentActivity");

const router = express.Router();

// Get heatmap data for disease outbreak
router.get("/heatmap/:diseaseType", async (req, res) => {
  try {
    const { diseaseType } = req.params;
    const { hours = 24 } = req.query;

    // Get all labs with their locations
    const labs = await Entity.find({
      entityType: "lab",
      status: "active",
    }).lean();

    // Get recent test data from metrics
    const since = new Date(Date.now() - parseInt(hours) * 3600000);
    const recentMetrics = await MetricsLog.find({
      entityType: "lab",
      timestamp: { $gte: since },
      [`data.${diseaseType}Tests`]: { $exists: true },
    }).lean();

    // Aggregate data by zone
    const zoneData = {};

    recentMetrics.forEach((metric) => {
      const zone = metric.zone;
      if (!zone) return;

      if (!zoneData[zone]) {
        zoneData[zone] = {
          totalTests: 0,
          positiveCases: 0,
          labs: [],
        };
      }

      const tests = metric.data[`${diseaseType}Tests`] || 0;
      const positiveRate = metric.data.positiveRate || 0;

      zoneData[zone].totalTests += tests;
      zoneData[zone].positiveCases += tests * positiveRate;
    });

    // Map labs to zones
    labs.forEach((lab) => {
      const zone = lab.zone;
      if (zone && zoneData[zone]) {
        if (!zoneData[zone].labs.some((l) => l.id === lab._id.toString())) {
          zoneData[zone].labs.push({
            id: lab._id.toString(),
            name: lab.name,
            coordinates: lab.coordinates,
          });
        }
      }
    });

    // Calculate risk scores
    const heatmapData = Object.entries(zoneData).map(([zone, data]) => {
      const riskScore =
        data.totalTests > 0 ? (data.positiveCases / data.totalTests) * 100 : 0;

      let severity = "low";
      if (riskScore > 60) severity = "critical";
      else if (riskScore > 30) severity = "high";
      else if (riskScore > 10) severity = "medium";

      return {
        zone,
        riskScore: Math.round(riskScore * 100) / 100,
        severity,
        totalTests: Math.round(data.totalTests),
        positiveCases: Math.round(data.positiveCases),
        labs: data.labs,
        color:
          severity === "critical"
            ? "#DC2626"
            : severity === "high"
            ? "#F59E0B"
            : severity === "medium"
            ? "#FBBF24"
            : "#10B981",
      };
    });

    res.json({
      success: true,
      diseaseType,
      timeRange: `${hours} hours`,
      data: heatmapData,
    });
  } catch (error) {
    console.error("Heatmap error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to generate heatmap",
      error: error.message,
    });
  }
});

// Get all entities for map visualization
router.get("/map/entities", async (req, res) => {
  try {
    const { type, zone } = req.query;
    const filter = { status: "active" };

    if (type) filter.entityType = type;
    if (zone) filter.zone = zone;

    const entities = await Entity.find(filter)
      .select("name entityType zone coordinates currentState")
      .lean();

    // Format for map display
    const mapData = entities.map((entity) => ({
      id: entity._id.toString(),
      name: entity.name,
      type: entity.entityType,
      zone: entity.zone,
      coordinates: entity.coordinates,
      state: entity.currentState,
      // Calculate status based on entity type
      status: getEntityStatus(entity),
    }));

    res.json({
      success: true,
      count: mapData.length,
      data: mapData,
    });
  } catch (error) {
    console.error("Map entities error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch map data",
      error: error.message,
    });
  }
});

// Get trend data for a specific metric
router.get("/trends/:entityId", async (req, res) => {
  try {
    const { entityId } = req.params;
    const { metric, hours = 24 } = req.query;

    const since = new Date(Date.now() - parseInt(hours) * 3600000);
    const metrics = await MetricsLog.find({
      entityId,
      timestamp: { $gte: since },
    })
      .sort({ timestamp: 1 })
      .lean();

    // Extract specific metric if provided
    const trendData = metrics.map((m) => ({
      timestamp: m.timestamp,
      value: metric ? m.data[metric] : m.data,
    }));

    res.json({
      success: true,
      entityId,
      metric: metric || "all",
      count: trendData.length,
      data: trendData,
    });
  } catch (error) {
    console.error("Trends error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch trends",
      error: error.message,
    });
  }
});

// Get zone statistics
router.get("/zones/stats", async (req, res) => {
  try {
    const zones = ["Zone-1", "Zone-2", "Zone-3"];
    const stats = [];

    for (const zone of zones) {
      const hospitals = await Entity.countDocuments({
        entityType: "hospital",
        zone,
        status: "active",
      });
      const labs = await Entity.countDocuments({
        entityType: "lab",
        zone,
        status: "active",
      });
      const pharmacies = await Entity.countDocuments({
        entityType: "pharmacy",
        zone,
        status: "active",
      });

      // Get recent metrics for this zone
      const since = new Date(Date.now() - 24 * 3600000);
      const recentMetrics = await MetricsLog.find({
        zone,
        timestamp: { $gte: since },
      }).lean();

      // Calculate zone risk
      let riskScore = 0;
      if (recentMetrics.length > 0) {
        const avgData = calculateAverageRisk(recentMetrics);
        riskScore = avgData;
      }

      stats.push({
        zone,
        entities: {
          hospitals,
          labs,
          pharmacies,
          total: hospitals + labs + pharmacies,
        },
        riskScore,
        status:
          riskScore > 60
            ? "critical"
            : riskScore > 30
            ? "high"
            : riskScore > 10
            ? "medium"
            : "low",
      });
    }

    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error("Zone stats error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch zone statistics",
      error: error.message,
    });
  }
});

// Get recent agent activities
router.get("/activities", async (req, res) => {
  try {
    const { limit = 100, agentType } = req.query;

    const query = {};
    if (agentType) query.agentType = agentType;

    const activities = await AgentActivity.find(query)
      .sort({ timestamp: -1 })
      .limit(parseInt(limit))
      .lean();

    res.json({
      success: true,
      count: activities.length,
      data: activities,
    });
  } catch (error) {
    console.error("Activities error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch activities",
      error: error.message,
    });
  }
});

// Helper function to calculate entity status
function getEntityStatus(entity) {
  const { entityType, currentState } = entity;

  if (!currentState || Object.keys(currentState).length === 0) {
    return "unknown";
  }

  switch (entityType) {
    case "hospital":
      if (currentState.beds) {
        const totalBeds = Object.values(currentState.beds).reduce(
          (sum, bed) => sum + (bed.total || 0),
          0
        );
        const usedBeds = Object.values(currentState.beds).reduce(
          (sum, bed) => sum + (bed.used || 0),
          0
        );
        const occupancy = totalBeds > 0 ? (usedBeds / totalBeds) * 100 : 0;

        if (occupancy > 85) return "critical";
        if (occupancy > 70) return "warning";
        return "normal";
      }
      break;

    case "pharmacy":
      if (currentState.medicines) {
        const lowStock = Object.values(currentState.medicines).some(
          (med) => med.stock < med.reorderLevel
        );
        return lowStock ? "warning" : "normal";
      }
      break;

    default:
      return "normal";
  }

  return "normal";
}

// Get disease prevalence data by zone for heatmap
router.get("/disease-prevalence", async (req, res) => {
  try {
    const zones = ["Zone-1", "Zone-2", "Zone-3"];
    const diseases = ["dengue", "malaria", "typhoid", "covid", "influenza"];
    const heatmapData = [];

    for (const zone of zones) {
      const zoneData = { zone, diseases: {} };

      // Get all labs in this zone
      const labs = await Entity.find({
        entityType: "lab",
        zone,
        status: "active",
      }).lean();

      // Aggregate disease data from lab entities
      for (const disease of diseases) {
        let totalPositive = 0;
        let totalTests = 0;

        labs.forEach((lab) => {
          if (
            lab.currentState &&
            lab.currentState.testData &&
            lab.currentState.testData[disease]
          ) {
            const diseaseData = lab.currentState.testData[disease];
            totalPositive += diseaseData.positive || 0;
            totalTests += diseaseData.today || 0;
          }
        });

        zoneData.diseases[disease] = {
          positive: totalPositive,
          tests: totalTests,
          prevalence:
            totalTests > 0
              ? ((totalPositive / totalTests) * 100).toFixed(1)
              : 0,
        };
      }

      heatmapData.push(zoneData);
    }

    res.json({
      success: true,
      data: heatmapData,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error fetching disease prevalence:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch disease prevalence data",
      error: error.message,
    });
  }
});

// Helper function to calculate average risk from metrics
function calculateAverageRisk(metrics) {
  if (metrics.length === 0) return 0;

  let totalRisk = 0;
  metrics.forEach((m) => {
    // Calculate risk based on data patterns
    if (m.data.positiveRate) {
      totalRisk += m.data.positiveRate * 100;
    }
  });

  return totalRisk / metrics.length;
}

module.exports = router;
