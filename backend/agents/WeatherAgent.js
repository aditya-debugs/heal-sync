const axios = require("axios");

// Mumbai coordinates (exact location from API)
const LOCATION = {
  name: "Mumbai",
  latitude: 19.0728,
  longitude: 72.8826,
};

class WeatherAgent {
  constructor(sendLog) {
    this.name = "WeatherAgent";
    this.sendLog = sendLog;
    this.fetchInterval = 30 * 1000; // 30 seconds
    this.isRunning = false;

    // Internal state
    this.latestWeather = {
      temp: null,
      humidity: null,
      rainfall: null,
      updatedAt: null,
    };

    this.latestRisk = {
      dengue: "Low",
      heatstroke: "Low",
      respiratory: "Low",
    };
  }

  async init() {
    console.log(
      `🌦️  [${this.name}] Initializing Weather-Driven Disease Predictor...`
    );

    // Fetch immediately on startup
    await this.fetchWeatherAndCalculateRisk();

    // Set up periodic fetching
    this.intervalId = setInterval(() => {
      this.fetchWeatherAndCalculateRisk();
    }, this.fetchInterval);

    this.isRunning = true;
    console.log(
      `✅ [${this.name}] Running - will fetch weather every ${
        this.fetchInterval / 60000
      } minutes`
    );
  }

  async fetchWeatherAndCalculateRisk() {
    try {
      console.log(
        `📡 [${this.name}] Fetching weather data for ${LOCATION.name}...`
      );

      // Open-Meteo API with comprehensive weather data (no key required)
      const url = "https://api.open-meteo.com/v1/forecast";
      const params = {
        latitude: LOCATION.latitude,
        longitude: LOCATION.longitude,
        daily:
          "weather_code,temperature_2m_max,uv_index_max,rain_sum,showers_sum,precipitation_sum",
        hourly:
          "temperature_2m,rain,precipitation,precipitation_probability,showers,pressure_msl,evapotranspiration,temperature_80m,temperature_120m",
        current:
          "temperature_2m,is_day,precipitation,rain,showers,pressure_msl",
        timezone: "auto",
        forecast_minutely_15: "24",
      };

      const response = await axios.get(url, {
        params,
        timeout: 10000, // 10 second timeout
      });

      if (response.data && response.data.current && response.data.hourly) {
        const current = response.data.current;
        const hourly = response.data.hourly;

        // Use current temperature from 'current' endpoint for most accurate data
        const temp = current.temperature_2m;
        const rainfall = current.rain || 0;

        // Calculate humidity from hourly data (use most recent value)
        // Since humidity is not in current, we'll estimate from precipitation
        const recentPrecipProb = hourly.precipitation_probability[0] || 0;
        const humidity = Math.min(recentPrecipProb + 40, 95); // Estimated humidity based on precipitation probability

        // Update weather state
        this.latestWeather = {
          temp: temp,
          humidity: humidity,
          rainfall: rainfall,
          updatedAt: new Date(),
          location: LOCATION.name,
        };

        // Calculate disease risks using rule-based logic
        this.calculateRisks(temp, humidity, rainfall);

        // Create compact log message
        const logMessage = `Temp=${temp}°C, Humidity=${humidity}%. Risks → Dengue: ${this.latestRisk.dengue}, Heatstroke: ${this.latestRisk.heatstroke}, Respiratory: ${this.latestRisk.respiratory}`;

        console.log(`✅ [${this.name}] ${logMessage}`);

        if (this.sendLog) {
          this.sendLog({
            timestamp: this.latestWeather.updatedAt.toISOString(),
            agent: this.name,
            event: "WEATHER_UPDATED",
            data: {
              weather: this.latestWeather,
              risks: this.latestRisk,
            },
            message: logMessage,
          });
        }
      } else {
        console.warn(`⚠️  [${this.name}] No weather data in API response`);
      }
    } catch (error) {
      // Graceful error handling
      const errorMessage = error.response
        ? `API error (${error.response.status}): ${error.response.statusText}`
        : error.code === "ECONNABORTED"
        ? "Request timeout - API not responding"
        : error.message;

      console.error(
        `❌ [${this.name}] Error fetching weather: ${errorMessage}`
      );

      if (this.sendLog) {
        this.sendLog({
          timestamp: new Date().toISOString(),
          agent: this.name,
          event: "WEATHER_FETCH_ERROR",
          data: { error: errorMessage },
          message: `Failed to fetch weather: ${errorMessage}`,
        });
      }
    }
  }

  /**
   * Rule-based disease risk calculation
   * @param {number} temp - Temperature in Celsius
   * @param {number} humidity - Relative humidity in percentage
   * @param {number} rainfall - Rainfall in mm
   */
  calculateRisks(temp, humidity, rainfall) {
    // Dengue Risk: High humidity + rainfall
    if (humidity > 70 && rainfall > 0) {
      this.latestRisk.dengue = "High";
    } else if (humidity > 60 || rainfall > 0) {
      this.latestRisk.dengue = "Medium";
    } else {
      this.latestRisk.dengue = "Low";
    }

    // Heatstroke Risk: High temperature + moderate humidity
    if (temp > 35 && humidity > 40) {
      this.latestRisk.heatstroke = "High";
    } else if (temp > 32 && humidity > 40) {
      this.latestRisk.heatstroke = "Medium";
    } else {
      this.latestRisk.heatstroke = "Low";
    }

    // Respiratory Risk: Cold conditions or high humidity
    if (temp < 15) {
      this.latestRisk.respiratory = "High";
    } else if (temp < 20 || humidity > 85) {
      this.latestRisk.respiratory = "Medium";
    } else {
      this.latestRisk.respiratory = "Low";
    }
  }

  /**
   * Get current weather and risk data
   */
  getHealthRisk() {
    return {
      weather: this.latestWeather,
      risks: this.latestRisk,
      nextUpdate: this.latestWeather.updatedAt
        ? new Date(this.latestWeather.updatedAt.getTime() + this.fetchInterval)
        : null,
      status: this.isRunning ? "active" : "inactive",
    };
  }

  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.isRunning = false;
      console.log(`🛑 [${this.name}] Stopped`);
    }
  }
}

module.exports = WeatherAgent;
