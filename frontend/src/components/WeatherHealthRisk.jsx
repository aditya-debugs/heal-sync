import React, { useState, useEffect } from "react";

const WeatherHealthRisk = () => {
  const [weatherData, setWeatherData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Update clock every second
  useEffect(() => {
    const clockInterval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(clockInterval);
  }, []);

  useEffect(() => {
    fetchWeatherRisk();
    const interval = setInterval(fetchWeatherRisk, 30 * 1000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const fetchWeatherRisk = async () => {
    try {
      console.log("🌦️ Fetching weather and health risk data...");
      const response = await fetch(
        "http://localhost:4000/api/weather/health-risk"
      );
      const data = await response.json();
      console.log("📊 Weather API Response:", data);
      if (data.success && data.weather && data.risks) {
        setWeatherData(data);
        console.log(`✅ Weather data updated`);
      } else {
        console.warn("⚠️ No weather data in response");
      }
    } catch (error) {
      console.error("❌ Error fetching weather risk:", error);
    } finally {
      setLoading(false);
    }
  };

  const getRiskColor = (risk) => {
    switch (risk) {
      case "High":
        return "text-red-400 bg-red-900/30 border-red-600";
      case "Medium":
        return "text-yellow-400 bg-yellow-900/30 border-yellow-600";
      case "Low":
        return "text-green-400 bg-green-900/30 border-green-600";
      default:
        return "text-slate-400 bg-slate-900/30 border-slate-600";
    }
  };

  const getRiskIcon = (risk) => {
    switch (risk) {
      case "High":
        return "⚠️";
      case "Medium":
        return "⚡";
      case "Low":
        return "✅";
      default:
        return "📊";
    }
  };

  const formatTime = () => {
    return currentTime.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: true,
    });
  };

  if (loading) {
    return (
      <div className="bg-slate-800 rounded-lg p-6 border border-slate-700 relative z-0">
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }

  if (!weatherData || !weatherData.weather) {
    return (
      <div className="bg-slate-800 rounded-lg p-6 border border-slate-700 relative z-0">
        <div className="text-center py-8 text-slate-400">
          Weather data unavailable
        </div>
      </div>
    );
  }

  const { weather, risks } = weatherData;

  return (
    <div className="bg-slate-800 rounded-lg p-6 border border-slate-700 relative z-0">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            🌦️ Weather-Driven Disease Predictor
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            {weather.location} • Updated {formatTime()}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Weather Card */}
        <div className="bg-gradient-to-br from-blue-900/30 to-cyan-900/30 rounded-lg p-5 border border-blue-700/50">
          <h3 className="text-lg font-semibold text-blue-300 mb-4 flex items-center gap-2">
            <span className="text-2xl">🌡️</span>
            Current Weather
          </h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-slate-300">Temperature</span>
              <span className="text-xl font-bold text-white">
                {weather.temp}°C
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-300">Humidity</span>
              <span className="text-xl font-bold text-white">
                {weather.humidity}%
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-300">Rainfall</span>
              <span className="text-xl font-bold text-white">
                {weather.rainfall} mm
              </span>
            </div>
          </div>
        </div>

        {/* Disease Risk Card */}
        <div className="bg-gradient-to-br from-purple-900/30 to-pink-900/30 rounded-lg p-5 border border-purple-700/50">
          <h3 className="text-lg font-semibold text-purple-300 mb-4 flex items-center gap-2">
            <span className="text-2xl">🦠</span>
            Disease Risk Levels
          </h3>
          <div className="space-y-3">
            {/* Dengue Risk */}
            <div className="flex items-center justify-between">
              <span className="text-slate-300 flex items-center gap-2">
                <span>🦟</span>
                Dengue
              </span>
              <span
                className={`px-3 py-1 rounded-full text-sm font-bold border ${getRiskColor(
                  risks.dengue
                )}`}
              >
                {getRiskIcon(risks.dengue)} {risks.dengue}
              </span>
            </div>

            {/* Heatstroke Risk */}
            <div className="flex items-center justify-between">
              <span className="text-slate-300 flex items-center gap-2">
                <span>☀️</span>
                Heatstroke
              </span>
              <span
                className={`px-3 py-1 rounded-full text-sm font-bold border ${getRiskColor(
                  risks.heatstroke
                )}`}
              >
                {getRiskIcon(risks.heatstroke)} {risks.heatstroke}
              </span>
            </div>

            {/* Respiratory Risk */}
            <div className="flex items-center justify-between">
              <span className="text-slate-300 flex items-center gap-2">
                <span>🫁</span>
                Respiratory
              </span>
              <span
                className={`px-3 py-1 rounded-full text-sm font-bold border ${getRiskColor(
                  risks.respiratory
                )}`}
              >
                {getRiskIcon(risks.respiratory)} {risks.respiratory}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Info Footer */}
      <div className="mt-4 pt-4 border-t border-slate-700">
        <p className="text-xs text-slate-500 text-center">
          Risk predictions are based on current weather conditions and disease
          patterns. Updates every 30 seconds.
        </p>
      </div>
    </div>
  );
};

export default WeatherHealthRisk;
