"use client";

import { useState, useEffect } from "react";
import {
  Leaf,
  AlertTriangle,
  CheckCircle2,
  Zap,
  Battery,
  Thermometer,
  RefreshCw,
  QrCode,
  Box,
  ShieldCheck,
  Bell,
  Sun,
  Power,
  Activity,
  TrendingUp,
  Clock,
  MapPin,
  ChevronRight,
  X,
  Menu,
  LogOut,
  Settings,
  User,
  ExternalLink,
  Package,
  Truck,
  FileText
} from "lucide-react";
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Legend
} from "recharts";

type BatchMetrics = {
  total: number;
  safe: number;
  atRisk: number;
  critical: number;
  tracked: number;
};

type SolarMetrics = {
  units: number;
  avgBattery: number;
  backupHours: number;
  currentSolar: number;
  surplus: number;
  batteryReserve: number;
  estBackup: string;
};

type Incident = {
  id: string;
  severity: "low" | "medium" | "high" | "critical";
  title: string;
  message: string;
  batchId: string;
  time: string;
};

type TemperatureData = {
  time: string;
  cs01: number;
  cs02: number;
  safeMin: number;
  safeMax: number;
};

type SolarData = {
  time: string;
  generation: number;
  consumption: number;
};

export default function FarmSafeDashboard() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userRole, setUserRole] = useState("farmer");
  const [systemStatus, setSystemStatus] = useState<"operational" | "degraded" | "offline">("operational");
  
  // Mock data - replace with real API calls
  const [batchMetrics, setBatchMetrics] = useState<BatchMetrics>({
    total: 5,
    safe: 3,
    atRisk: 1,
    critical: 1,
    tracked: 100
  });

  const [solarMetrics, setSolarMetrics] = useState<SolarMetrics>({
    units: 3,
    avgBattery: 78,
    backupHours: 8.5,
    currentSolar: 540,
    surplus: 230,
    batteryReserve: 86,
    estBackup: "8h 30m"
  });

  const [incidents, setIncidents] = useState<Incident[]>([
    {
      id: "1",
      severity: "critical",
      title: "Temperature Spike Detected",
      message: "CS-02 Nashik exceeded safe limits",
      batchId: "CS-02",
      time: "2 hours ago"
    },
    {
      id: "2",
      severity: "medium",
      title: "Battery Low Warning",
      message: "Unit CS-03 battery at 25%",
      batchId: "CS-03",
      time: "4 hours ago"
    },
    {
      id: "3",
      severity: "low",
      title: "Humidity Alert",
      message: "CS-01 humidity above threshold",
      batchId: "CS-01",
      time: "6 hours ago"
    }
  ]);

  const [temperatureData, setTemperatureData] = useState<TemperatureData[]>([
    { time: "04:00", cs01: 4.5, cs02: 4.2, safeMin: 2, safeMax: 8 },
    { time: "06:00", cs01: 4.8, cs02: 5.1, safeMin: 2, safeMax: 8 },
    { time: "08:00", cs01: 5.2, cs02: 6.5, safeMin: 2, safeMax: 8 },
    { time: "10:00", cs01: 5.5, cs02: 9.2, safeMin: 2, safeMax: 8 },
    { time: "12:00", cs01: 5.8, cs02: 11.5, safeMin: 2, safeMax: 8 },
    { time: "14:00", cs01: 5.6, cs02: 10.8, safeMin: 2, safeMax: 8 },
    { time: "16:00", cs01: 5.3, cs02: 8.9, safeMin: 2, safeMax: 8 },
    { time: "18:00", cs01: 5.0, cs02: 6.2, safeMin: 2, safeMax: 8 },
  ]);

  const [solarData, setSolarData] = useState<SolarData[]>([
    { time: "06:00", generation: 120, consumption: 200 },
    { time: "08:00", generation: 350, consumption: 220 },
    { time: "10:00", generation: 480, consumption: 250 },
    { time: "12:00", generation: 540, consumption: 310 },
    { time: "14:00", generation: 520, consumption: 290 },
    { time: "16:00", generation: 420, consumption: 260 },
    { time: "18:00", generation: 280, consumption: 240 },
  ]);

  const compliancePercentage = Math.round((batchMetrics.safe / batchMetrics.total) * 100);

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "critical": return "bg-rose-500";
      case "high": return "bg-orange-500";
      case "medium": return "bg-amber-500";
      case "low": return "bg-blue-500";
      default: return "bg-slate-500";
    }
  };

  const getSeverityBg = (severity: string) => {
    switch (severity) {
      case "critical": return "bg-rose-50 border-rose-200";
      case "high": return "bg-orange-50 border-orange-200";
      case "medium": return "bg-amber-50 border-amber-200";
      case "low": return "bg-blue-50 border-blue-200";
      default: return "bg-slate-50 border-slate-200";
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-emerald-50">
      {/* Top Navigation Bar */}
      <nav className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <div className="grid h-10 w-10 place-items-center rounded-full bg-emerald-500 text-white">
                  <Leaf size={20} />
                </div>
                <div>
                  <span className="font-bold text-lg text-slate-900">FS FarmSafe</span>
                  <span className="text-xs text-slate-500 block -mt-1">Warehouse Manager</span>
                </div>
              </div>
            </div>

            {/* System Status */}
            <div className="hidden md:flex items-center gap-2">
              <div className={`h-2 w-2 rounded-full ${systemStatus === "operational" ? "bg-emerald-500" : "bg-amber-500"}`} />
              <span className="text-sm font-medium text-slate-700 capitalize">{systemStatus}</span>
            </div>

            {/* Action Buttons */}
            <div className="hidden md:flex items-center gap-2">
              <button className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-200 bg-white text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors">
                <Activity size={16} />
                Simulate Sensors
              </button>
              <button className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-200 bg-white text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors">
                <QrCode size={16} />
                Scan Batch QR
              </button>
              <button className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-200 bg-white text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors">
                <RefreshCw size={16} />
                Reset Demo
              </button>
            </div>

            {/* User Role & Menu */}
            <div className="flex items-center gap-3">
              <select
                value={userRole}
                onChange={(e) => setUserRole(e.target.value)}
                className="px-3 py-2 rounded-lg border border-slate-200 bg-white text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="farmer">Farmer / Producer</option>
                <option value="warehouse">Warehouse Manager</option>
                <option value="transport">Transport Logistics</option>
                <option value="retailer">Retailer</option>
              </select>
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden p-2 rounded-lg border border-slate-200 bg-white text-slate-700"
              >
                {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-slate-200 bg-white px-4 py-3 space-y-2">
            <button className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50">
              <Activity size={16} /> Simulate Sensors
            </button>
            <button className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50">
              <QrCode size={16} /> Scan Batch QR
            </button>
            <button className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50">
              <RefreshCw size={16} /> Reset Demo
            </button>
          </div>
        )}
      </nav>

      {/* Main Navigation Tabs */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-1 overflow-x-auto py-2">
            <button
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors bg-emerald-100 text-emerald-700`}
            >
              <Box size={16} />
              Dashboard
            </button>
            <button
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors text-slate-600 hover:bg-slate-100`}
            >
              <Package size={16} />
              Produce Batches
            </button>
            <button
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors text-slate-600 hover:bg-slate-100`}
            >
              <Thermometer size={16} />
              Cold Storage
            </button>
            <button
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors text-slate-600 hover:bg-slate-100`}
            >
              <Sun size={16} />
              Solar Microgrid
            </button>
            <button
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors text-slate-600 hover:bg-slate-100`}
            >
              <Truck size={16} />
              Transport Reefer
            </button>
            <button
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors text-slate-600 hover:bg-slate-100`}
            >
              <ShieldCheck size={16} />
              Traceability & Trust
            </button>
            <button
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors text-slate-600 hover:bg-slate-100`}
            >
              <Bell size={16} />
              Alerts
            </button>
            <button
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors text-slate-600 hover:bg-slate-100`}
            >
              <FileText size={16} />
              Audit & Compliance
            </button>
            <button
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors text-slate-600 hover:bg-slate-100`}
            >
              <QrCode size={16} />
              Public QR Verify
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex items-center gap-2 text-xs font-bold tracking-widest text-emerald-700 mb-2">
            <ShieldCheck size={16} />
            FOOD SAFETY & COLD-CHAIN LOGISTICS
          </div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">
            Cold-Chain Integrity & Traceability Platform
          </h1>
          <p className="text-slate-600 max-w-2xl">
            Real-time monitoring across solar-powered smart storage, reefer transport logistics, and end-to-end cryptographic food journey verification.
          </p>
        </div>

        {/* Core Platform Answers */}
        <div className="grid gap-4 md:grid-cols-2 mb-8">
          <div className="bg-white rounded-2xl border border-slate-200 p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500 mb-1">Is produce stored safely?</p>
                <p className="text-2xl font-bold text-slate-900">
                  {compliancePercentage}% Compliant ({batchMetrics.safe}/{batchMetrics.total} Batches Safe)
                </p>
              </div>
              <div className={`h-12 w-12 rounded-xl flex items-center justify-center ${
                compliancePercentage >= 80 ? "bg-emerald-100 text-emerald-600" :
                compliancePercentage >= 60 ? "bg-amber-100 text-amber-600" :
                "bg-rose-100 text-rose-600"
              }`}>
                {compliancePercentage >= 80 ? <CheckCircle2 size={24} /> : <AlertTriangle size={24} />}
              </div>
            </div>
          </div>
          <div className="bg-white rounded-2xl border border-slate-200 p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500 mb-1">Where has this batch been?</p>
                <p className="text-2xl font-bold text-emerald-600">Verified Farm-to-Consumer Hash Chain Active</p>
              </div>
              <div className="h-12 w-12 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center">
                <ShieldCheck size={24} />
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-3 mb-8">
          <button className="flex items-center gap-2 px-5 py-3 rounded-xl bg-emerald-600 text-white font-medium hover:bg-emerald-700 transition-colors shadow-lg shadow-emerald-200">
            <Box size={20} />
            Create Produce Batch
          </button>
          <button className="flex items-center gap-2 px-5 py-3 rounded-xl bg-white border border-slate-200 text-slate-700 font-medium hover:bg-slate-50 transition-colors">
            <Activity size={20} />
            Simulate Sensor Telemetry
          </button>
          <button className="flex items-center gap-2 px-5 py-3 rounded-xl bg-white border border-slate-200 text-slate-700 font-medium hover:bg-slate-50 transition-colors">
            <Sun size={20} />
            Solar Storage Microgrid
          </button>
          <button className="flex items-center gap-2 px-5 py-3 rounded-xl bg-white border border-slate-200 text-slate-700 font-medium hover:bg-slate-50 transition-colors">
            <QrCode size={20} />
            Public Batch QR Scanner
          </button>
        </div>

        {/* Key Metrics */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
          {/* Active Produce Batches */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-10 w-10 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center">
                <Box size={20} />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-500">Active Produce Batches</p>
                <p className="text-2xl font-bold text-slate-900">{batchMetrics.total}</p>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-600">100% Tracked</span>
                <CheckCircle2 size={16} className="text-emerald-500" />
              </div>
              <div className="flex items-center gap-4 text-xs">
                <span className="flex items-center gap-1 text-emerald-600">
                  <div className="h-2 w-2 rounded-full bg-emerald-500" />
                  Safe: {batchMetrics.safe}
                </span>
                <span className="flex items-center gap-1 text-amber-600">
                  <div className="h-2 w-2 rounded-full bg-amber-500" />
                  At Risk: {batchMetrics.atRisk}
                </span>
                <span className="flex items-center gap-1 text-rose-600">
                  <div className="h-2 w-2 rounded-full bg-rose-500" />
                  Critical: {batchMetrics.critical}
                </span>
              </div>
            </div>
          </div>

          {/* Cold-Chain Compliance */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-10 w-10 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center">
                <Thermometer size={20} />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-500">Cold-Chain Compliance</p>
                <p className="text-2xl font-bold text-slate-900">{compliancePercentage}%</p>
              </div>
            </div>
            <div className="space-y-2">
              <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${
                    compliancePercentage >= 80 ? "bg-emerald-500" :
                    compliancePercentage >= 60 ? "bg-amber-500" :
                    "bg-rose-500"
                  }`}
                  style={{ width: `${compliancePercentage}%` }}
                />
              </div>
              <p className={`text-xs font-medium ${
                compliancePercentage >= 80 ? "text-emerald-600" :
                compliancePercentage >= 60 ? "text-amber-600" :
                "text-rose-600"
              }`}>
                {compliancePercentage >= 80 ? "Excellent" : compliancePercentage >= 60 ? "Needs Action" : "Critical"}
              </p>
            </div>
          </div>

          {/* Solar Storage Units */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-10 w-10 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center">
                <Sun size={20} />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-500">Solar Storage Units</p>
                <p className="text-2xl font-bold text-slate-900">{solarMetrics.units}</p>
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-sm text-slate-600">Solar Microgrid</p>
              <div className="flex items-center gap-2">
                <Battery size={16} className="text-emerald-500" />
                <span className="text-sm font-medium text-slate-700">
                  Avg Battery: {solarMetrics.avgBattery}% SOC ({solarMetrics.backupHours}h backup)
                </span>
              </div>
            </div>
          </div>

          {/* Active Incidents */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-10 w-10 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center">
                <Bell size={20} />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-500">Active Incidents</p>
                <p className="text-2xl font-bold text-slate-900">{incidents.length}</p>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className={`h-2 w-2 rounded-full ${incidents.filter(i => i.severity === "critical").length > 0 ? "bg-rose-500" : "bg-slate-300"}`} />
                <span className="text-sm text-slate-600">{incidents.filter(i => i.severity === "critical").length} Critical</span>
              </div>
              <button className="text-sm font-medium text-emerald-600 hover:text-emerald-700 flex items-center gap-1">
                View alert queue <ChevronRight size={14} />
              </button>
            </div>
          </div>
        </div>

        {/* Graphs Section */}
        <div className="grid gap-6 lg:grid-cols-2 mb-8">
          {/* Temperature Stability Graph */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Cold-Chain Temperature Stability vs Safe Limits</h3>
                <p className="text-sm text-slate-500 mt-1">Real-time temperature monitoring across storage units</p>
              </div>
              <button className="p-2 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors">
                <RefreshCw size={16} className="text-slate-600" />
              </button>
            </div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={temperatureData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis 
                    dataKey="time" 
                    stroke="#64748b"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis 
                    stroke="#64748b"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    domain={[0, 14]}
                  />
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: "white",
                      border: "1px solid #e2e8f0",
                      borderRadius: "8px",
                    }}
                  />
                  <Legend />
                  <ReferenceLine y={8} stroke="#ef4444" strokeDasharray="3 3" label={{ value: "Max Safe (8°C)", position: "right", fill: "#ef4444", fontSize: 11 }} />
                  <ReferenceLine y={2} stroke="#3b82f6" strokeDasharray="3 3" label={{ value: "Min Safe (2°C)", position: "right", fill: "#3b82f6", fontSize: 11 }} />
                  <Area
                    type="monotone"
                    dataKey="safeMax"
                    stroke="#10b981"
                    fill="#10b981"
                    fillOpacity={0.1}
                    name="Safe Zone"
                  />
                  <Line
                    type="monotone"
                    dataKey="cs01"
                    stroke="#10b981"
                    strokeWidth={2}
                    dot={{ fill: "#10b981", strokeWidth: 2, r: 4 }}
                    name="CS-01 Alpha (Safe)"
                  />
                  <Line
                    type="monotone"
                    dataKey="cs02"
                    stroke="#f59e0b"
                    strokeWidth={2}
                    dot={{ fill: "#f59e0b", strokeWidth: 2, r: 4 }}
                    name="CS-02 Nashik (Spike)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-4 flex items-center gap-4 text-xs">
              <span className="flex items-center gap-1">
                <div className="h-3 w-3 rounded-full bg-emerald-500" />
                CS-01 Alpha (Safe)
              </span>
              <span className="flex items-center gap-1">
                <div className="h-3 w-3 rounded-full bg-amber-500" />
                CS-02 Nashik (Spike)
              </span>
              <span className="flex items-center gap-1">
                <div className="h-3 w-3 rounded-full bg-emerald-200" />
                Safe Zone (2-8°C)
              </span>
            </div>
          </div>

          {/* Solar Power Graph */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-lg font-bold text-slate-900">Solar Storage Power</h3>
                  <span className="px-2 py-1 rounded-full bg-emerald-100 text-emerald-700 text-xs font-bold">
                    100% OFF-GRID READY
                  </span>
                </div>
                <p className="text-sm text-slate-500">Real-time solar MPPT generation and battery backup runtime</p>
              </div>
              <button className="p-2 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors">
                <RefreshCw size={16} className="text-slate-600" />
              </button>
            </div>
            
            {/* Solar Metrics */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-amber-50 rounded-xl p-4 border border-amber-200">
                <div className="flex items-center gap-2 mb-2">
                  <Sun size={16} className="text-amber-600" />
                  <span className="text-sm font-medium text-slate-600">Current Solar PV</span>
                </div>
                <p className="text-xl font-bold text-slate-900">{solarMetrics.currentSolar} W</p>
                <p className="text-xs text-emerald-600 font-medium">Surplus (+{solarMetrics.surplus}W)</p>
              </div>
              <div className="bg-emerald-50 rounded-xl p-4 border border-emerald-200">
                <div className="flex items-center gap-2 mb-2">
                  <Battery size={16} className="text-emerald-600" />
                  <span className="text-sm font-medium text-slate-600">Battery Reserve</span>
                </div>
                <p className="text-xl font-bold text-slate-900">{solarMetrics.batteryReserve}% SOC</p>
                <p className="text-xs text-emerald-600 font-medium">Est. Backup: {solarMetrics.estBackup}</p>
              </div>
            </div>

            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={solarData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis 
                    dataKey="time" 
                    stroke="#64748b"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis 
                    stroke="#64748b"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: "white",
                      border: "1px solid #e2e8f0",
                      borderRadius: "8px",
                    }}
                  />
                  <Legend />
                  <Area
                    type="monotone"
                    dataKey="generation"
                    stroke="#f59e0b"
                    fill="#f59e0b"
                    fillOpacity={0.3}
                    name="Solar Generation (W)"
                  />
                  <Area
                    type="monotone"
                    dataKey="consumption"
                    stroke="#3b82f6"
                    fill="#3b82f6"
                    fillOpacity={0.3}
                    name="Consumption (W)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Recent Incidents */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-bold text-slate-900">Recent Incidents</h3>
              <p className="text-sm text-slate-500 mt-1">Latest alerts requiring attention</p>
            </div>
            <button className="text-sm font-medium text-emerald-600 hover:text-emerald-700 flex items-center gap-1">
              View all <ChevronRight size={14} />
            </button>
          </div>
          <div className="space-y-3">
            {incidents.map((incident) => (
              <div
                key={incident.id}
                className={`rounded-xl border p-4 ${getSeverityBg(incident.severity)}`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div className={`h-8 w-8 rounded-full ${getSeverityColor(incident.severity)} flex items-center justify-center text-white`}>
                      <AlertTriangle size={16} />
                    </div>
                    <div>
                      <p className="font-medium text-slate-900">{incident.title}</p>
                      <p className="text-sm text-slate-600 mt-1">{incident.message}</p>
                      <div className="flex items-center gap-3 mt-2 text-xs text-slate-500">
                        <span className="flex items-center gap-1">
                          <Box size={12} />
                          {incident.batchId}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock size={12} />
                          {incident.time}
                        </span>
                      </div>
                    </div>
                  </div>
                  <button className="text-sm font-medium text-slate-700 hover:text-slate-900">
                    Resolve
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
