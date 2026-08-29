"use client";

import { useState } from "react";
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { Leaf, TrendingUp, Droplets, Sun, Sprout } from "lucide-react";

const vegetableData = [
  { month: "Jan", tomatoes: 1200, potatoes: 1800, onions: 1500, carrots: 900 },
  { month: "Feb", tomatoes: 1400, potatoes: 1700, onions: 1600, carrots: 950 },
  { month: "Mar", tomatoes: 1800, potatoes: 1600, onions: 1700, carrots: 1100 },
  { month: "Apr", tomatoes: 2200, potatoes: 1500, onions: 1800, carrots: 1300 },
  { month: "May", tomatoes: 2600, potatoes: 1400, onions: 1900, carrots: 1500 },
  { month: "Jun", tomatoes: 3000, potatoes: 1300, onions: 2000, carrots: 1700 },
  { month: "Jul", tomatoes: 3200, potatoes: 1200, onions: 2100, carrots: 1800 },
  { month: "Aug", tomatoes: 3100, potatoes: 1300, onions: 2000, carrots: 1750 },
  { month: "Sep", tomatoes: 2800, potatoes: 1400, onions: 1900, carrots: 1600 },
  { month: "Oct", tomatoes: 2400, potatoes: 1600, onions: 1800, carrots: 1400 },
  { month: "Nov", tomatoes: 2000, potatoes: 1700, onions: 1700, carrots: 1200 },
  { month: "Dec", tomatoes: 1600, potatoes: 1800, onions: 1600, carrots: 1000 },
];

const yieldData = [
  { plot: "Plot A", tomatoes: 85, potatoes: 92, onions: 78, carrots: 88 },
  { plot: "Plot B", tomatoes: 78, potatoes: 88, onions: 82, carrots: 90 },
  { plot: "Plot C", tomatoes: 92, potatoes: 85, onions: 90, carrots: 85 },
  { plot: "Plot D", tomatoes: 80, potatoes: 90, onions: 85, carrots: 92 },
];

export default function VegetablePlotDashboard() {
  const [selectedView, setSelectedView] = useState<"production" | "yield">("production");

  return (
    <div className="rounded-2xl border border-emerald-950/5 bg-white p-5">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div className="flex items-start gap-1.5">
          <div>
            <p className="text-xs font-bold tracking-[.15em] text-forest">
              VEGETABLE PLOTS
            </p>
            <h2 className="mt-2 text-lg font-bold">
              Production & Yield Analytics
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Monitor vegetable production across all farm plots
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setSelectedView("production")}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors ${
              selectedView === "production"
                ? "bg-forest text-white"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            Production
          </button>
          <button
            onClick={() => setSelectedView("yield")}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors ${
              selectedView === "yield"
                ? "bg-forest text-white"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            Yield %
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <div className="rounded-xl bg-red-50 p-3">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 rounded-lg bg-red-100 flex items-center justify-center">
              <Leaf size={16} className="text-red-600" />
            </div>
            <span className="text-xs font-medium text-slate-600">Tomatoes</span>
          </div>
          <p className="text-lg font-bold text-slate-800">27.2t</p>
          <p className="text-[10px] text-emerald-600 flex items-center gap-1">
            <TrendingUp size={10} /> +12%
          </p>
        </div>
        <div className="rounded-xl bg-amber-50 p-3">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center">
              <Sprout size={16} className="text-amber-600" />
            </div>
            <span className="text-xs font-medium text-slate-600">Potatoes</span>
          </div>
          <p className="text-lg font-bold text-slate-800">18.9t</p>
          <p className="text-[10px] text-emerald-600 flex items-center gap-1">
            <TrendingUp size={10} /> +8%
          </p>
        </div>
        <div className="rounded-xl bg-purple-50 p-3">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center">
              <Sun size={16} className="text-purple-600" />
            </div>
            <span className="text-xs font-medium text-slate-600">Onions</span>
          </div>
          <p className="text-lg font-bold text-slate-800">21.7t</p>
          <p className="text-[10px] text-emerald-600 flex items-center gap-1">
            <TrendingUp size={10} /> +15%
          </p>
        </div>
        <div className="rounded-xl bg-orange-50 p-3">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 rounded-lg bg-orange-100 flex items-center justify-center">
              <Droplets size={16} className="text-orange-600" />
            </div>
            <span className="text-xs font-medium text-slate-600">Carrots</span>
          </div>
          <p className="text-lg font-bold text-slate-800">15.4t</p>
          <p className="text-[10px] text-emerald-600 flex items-center gap-1">
            <TrendingUp size={10} /> +10%
          </p>
        </div>
      </div>

      {/* Chart */}
      <div className="h-64">
        {selectedView === "production" ? (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={vegetableData}>
              <defs>
                <linearGradient id="colorTomatoes" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ef4444" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorPotatoes" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorOnions" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorCarrots" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f97316" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="month" stroke="#64748b" fontSize={12} />
              <YAxis stroke="#64748b" fontSize={12} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "white",
                  border: "1px solid #e5e7eb",
                  borderRadius: "8px",
                }}
              />
              <Legend />
              <Area
                type="monotone"
                dataKey="tomatoes"
                stroke="#ef4444"
                fillOpacity={1}
                fill="url(#colorTomatoes)"
                name="Tomatoes (kg)"
              />
              <Area
                type="monotone"
                dataKey="potatoes"
                stroke="#f59e0b"
                fillOpacity={1}
                fill="url(#colorPotatoes)"
                name="Potatoes (kg)"
              />
              <Area
                type="monotone"
                dataKey="onions"
                stroke="#8b5cf6"
                fillOpacity={1}
                fill="url(#colorOnions)"
                name="Onions (kg)"
              />
              <Area
                type="monotone"
                dataKey="carrots"
                stroke="#f97316"
                fillOpacity={1}
                fill="url(#colorCarrots)"
                name="Carrots (kg)"
              />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={yieldData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="plot" stroke="#64748b" fontSize={12} />
              <YAxis stroke="#64748b" fontSize={12} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "white",
                  border: "1px solid #e5e7eb",
                  borderRadius: "8px",
                }}
              />
              <Legend />
              <Bar dataKey="tomatoes" fill="#ef4444" name="Tomatoes %" />
              <Bar dataKey="potatoes" fill="#f59e0b" name="Potatoes %" />
              <Bar dataKey="onions" fill="#8b5cf6" name="Onions %" />
              <Bar dataKey="carrots" fill="#f97316" name="Carrots %" />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
