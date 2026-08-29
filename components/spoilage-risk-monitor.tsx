"use client";

import { useState } from "react";
import { AlertTriangle, ShieldCheck, Clock, Battery, Thermometer, Info } from "lucide-react";
import {
  calculateSpoilageRisk,
  getRiskLevelColor,
  getRiskLevelDescription,
  type SpoilageRiskResult
} from "@/lib/spoilage-calculator";

interface SpoilageRiskMonitorProps {
  temperature?: number;
  timeHours?: number;
  batteryLevel?: number;
  storageMinTemp?: number;
  storageMaxTemp?: number;
}

export default function SpoilageRiskMonitor({
  temperature = 6,
  timeHours = 2,
  batteryLevel = 75,
  storageMinTemp = 2,
  storageMaxTemp = 8
}: SpoilageRiskMonitorProps) {
  const [customTemp, setCustomTemp] = useState(temperature);
  const [customTime, setCustomTime] = useState(timeHours);
  const [customBattery, setCustomBattery] = useState(batteryLevel);

  const riskResult: SpoilageRiskResult = calculateSpoilageRisk(
    customTemp,
    customTime,
    customBattery,
    storageMinTemp,
    storageMaxTemp
  );

  const getRiskIcon = (level: string) => {
    switch (level) {
      case 'low':
        return <ShieldCheck size={20} className="text-emerald-600" />;
      case 'medium':
        return <AlertTriangle size={20} className="text-amber-600" />;
      case 'high':
        return <AlertTriangle size={20} className="text-orange-600" />;
      case 'critical':
        return <AlertTriangle size={20} className="text-rose-600" />;
      default:
        return <Info size={20} className="text-slate-600" />;
    }
  };

  return (
    <div className="rounded-2xl border border-emerald-950/5 bg-white p-6">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h2 className="text-lg font-bold text-forest">Dynamic Spoilage Index</h2>
          <p className="text-sm text-slate-500 mt-1">Real-time spoilage risk & thermal holdover monitoring</p>
        </div>
        <div className={`px-3 py-1.5 rounded-lg text-xs font-bold ${getRiskLevelColor(riskResult.riskLevel)}`}>
          {riskResult.riskLevel.toUpperCase()} RISK
        </div>
      </div>

      {/* Risk Level Display */}
      <div className={`rounded-xl border p-4 mb-4 ${
        riskResult.riskLevel === 'critical' ? 'border-rose-200 bg-rose-50' :
        riskResult.riskLevel === 'high' ? 'border-orange-200 bg-orange-50' :
        riskResult.riskLevel === 'medium' ? 'border-amber-200 bg-amber-50' :
        'border-emerald-200 bg-emerald-50'
      }`}>
        <div className="flex items-center gap-3">
          {getRiskIcon(riskResult.riskLevel)}
          <div className="flex-1">
            <p className="font-bold text-forest">{getRiskLevelDescription(riskResult.riskLevel)}</p>
            <p className="text-sm text-slate-600">Spoilage Index: {riskResult.spoilageIndex}/100</p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-forest">{riskResult.spoilageIndex}</p>
            <p className="text-xs text-slate-500">Index Score</p>
          </div>
        </div>
      </div>

      {/* Thermal Holdover Warning */}
      {riskResult.thermalHoldoverMessage && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 mb-4">
          <div className="flex items-start gap-3">
            <div className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-rose-100">
              <Clock size={16} className="text-rose-600" />
            </div>
            <div className="flex-1">
              <p className="font-bold text-rose-900">Thermal Holdover Alert</p>
              <p className="text-sm text-rose-800 mt-1">{riskResult.thermalHoldoverMessage}</p>
            </div>
          </div>
        </div>
      )}

      {/* Risk Factors */}
      {riskResult.riskFactors.length > 0 && (
        <div className="rounded-xl border border-emerald-950/5 bg-slate-50 p-4 mb-4">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">Risk Factors</p>
          <ul className="space-y-1">
            {riskResult.riskFactors.map((factor, index) => (
              <li key={index} className="text-sm text-slate-700 flex items-start gap-2">
                <span className="text-rose-500 mt-0.5">•</span>
                {factor}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Interactive Controls */}
      <div className="border-t border-emerald-950/5 pt-4">
        <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-3">Simulation Controls</p>
        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <label className="text-sm font-medium text-slate-700 flex items-center gap-2">
              <Thermometer size={14} />
              Temperature (°C)
            </label>
            <input
              type="number"
              step="0.1"
              value={customTemp}
              onChange={(e) => setCustomTemp(parseFloat(e.target.value) || 0)}
              className="mt-1 w-full rounded-lg border border-emerald-950/10 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700 flex items-center gap-2">
              <Clock size={14} />
              Exposure Time (hrs)
            </label>
            <input
              type="number"
              step="0.5"
              value={customTime}
              onChange={(e) => setCustomTime(parseFloat(e.target.value) || 0)}
              className="mt-1 w-full rounded-lg border border-emerald-950/10 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700 flex items-center gap-2">
              <Battery size={14} />
              Battery Level (%)
            </label>
            <input
              type="number"
              min="0"
              max="100"
              value={customBattery}
              onChange={(e) => setCustomBattery(Math.min(100, Math.max(0, parseFloat(e.target.value) || 0)))}
              className="mt-1 w-full rounded-lg border border-emerald-950/10 px-3 py-2 text-sm"
            />
          </div>
        </div>
      </div>
    </div>
  );
}