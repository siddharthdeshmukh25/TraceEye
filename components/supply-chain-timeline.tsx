"use client";

import { PackageCheck, Sun, Truck, Store, MapPin, Thermometer, CheckCircle2, Clock, ShieldCheck } from "lucide-react";

export interface SupplyChainStage {
  id: string;
  title: string;
  subtitle: string;
  icon: any;
  status: 'completed' | 'in_progress' | 'pending';
  timestamp?: string;
  details?: {
    temperature?: number;
    location?: string;
    batteryLevel?: number;
    solarStatus?: string;
    gpsCoordinates?: string;
  };
}

interface SupplyChainTimelineProps {
  stages: SupplyChainStage[];
}

export default function SupplyChainTimeline({ stages }: SupplyChainTimelineProps) {
  const getStageColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-emerald-500 text-white border-emerald-500';
      case 'in_progress':
        return 'bg-amber-500 text-white border-amber-500';
      case 'pending':
        return 'bg-slate-200 text-slate-400 border-slate-200';
      default:
        return 'bg-slate-200 text-slate-400 border-slate-200';
    }
  };

  const getLineColor = (index: number, totalStages: number) => {
    if (index === totalStages - 1) return 'bg-slate-200';
    const currentStage = stages[index];
    return currentStage.status === 'completed' ? 'bg-emerald-500' : 'bg-slate-200';
  };

  return (
    <div className="rounded-2xl border border-emerald-950/5 bg-white p-6">
      <h2 className="text-lg font-bold text-forest mb-6">Supply Chain Journey</h2>
      
      <div className="relative">
        {/* Vertical Line */}
        <div className="absolute left-[19px] top-8 bottom-8 w-0.5 bg-slate-200">
          {stages.slice(0, -1).map((stage, index) => (
            <div
              key={`line-${index}`}
              className={`absolute left-0 w-0.5 ${getLineColor(index, stages.length)}`}
              style={{ top: `${index * 140}px`, height: '110px' }}
            />
          ))}
        </div>

        {/* Stages */}
        <div className="space-y-6">
          {stages.map((stage, index) => (
            <div key={stage.id} className="relative flex gap-4">
              {/* Stage Icon */}
              <div className={`relative z-10 grid h-10 w-10 shrink-0 place-items-center rounded-full border-2 ${getStageColor(stage.status)}`}>
                <stage.icon size={18} />
              </div>

              {/* Stage Content */}
              <div className="flex-1 pb-6">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-forest">{stage.title}</h3>
                      {stage.status === 'completed' && (
                        <span className="flex items-center gap-1 text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">
                          <CheckCircle2 size={10} />
                          Verified
                        </span>
                      )}
                      {stage.status === 'in_progress' && (
                        <span className="flex items-center gap-1 text-xs font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded">
                          <Clock size={10} />
                          In Progress
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-slate-600 mt-1">{stage.subtitle}</p>
                    {stage.timestamp && (
                      <p className="text-xs text-slate-400 mt-1">{stage.timestamp}</p>
                    )}
                  </div>
                </div>

                {/* Stage Details */}
                {stage.details && (
                  <div className="mt-3 grid gap-2 sm:grid-cols-2">
                    {stage.details.temperature && (
                      <div className="flex items-center gap-2 text-xs bg-emerald-50 rounded-lg px-3 py-2">
                        <Thermometer size={12} className="text-emerald-600" />
                        <span className="text-slate-700">Temp: {stage.details.temperature}°C</span>
                      </div>
                    )}
                    {stage.details.location && (
                      <div className="flex items-center gap-2 text-xs bg-blue-50 rounded-lg px-3 py-2">
                        <MapPin size={12} className="text-blue-600" />
                        <span className="text-slate-700">{stage.details.location}</span>
                      </div>
                    )}
                    {stage.details.batteryLevel && (
                      <div className="flex items-center gap-2 text-xs bg-amber-50 rounded-lg px-3 py-2">
                        <ShieldCheck size={12} className="text-amber-600" />
                        <span className="text-slate-700">Battery: {stage.details.batteryLevel}%</span>
                      </div>
                    )}
                    {stage.details.solarStatus && (
                      <div className="flex items-center gap-2 text-xs bg-orange-50 rounded-lg px-3 py-2">
                        <Sun size={12} className="text-orange-600" />
                        <span className="text-slate-700">Solar: {stage.details.solarStatus}</span>
                      </div>
                    )}
                    {stage.details.gpsCoordinates && (
                      <div className="flex items-center gap-2 text-xs bg-purple-50 rounded-lg px-3 py-2">
                        <MapPin size={12} className="text-purple-600" />
                        <span className="text-slate-700">GPS: {stage.details.gpsCoordinates}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Helper function to create mock supply chain data for testing
export function createMockSupplyChainData(): SupplyChainStage[] {
  return [
    {
      id: 'harvest',
      title: 'Harvest',
      subtitle: 'Green Valley Farms, Nashik',
      icon: PackageCheck,
      status: 'completed',
      timestamp: '2024-01-15 06:30 AM',
      details: {
        location: 'Nashik, Maharashtra',
        temperature: 18
      }
    },
    {
      id: 'smart-storage',
      title: 'Smart Storage',
      subtitle: 'Cold Storage Unit A1 - Solar Powered',
      icon: Sun,
      status: 'completed',
      timestamp: '2024-01-15 08:00 AM',
      details: {
        temperature: 4,
        batteryLevel: 85,
        solarStatus: 'active',
        location: 'Distribution Center, Pune'
      }
    },
    {
      id: 'cold-logistics',
      title: 'Cold Logistics',
      subtitle: 'Refrigerated Transit - Route NH65',
      icon: Truck,
      status: 'in_progress',
      timestamp: '2024-01-15 02:30 PM',
      details: {
        temperature: 6,
        gpsCoordinates: '18.5204° N, 73.8567° E',
        location: 'En route to Mumbai'
      }
    },
    {
      id: 'retail',
      title: 'Retail',
      subtitle: 'FreshMart Supermarket - Store #42',
      icon: Store,
      status: 'pending',
      details: {
        location: 'Mumbai, Maharashtra'
      }
    }
  ];
}