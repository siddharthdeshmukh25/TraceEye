"use client";

import { useState, useEffect } from "react";
import { Zap, Battery, Sun, Power, Thermometer, Droplets, Cpu, RefreshCw } from "lucide-react";

type TelemetryData = {
  solar_input_voltage: number;
  battery_health: number;
  battery_level: number;
  grid_status: string;
  solar_status: string;
  temperature: number;
  humidity: number;
  power_load_watts: number;
  last_updated: string;
  unit_id: string;
  location: string;
};

export default function SolarTelemetryDashboard() {
  const [telemetry, setTelemetry] = useState<TelemetryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);

  const fetchTelemetry = async () => {
    try {
      const response = await fetch("/api/telemetry");
      if (!response.ok) throw new Error("Failed to fetch telemetry data");
      const data = await response.json();
      setTelemetry(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load telemetry");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTelemetry();
    if (autoRefresh) {
      const interval = setInterval(fetchTelemetry, 5000); // Refresh every 5 seconds
      return () => clearInterval(interval);
    }
  }, [autoRefresh]);

  const getStatusColor = (status: string) => {
    return status === "active" ? "text-emerald-600 bg-emerald-50" : "text-slate-500 bg-slate-100";
  };

  const getBatteryColor = (level: number) => {
    if (level > 60) return "text-emerald-600 bg-emerald-50";
    if (level > 30) return "text-amber-600 bg-amber-50";
    return "text-rose-600 bg-rose-50";
  };

  if (loading) {
    return (
      <div className="rounded-2xl border border-emerald-950/5 bg-white p-6">
        <div className="flex items-center justify-center py-8">
          <RefreshCw className="animate-spin text-forest" size={24} />
        </div>
      </div>
    );
  }

  if (error || !telemetry) {
    return (
      <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6">
        <p className="text-rose-800 font-medium">Error loading telemetry data</p>
        <p className="text-sm text-rose-600 mt-1">{error}</p>
        <button
          onClick={fetchTelemetry}
          className="mt-3 flex items-center gap-2 text-sm font-bold text-rose-700 hover:text-rose-800"
        >
          <RefreshCw size={14} /> Retry
        </button>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-emerald-950/5 bg-white p-6">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h2 className="text-lg font-bold text-forest">Solar Smart Storage Telemetry</h2>
          <p className="text-sm text-slate-500 mt-1">Real-time IoT monitoring for Cold Storage Unit</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
              autoRefresh ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-600"
            }`}
          >
            {autoRefresh ? "Auto-refresh ON" : "Auto-refresh OFF"}
          </button>
          <button
            onClick={fetchTelemetry}
            className="grid h-8 w-8 place-items-center rounded-lg border border-emerald-950/10 bg-white text-forest hover:bg-emerald-50"
          >
            <RefreshCw size={16} />
          </button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {/* Solar Input Voltage */}
        <div className="rounded-xl border border-emerald-950/5 bg-gradient-to-br from-amber-50 to-orange-50 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-amber-100 text-amber-600">
                <Zap size={20} />
              </div>
              <div>
                <p className="text-xs font-medium text-slate-500">Solar Input</p>
                <p className="text-lg font-bold text-forest">{telemetry.solar_input_voltage}V</p>
              </div>
            </div>
            <span className={`px-2 py-1 rounded-lg text-xs font-bold ${getStatusColor(telemetry.solar_status)}`}>
              {telemetry.solar_status}
            </span>
          </div>
        </div>

        {/* Battery Health */}
        <div className="rounded-xl border border-emerald-950/5 bg-gradient-to-br from-emerald-50 to-mint p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-emerald-100 text-emerald-600">
                <Battery size={20} />
              </div>
              <div>
                <p className="text-xs font-medium text-slate-500">Battery Health</p>
                <p className="text-lg font-bold text-forest">{telemetry.battery_health}%</p>
              </div>
            </div>
            <span className={`px-2 py-1 rounded-lg text-xs font-bold ${getBatteryColor(telemetry.battery_level)}`}>
              {telemetry.battery_level}%
            </span>
          </div>
        </div>

        {/* Power Source Status */}
        <div className="rounded-xl border border-emerald-950/5 bg-gradient-to-br from-blue-50 to-indigo-50 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-blue-100 text-blue-600">
                <Power size={20} />
              </div>
              <div>
                <p className="text-xs font-medium text-slate-500">Power Source</p>
                <p className="text-sm font-bold text-forest">
                  {telemetry.grid_status === "active" ? "Grid" : "Battery"}
                </p>
              </div>
            </div>
            <div className="flex gap-1">
              <span className={`px-2 py-1 rounded-lg text-xs font-bold ${getStatusColor(telemetry.grid_status)}`}>
                Grid: {telemetry.grid_status}
              </span>
              <span className={`px-2 py-1 rounded-lg text-xs font-bold ${getStatusColor(telemetry.solar_status)}`}>
                Solar: {telemetry.solar_status}
              </span>
            </div>
          </div>
        </div>

        {/* Temperature */}
        <div className="rounded-xl border border-emerald-950/5 bg-gradient-to-br from-cyan-50 to-sky-50 p-4">
          <div className="flex items-center gap-2">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-cyan-100 text-cyan-600">
              <Thermometer size={20} />
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500">Temperature</p>
              <p className="text-lg font-bold text-forest">{telemetry.temperature}°C</p>
            </div>
          </div>
        </div>

        {/* Humidity */}
        <div className="rounded-xl border border-emerald-950/5 bg-gradient-to-br from-teal-50 to-emerald-50 p-4">
          <div className="flex items-center gap-2">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-teal-100 text-teal-600">
              <Droplets size={20} />
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500">Humidity</p>
              <p className="text-lg font-bold text-forest">{telemetry.humidity}%</p>
            </div>
          </div>
        </div>

        {/* Power Load */}
        <div className="rounded-xl border border-emerald-950/5 bg-gradient-to-br from-purple-50 to-violet-50 p-4">
          <div className="flex items-center gap-2">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-purple-100 text-purple-600">
              <Cpu size={20} />
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500">Power Load</p>
              <p className="text-lg font-bold text-forest">{telemetry.power_load_watts}W</p>
            </div>
          </div>
        </div>
      </div>

      {/* Unit Info */}
      <div className="mt-4 pt-4 border-t border-emerald-950/5 flex items-center justify-between text-xs text-slate-500">
        <div className="flex items-center gap-4">
          <span className="font-medium">Unit: {telemetry.unit_id}</span>
          <span>{telemetry.location}</span>
        </div>
        <span>Last updated: {new Date(telemetry.last_updated).toLocaleTimeString()}</span>
      </div>
    </div>
  );
}