import React, { useState, useEffect, useRef } from "react";

const DiseasePrevalenceHeatmap = () => {
  const [heatmapData, setHeatmapData] = useState([]);
  const [loading, setLoading] = useState(true);
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const heatLayersRef = useRef([]);

  useEffect(() => {
    fetchDiseaseData();
    const interval = setInterval(fetchDiseaseData, 30 * 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (heatmapData.length > 0 && !mapInstanceRef.current && window.L) {
      initializeMap();
    } else if (heatmapData.length > 0 && mapInstanceRef.current) {
      updateHeatmap();
    }
  }, [heatmapData]);

  const fetchDiseaseData = async () => {
    try {
      const response = await fetch(
        "http://localhost:4000/api/analytics/disease-prevalence"
      );
      const data = await response.json();
      if (data.success && data.data) {
        setHeatmapData(data.data);
      }
    } catch (error) {
      console.error("Error fetching disease prevalence:", error);
    } finally {
      setLoading(false);
    }
  };

  const zoneCoordinates = {
    "Zone-1": { lat: 19.1136, lng: 72.8697, name: "West Mumbai" },
    "Zone-2": { lat: 18.9432, lng: 72.8236, name: "South Mumbai" },
    "Zone-3": { lat: 19.0896, lng: 72.9081, name: "East Mumbai" },
  };

  const diseaseColors = {
    dengue: "#ef4444", // Red
    malaria: "#f97316", // Orange
    typhoid: "#eab308", // Yellow
    covid: "#3b82f6", // Blue
    influenza: "#8b5cf6", // Purple
  };

  const initializeMap = () => {
    if (!mapRef.current || !window.L) return;

    const map = window.L.map(mapRef.current, {
      center: [19.076, 72.8777],
      zoom: 11,
      zoomControl: true,
      scrollWheelZoom: true,
    });

    window.L.tileLayer(
      "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
      {
        attribution: "&copy; OpenStreetMap contributors &copy; CARTO",
        maxZoom: 19,
      }
    ).addTo(map);

    mapInstanceRef.current = map;
    updateHeatmap();
  };

  const updateHeatmap = () => {
    if (!mapInstanceRef.current || !window.L) return;

    // Clear existing heat layers
    heatLayersRef.current.forEach((layer) => {
      mapInstanceRef.current.removeLayer(layer);
    });
    heatLayersRef.current = [];

    // Create heatmap for each zone based on predominant disease
    heatmapData.forEach((zoneData) => {
      const coords = zoneCoordinates[zoneData.zone];
      if (!coords) return;

      // Find disease with highest positive cases
      let maxDisease = null;
      let maxCases = 0;

      Object.entries(zoneData.diseases).forEach(([disease, data]) => {
        if (data.positive > maxCases) {
          maxCases = data.positive;
          maxDisease = disease;
        }
      });

      if (maxDisease && maxCases > 0) {
        // Create heat points around zone center with intensity based on cases
        const intensity = Math.min(maxCases / 20, 1); // Normalize to 0-1
        const heatPoints = [];

        // Create multiple points around the zone to form a heat blob
        for (let i = 0; i < 5; i++) {
          const offsetLat = (Math.random() - 0.5) * 0.05;
          const offsetLng = (Math.random() - 0.5) * 0.05;
          heatPoints.push([
            coords.lat + offsetLat,
            coords.lng + offsetLng,
            intensity,
          ]);
        }

        const heatLayer = window.L.heatLayer(heatPoints, {
          radius: 40,
          blur: 35,
          maxZoom: 13,
          max: 1.0,
          gradient: {
            0.0: diseaseColors[maxDisease] + "00",
            0.5: diseaseColors[maxDisease] + "88",
            1.0: diseaseColors[maxDisease] + "ff",
          },
        }).addTo(mapInstanceRef.current);

        heatLayersRef.current.push(heatLayer);

        // Add zone marker
        const marker = window.L.circleMarker([coords.lat, coords.lng], {
          radius: 8,
          fillColor: diseaseColors[maxDisease],
          color: "#fff",
          weight: 2,
          opacity: 1,
          fillOpacity: 0.8,
        }).addTo(mapInstanceRef.current);

        marker.bindPopup(`
          <div style="color: #000; font-weight: bold;">
            <strong>${coords.name}</strong><br/>
            Predominant: ${maxDisease.toUpperCase()}<br/>
            Cases: ${maxCases}
          </div>
        `);

        heatLayersRef.current.push(marker);
      }
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

  return (
    <div className="bg-slate-800 rounded-lg p-6 border border-slate-700 mb-8 relative z-0">
      <h3 className="text-2xl font-bold mb-2">🗺️ Disease Prevalence Heatmap</h3>
      <p className="text-sm text-slate-400 mb-4">
        Real-time geographical disease hotspot monitoring across Mumbai
      </p>

      {/* Map Container */}
      <div
        ref={mapRef}
        className="w-full h-[500px] rounded-lg border-2 border-slate-700 mb-4"
        style={{ background: "#1e293b" }}
      ></div>

      {/* Legend and Zone Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Disease Color Legend */}
        <div className="bg-slate-900 rounded-lg p-4 border border-slate-700">
          <h4 className="font-bold text-white mb-3 text-sm">Disease Colors</h4>
          <div className="space-y-2">
            {Object.entries(diseaseColors).map(([disease, color]) => (
              <div key={disease} className="flex items-center gap-3">
                <div
                  className="w-4 h-4 rounded-full border-2 border-white"
                  style={{ backgroundColor: color }}
                ></div>
                <span className="text-sm text-slate-300 capitalize">
                  {disease}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Zone Statistics */}
        <div className="bg-slate-900 rounded-lg p-4 border border-slate-700">
          <h4 className="font-bold text-white mb-3 text-sm">
            Predominant Diseases by Zone
          </h4>
          <div className="space-y-2">
            {heatmapData.map((zoneData) => {
              let maxDisease = null;
              let maxCases = 0;
              Object.entries(zoneData.diseases).forEach(([disease, data]) => {
                if (data.positive > maxCases) {
                  maxCases = data.positive;
                  maxDisease = disease;
                }
              });

              return (
                <div
                  key={zoneData.zone}
                  className="flex items-center justify-between text-sm"
                >
                  <span className="text-slate-400">
                    {zoneCoordinates[zoneData.zone]?.name}
                  </span>
                  {maxDisease ? (
                    <div className="flex items-center gap-2">
                      <span
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: diseaseColors[maxDisease] }}
                      ></span>
                      <span className="text-white font-semibold capitalize">
                        {maxDisease}
                      </span>
                      <span className="text-slate-500">({maxCases})</span>
                    </div>
                  ) : (
                    <span className="text-green-400">No active cases</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Info */}
      <div className="mt-4 text-center">
        <p className="text-xs text-slate-500">
          Heat intensity represents disease prevalence. Click zone markers for
          details.
        </p>
      </div>
    </div>
  );
};

export default DiseasePrevalenceHeatmap;
