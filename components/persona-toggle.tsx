"use client";

import { useEffect, useState, forwardRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

import { User, Truck, ShieldCheck, ShoppingBag, ChevronDown } from "lucide-react";
import { AudioCtx } from "@/lib/audio";

declare global {
  // preload once so UX sounds feel instant
  interface Window {
    _traceEyeAudioPreloaded?: boolean;
  }
}

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

const ToggleChevron = ({ isOpen }: { isOpen: boolean }) => (
  <motion.span
    animate={{ rotate: isOpen ? 180 : 0 }}
    transition={{ duration: 0.3, ease: 'easeInOut' }}
  >
    <ChevronDown size={18} className="inline-block text-slate-500" />
  </motion.span>
);

const MotionButton = forwardRef<HTMLButtonElement, React.ButtonHTMLAttributes<HTMLButtonElement> & { whileHover?: { scale?: number }; whileTap?: { scale?: number }; transition?: any; children: React.ReactNode }>(
  function MotionButtonClack(props, ref) {
    const { whileHover, whileTap, transition, className, children, ...rest } = props;

    const playClick = () => {
      try {
        AudioCtx.play("ui_click_3d");
      } catch {
        /* audio not ready */
      }
    };

    return (
      <motion.button
        ref={ref}
        whileHover={whileHover}
        whileTap={whileTap}
        transition={transition}
        onClick={playClick}
        className={className}
        {...rest}
      >
        {children}
      </motion.button>
    );
  }
);

export default function PersonaToggle({ currentPersona, onPersonaChange }: PersonaToggleProps) {
  const [isOpen, setIsOpen] = useState(false);
  const selectedPersona = PERSONAS.find(p => p.id === currentPersona) || PERSONAS[0];

  useEffect(() => {
    if (typeof window !== 'undefined' && !window._traceEyeAudioPreloaded) {
      window._traceEyeAudioPreloaded = true;
      AudioCtx.preload('ui_click_3d', 'ui_click_deep');
    }
  }, []);

  return (
    <div className="relative">        <MotionButton
          onClick={() => setIsOpen(!isOpen)}
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          transition={{ type: 'spring', stiffness: 420, damping: 18 }}
          className="flex items-center gap-3 rounded-xl border-2 border-emerald-800/20 bg-gradient-to-br from-emerald-50 to-white px-5 py-3 text-sm font-bold text-forest hover:bg-emerald-50 transition-colors shadow-[3px_3px_0_rgba(13,43,32,0.08)] active:shadow-[0_0_0_rgba(13,43,32,0)] ring-[3px] ring-emerald-800/20"
        >
          <div className="grid h-10 w-10 place-items-center rounded-lg bg-emerald-100 text-emerald-800 shadow-[2px_2px_0_rgba(13,43,32,0.08)]">
            <selectedPersona.icon size={22} />
          </div>
          <span className="text-forest tracking-tight">{selectedPersona.label}</span>
          <ToggleChevron isOpen={isOpen} />
        </MotionButton>

      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.18 }}
              className="fixed inset-0 z-40"
              onClick={() => setIsOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, y: -8, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -4, scale: 0.96 }}
              transition={{ duration: 0.22, ease: 'easeOut' }}
              className="absolute right-0 top-full z-50 mt-3 w-72 rounded-xl border border-emerald-950/10 bg-white shadow-lg shadow-emerald-950/10 p-2"
            >
              {PERSONAS.map((persona) => (
                <PersonaItemButton
                  key={persona.id}
                  currentPersona={currentPersona}
                  personaId={persona.id}
                  onPersonaChange={onPersonaChange}
                  setIsOpen={setIsOpen}
                />
              ))}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

const PersonaItemButton = forwardRef<HTMLButtonElement, {
  currentPersona: Persona;
  personaId: Persona;
  onPersonaChange: (persona: Persona) => void;
  setIsOpen: (value: boolean) => void;
}>(function PersonaItemButtonClack(props, ref) {
  const { currentPersona, personaId, onPersonaChange, setIsOpen } = props;

  const playClick = () => {
    try {
      AudioCtx.play("ui_click_3d");
    } catch {
      /* audio not ready */
    }
  };

  return (
    <motion.button
      ref={ref}
      whileHover={{ scale: 1.015 }}
      whileTap={{ scale: 0.985 }}
      transition={{ type: 'spring', stiffness: 420, damping: 18 }}
      onClick={() => {
        playClick();
        onPersonaChange(personaId);
        setIsOpen(false);
      }}
      className={`w-full flex items-start gap-3 rounded-lg px-3 py-3 text-left transition-colors shadow-[1px_1px_0_rgba(0,0,0,0.04)] hover:shadow-[2px_2px_0_rgba(0,0,0,0.08)] ${
        currentPersona === personaId
          ? 'bg-emerald-50 text-forest shadow-[2px_2px_0_rgba(0,0,0,0.06)] ring-1 ring-emerald-700/20'
          : 'hover:bg-slate-50 text-slate-700'
      }`}
    >
      <div className={`grid h-10 w-10 shrink-0 place-items-center rounded-lg shadow-[1px_1px_0_rgba(0,0,0,0.06)] ${
        currentPersona === personaId ? 'bg-emerald-200 text-emerald-700' : 'bg-slate-100 text-slate-500'
      }`}>
        <personaIcon personaId={personaId} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-base">{personaLabel(personaId)}</p>
        <p className="text-xs text-slate-500 mt-0.5">{personaDescription(personaId)}</p>
      </div>
    </motion.button>
  );
});

function personaIcon({ personaId }: { personaId: Persona }) {
  switch (personaId) {
    case 'farmer':
      return <User size={20} />;
    case 'logistics':
      return <Truck size={20} />;
    case 'regulator':
      return <ShieldCheck size={20} />;
    case 'consumer':
      return <ShoppingBag size={20} />;
    default:
      return <User size={20} />;
  }
}

function personaLabel(personaId: Persona) {
  switch (personaId) {
    case 'farmer':
      return 'Farmer View';
    case 'logistics':
      return 'Logistics View';
    case 'regulator':
      return 'Regulator View';
    case 'consumer':
      return 'Consumer View';
    default:
      return 'Farmer View';
  }
}

function personaDescription(personaId: Persona) {
  switch (personaId) {
    case 'farmer':
      return 'Harvest data, storage logs, quality metrics';
    case 'logistics':
      return 'Transit monitoring, GPS tracking, temperature alerts';
    case 'regulator':
      return 'Compliance logs, safety audits, certification status';
    case 'consumer':
      return 'Product journey, quality assurance, sustainability info';
    default:
      return 'Harvest data, storage logs, quality metrics';
  }
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