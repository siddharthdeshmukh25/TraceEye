"use client";

import { Boxes, Truck, ShieldCheck, ShoppingBag, Thermometer, MapPin, FileText, Leaf } from "lucide-react";
import { type Persona } from "./persona-toggle";

interface PersonaDashboardProps {
  persona: Persona;
}

export default function PersonaDashboard({ persona }: PersonaDashboardProps) {
  const renderPersonaWidgets = () => {
    switch (persona) {
      case 'farmer':
        return (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <FarmerWidget />
            <FarmerWidget />
            <FarmerWidget />
            <FarmerWidget />
          </div>
        );

      case 'logistics':
        return (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <LogisticsWidget />
            <LogisticsWidget />
            <LogisticsWidget />
            <LogisticsWidget />
          </div>
        );

      case 'regulator':
        return (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <RegulatorWidget />
            <RegulatorWidget />
            <RegulatorWidget />
            <RegulatorWidget />
          </div>
        );

      case 'consumer':
        return (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <ConsumerWidget />
            <ConsumerWidget />
            <ConsumerWidget />
            <ConsumerWidget />
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="mt-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-bold text-forest uppercase tracking-wide">
          {persona.charAt(0).toUpperCase() + persona.slice(1)} Dashboard
        </h3>
      </div>
      {renderPersonaWidgets()}
    </div>
  );
}

function FarmerWidget() {
  return (
    <div className="rounded-xl border border-emerald-950/5 bg-gradient-to-br from-green-50 to-emerald-50 p-4">
      <div className="flex items-center gap-2 mb-3">
        <div className="grid h-8 w-8 place-items-center rounded-lg bg-emerald-100 text-emerald-600">
          <Leaf size={16} />
        </div>
        <h4 className="font-bold text-forest text-sm">Harvest Data</h4>
      </div>
      <div className="space-y-2">
        <div className="flex justify-between text-xs">
          <span className="text-slate-500">Today's Harvest</span>
          <span className="font-bold text-forest">2,450 kg</span>
        </div>
        <div className="flex justify-between text-xs">
          <span className="text-slate-500">Quality Grade</span>
          <span className="font-bold text-emerald-600">Grade A</span>
        </div>
        <div className="flex justify-between text-xs">
          <span className="text-slate-500">Storage Status</span>
          <span className="font-bold text-emerald-600">Optimal</span>
        </div>
      </div>
    </div>
  );
}

function LogisticsWidget() {
  return (
    <div className="rounded-xl border border-emerald-950/5 bg-gradient-to-br from-blue-50 to-indigo-50 p-4">
      <div className="flex items-center gap-2 mb-3">
        <div className="grid h-8 w-8 place-items-center rounded-lg bg-blue-100 text-blue-600">
          <Truck size={16} />
        </div>
        <h4 className="font-bold text-forest text-sm">Transit Monitor</h4>
      </div>
      <div className="space-y-2">
        <div className="flex justify-between text-xs">
          <span className="text-slate-500">Active Shipments</span>
          <span className="font-bold text-forest">12</span>
        </div>
        <div className="flex justify-between text-xs">
          <span className="text-slate-500">Temperature Alerts</span>
          <span className="font-bold text-amber-600">2</span>
        </div>
        <div className="flex justify-between text-xs">
          <span className="text-slate-500">On-Time Rate</span>
          <span className="font-bold text-emerald-600">94%</span>
        </div>
      </div>
    </div>
  );
}

function RegulatorWidget() {
  return (
    <div className="rounded-xl border border-emerald-950/5 bg-gradient-to-br from-purple-50 to-violet-50 p-4">
      <div className="flex items-center gap-2 mb-3">
        <div className="grid h-8 w-8 place-items-center rounded-lg bg-purple-100 text-purple-600">
          <ShieldCheck size={16} />
        </div>
        <h4 className="font-bold text-forest text-sm">Compliance Status</h4>
      </div>
      <div className="space-y-2">
        <div className="flex justify-between text-xs">
          <span className="text-slate-500">Certified Batches</span>
          <span className="font-bold text-forest">156</span>
        </div>
        <div className="flex justify-between text-xs">
          <span className="text-slate-500">Pending Audits</span>
          <span className="font-bold text-amber-600">8</span>
        </div>
        <div className="flex justify-between text-xs">
          <span className="text-slate-500">Compliance Rate</span>
          <span className="font-bold text-emerald-600">98.5%</span>
        </div>
      </div>
    </div>
  );
}

function ConsumerWidget() {
  return (
    <div className="rounded-xl border border-emerald-950/5 bg-gradient-to-br from-amber-50 to-orange-50 p-4">
      <div className="flex items-center gap-2 mb-3">
        <div className="grid h-8 w-8 place-items-center rounded-lg bg-amber-100 text-amber-600">
          <ShoppingBag size={16} />
        </div>
        <h4 className="font-bold text-forest text-sm">Product Journey</h4>
      </div>
      <div className="space-y-2">
        <div className="flex justify-between text-xs">
          <span className="text-slate-500">Freshness Score</span>
          <span className="font-bold text-emerald-600">9.2/10</span>
        </div>
        <div className="flex justify-between text-xs">
          <span className="text-slate-500">Origin</span>
          <span className="font-bold text-forest">Local Farm</span>
        </div>
        <div className="flex justify-between text-xs">
          <span className="text-slate-500">Sustainability</span>
          <span className="font-bold text-emerald-600">Eco-Friendly</span>
        </div>
      </div>
    </div>
  );
}