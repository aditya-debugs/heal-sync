const express = require("express");
const router = express.Router();

let weatherAgentInstance = null;

/**
 * Initialize the weather routes with the WeatherAgent instance
 */
function initWeatherRoutes(weatherAgent) {
  weatherAgentInstance = weatherAgent;
  return router;
}

/**
 * GET /api/weather/health-risk
 * Returns the latest weather data and disease risk predictions
 */
router.get("/health-risk", (req, res) => {
  try {
    if (!weatherAgentInstance) {
      return res.status(503).json({
        success: false,
        message: "Weather service not initialized",
        weather: null,
        risks: null,
      });
    }

    const weatherData = weatherAgentInstance.getHealthRisk();

    res.json({
      success: true,
      ...weatherData,
    });
  } catch (error) {
    console.error("Error in /api/weather/health-risk:", error);
    res.status(500).json({
      success: false,
      message: "Failed to retrieve weather and risk data",
      error: error.message,
      weather: null,
      risks: null,
    });
  }
});

module.exports = { initWeatherRoutes };
