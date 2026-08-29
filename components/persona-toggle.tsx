"use client";

import { useState } from "react";
import { User, Truck, ShieldCheck, ShoppingBag, ChevronDown } from "lucide-react";

export type Persona = 'farmer' | 'logistics' | 'regulator' | 'consumer';

interface PersonaOption {
  id: Persona;
  label: string;
  icon: any;
  description: string;
}

const PERSONAS: PersonaOption[] = [
  {
    id: 'farmer',
    label: 'Farmer View',
    icon: User,
    description: 'Harvest data, storage logs, quality metrics'
  },
  {
    id: 'logistics',
    label: 'Logistics View',
    icon: Truck,
    description: 'Transit monitoring, GPS tracking, temperature alerts'
  },
  {
    id: 'regulator',
    label: 'Regulator View',
    icon: ShieldCheck,
    description: 'Compliance logs, safety audits, certification status'
  },
  {
    id: 'consumer',
    label: 'Consumer View',
    icon: ShoppingBag,
    description: 'Product journey, quality assurance, sustainability info'
  }
];

interface PersonaToggleProps {
  currentPersona: Persona;
  onPersonaChange: (persona: Persona) => void;
}

export default function PersonaToggle({ currentPersona, onPersonaChange }: PersonaToggleProps) {
  const [isOpen, setIsOpen] = useState(false);
  const selectedPersona = PERSONAS.find(p => p.id === currentPersona) || PERSONAS[0];

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-3 rounded-xl border border-emerald-950/10 bg-white px-4 py-3 text-sm font-bold text-forest hover:bg-emerald-50 transition-colors"
      >
        <div className="grid h-8 w-8 place-items-center rounded-lg bg-emerald-100 text-emerald-600">
          <selectedPersona.icon size={18} />
        </div>
        <span>{selectedPersona.label}</span>
        <ChevronDown size={16} className={`transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 top-full z-50 mt-2 w-72 rounded-xl border border-emerald-950/10 bg-white shadow-lg shadow-emerald-950/10 p-2">
            {PERSONAS.map((persona) => (
              <button
                key={persona.id}
                onClick={() => {
                  onPersonaChange(persona.id);
                  setIsOpen(false);
                }}
                className={`w-full flex items-start gap-3 rounded-lg px-3 py-3 text-left transition-colors ${
                  currentPersona === persona.id
                    ? 'bg-emerald-50 text-forest'
                    : 'hover:bg-slate-50 text-slate-700'
                }`}
              >
                <div className={`grid h-8 w-8 shrink-0 place-items-center rounded-lg ${
                  currentPersona === persona.id ? 'bg-emerald-200 text-emerald-700' : 'bg-slate-100 text-slate-500'
                }`}>
                  <persona.icon size={16} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm">{persona.label}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{persona.description}</p>
                </div>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export function getPersonaWidgets(persona: Persona): string[] {
  switch (persona) {
    case 'farmer':
      return ['harvest-data', 'storage-logs', 'quality-metrics', 'batch-registry'];
    case 'logistics':
      return ['transit-monitoring', 'gps-tracking', 'temperature-alerts', 'fleet-status'];
    case 'regulator':
      return ['compliance-logs', 'safety-audits', 'certification-status', 'incident-reports'];
    case 'consumer':
      return ['product-journey', 'quality-assurance', 'sustainability-info', 'product-details'];
    default:
      return ['overview'];
  }
}