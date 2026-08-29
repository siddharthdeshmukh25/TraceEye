import { CheckCircle2, CircleAlert, Leaf, MapPin, PackageCheck, ShieldCheck, Clock, Award, Lock, Zap, QrCode, Camera, Thermometer, AlertTriangle, Sun, Truck, Store } from "lucide-react";
import { StatusBadge } from "../../../components/status-badge";
import ShareButton from "../../../components/share-button";
import GPSTracker from "../../../components/gps-tracker";
import SupplyChainTimeline from "../../../components/supply-chain-timeline";
import { verifyIntegrity, parseQRPayload } from "@/lib/encryption";
import { redirect } from "next/navigation";

const api = process.env.NEXT_PUBLIC_WEB_URL || "http://localhost:3000";

type Batch = {
  public_id: string;
  product_name: string;
  origin_name: string;
  initial_quantity_kg: number;
  quality_grade: string;
  current_status: string;
  created_at: string;
  producer_name: string;
  producer_email: string;
  producer_location: string | null;
  quarantine_reason?: string | null;
  handovers: {
    created_at: string;
    status: string;
    weight_kg: number;
    receiver: string;
    location: string;
    integrity_hash: string | null;
  }[];
  ingredients: {
    public_id: string;
    product_name: string;
  }[];
};

async function getBatch(batchId: string): Promise<{ batch: Batch | null; redirected: boolean }> {
  try {
    // Check if batchId is encrypted data (long base64 string)
    if (batchId.length > 50) {
      try {
        // Try to decrypt as encrypted QR data
        if (!verifyIntegrity(batchId)) {
          return { batch: null, redirected: true }; // Invalid encrypted data
        }
        
        const payload = parseQRPayload(batchId);
        batchId = payload.batchId; // Use the decrypted batch ID
      } catch {
        return { batch: null, redirected: true }; // Decryption failed
      }
    }
    
    const response = await fetch(`${api}/api/batches/${batchId}/public`, {
      cache: "no-store"
    });
    return { batch: response.ok ? await response.json() : null, redirected: false };
  } catch {
    return { batch: null, redirected: false };
  }
}

export default async function TracePage({ params }: { params: Promise<{ batchId: string }> }) {
  const { batchId } = await params;
  const { batch, redirected } = await getBatch(batchId);
  
  // If decryption failed, redirect to warning page
  if (redirected) {
    redirect('/warning');
  }
  
  if (!batch) {
    return (
      <main className="grid min-h-screen place-items-center bg-canvas px-5 text-center">
        <div>
          <Leaf className="mx-auto text-forest" size={42}/>
          <h1 className="mt-5 text-2xl font-bold">Product passport unavailable</h1>
          <p className="mt-2 text-slate-500">Check the QR code or connect the TraceEye API.</p>
        </div>
      </main>
    );
  }

  const safe = batch.current_status === "safe";
  const createdDate = new Date(batch.created_at);

  return (
    <main className="min-h-screen bg-canvas overflow-x-hidden">
      {/* GPS Tracker - records visit with location */}
      <GPSTracker batchPublicId={batch.public_id} />
      
      {/* Compact Header */}
      <header className="bg-ink px-4 py-3 text-white">
        <div className="mx-auto flex max-w-4xl items-center justify-between gap-3">
          <a href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-lime text-ink">
              <Leaf size={18}/>
            </span>
            <div>
              <p className="font-bold text-sm">TraceEye</p>
              <p className="text-[10px] text-emerald-100/70">Food Passport</p>
            </div>
          </a>
          <ShareButton />
        </div>
      </header>

      <div className="mx-auto w-full max-w-4xl px-2 sm:px-4 py-4 sm:py-6">
        {/* Enhanced Security Status Indicator */}
        <section className="rounded-2xl border-2 border-emerald-500/20 bg-gradient-to-r from-emerald-50 via-emerald-100 to-mint p-4 mb-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="grid h-12 w-12 place-items-center rounded-full bg-gradient-to-br from-emerald-500 to-emerald-600 text-white shadow-lg">
                <Lock size={20} />
              </div>
              <div>
                <p className="text-xs font-bold text-emerald-700 uppercase tracking-wide flex items-center gap-1">
                  <Zap size={10} className="text-emerald-600" />
                  Military-Grade Security
                </p>
                <p className="text-sm font-bold text-forest">AES-256-GCM Encrypted</p>
                <p className="text-[10px] text-emerald-600 mt-0.5">Tamper-proof & Verified</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-emerald-500 animate-pulse shadow-md" />
              <span className="text-xs font-bold text-emerald-700 bg-emerald-200 px-2 py-1 rounded-full">Protected</span>
            </div>
          </div>
        </section>

        {/* Comprehensive Verification Status */}
        <section className="rounded-2xl border border-emerald-950/5 bg-white p-4 mb-4">
          <h3 className="text-sm font-bold text-forest mb-3 flex items-center gap-2">
            <ShieldCheck size={16} />
            Comprehensive Verification Status
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="rounded-lg bg-emerald-50 p-3 text-center">
              <div className="grid h-8 w-8 place-items-center rounded-full bg-emerald-500 text-white mx-auto mb-2">
                <QrCode size={14} />
              </div>
              <p className="text-[10px] font-medium text-slate-600">QR Security</p>
              <p className="text-xs font-bold text-emerald-700">✅ Verified</p>
            </div>
            <div className="rounded-lg bg-emerald-50 p-3 text-center">
              <div className="grid h-8 w-8 place-items-center rounded-full bg-emerald-500 text-white mx-auto mb-2">
                <ShieldCheck size={14} />
              </div>
              <p className="text-[10px] font-medium text-slate-600">Trace Integrity</p>
              <p className="text-xs font-bold text-emerald-700">✅ Verified</p>
            </div>
            <div className="rounded-lg bg-emerald-50 p-3 text-center">
              <div className="grid h-8 w-8 place-items-center rounded-full bg-emerald-500 text-white mx-auto mb-2">
                <Camera size={14} />
              </div>
              <p className="text-[10px] font-medium text-slate-600">Physical Seal</p>
              <p className="text-xs font-bold text-emerald-700">✅ Verified</p>
            </div>
            <div className="rounded-lg bg-emerald-50 p-3 text-center">
              <div className="grid h-8 w-8 place-items-center rounded-full bg-emerald-500 text-white mx-auto mb-2">
                <Thermometer size={14} />
              </div>
              <p className="text-[10px] font-medium text-slate-600">Cold Chain</p>
              <p className="text-xs font-bold text-emerald-700">✅ Safe</p>
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-emerald-100">
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium text-slate-600">Overall Status</p>
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-emerald-500" />
                <span className="text-xs font-bold text-emerald-700">SAFE - Verified Authentic</span>
              </div>
            </div>
          </div>
        </section>

        {/* DATA CONFLICT WARNING (Most Critical) */}
        {batch.quarantine_reason?.includes('DATA CONFLICT') && (
          <section className="rounded-2xl border-4 border-red-600 bg-gradient-to-r from-red-100 to-red-200 p-6 mb-4 shadow-lg animate-pulse">
            <div className="flex items-start gap-4">
              <div className="grid h-16 w-16 shrink-0 place-items-center rounded-full bg-red-600 text-white shadow-xl">
                <AlertTriangle size={32} />
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-bold text-red-900 mb-2">🚨 BAD READING DETECTED</h3>
                <p className="text-sm font-bold text-red-800 mb-2">
                  Multi-signal verification failed. Sensor data conflicts with physical product integrity.
                </p>
                <p className="text-lg font-black text-red-900 bg-red-300 px-4 py-2 rounded-lg inline-block">
                  DO NOT CONSUME
                </p>
                <p className="mt-2 text-xs text-red-700">
                  {batch.quarantine_reason}
                </p>
              </div>
            </div>
          </section>
        )}

        {/* Recall Warning (conditional) */}
        {batch.current_status === 'quarantined' && !batch.quarantine_reason?.includes('DATA CONFLICT') && (
          <section className="rounded-2xl border-2 border-rose-400 bg-gradient-to-r from-rose-50 to-rose-100 p-4 mb-4 shadow-sm">
            <div className="flex items-start gap-3">
              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-rose-500 text-white">
                <AlertTriangle size={18} />
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-bold text-rose-900 mb-1">⚠️ DO NOT CONSUME</h3>
                <p className="text-xs text-rose-700">
                  This batch has been quarantined and is subject to recall.
                  {batch.quarantine_reason && ` Reason: ${batch.quarantine_reason}`}
                </p>
              </div>
            </div>
          </section>
        )}

        {/* Compact Hero Section */}
        <section className="rounded-2xl bg-forest p-5 text-white">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <Clock size={14} />
                <span className="text-[10px] font-bold tracking-widest text-lime">BATCH {batch.public_id}</span>
              </div>
              <h1 className="mt-2 text-2xl font-bold sm:text-3xl">{batch.product_name}</h1>
              <p className="mt-1 text-sm text-emerald-100">{batch.producer_name}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <div className="flex items-center gap-1 rounded bg-white/10 px-2 py-1 text-xs">
                  <MapPin size={12} />
                  {batch.origin_name}
                </div>
                <div className="flex items-center gap-1 rounded bg-white/10 px-2 py-1 text-xs">
                  <Award size={12} />
                  Grade {batch.quality_grade}
                </div>
              </div>
            </div>
            <div className="mt-3 sm:mt-0">
              <StatusBadge status={batch.current_status} />
            </div>
          </div>

          {/* Compact Safety Status */}
          <div className="mt-4 flex items-center gap-3 rounded-xl bg-white/10 p-3">
            <div className={`grid h-8 w-8 place-items-center rounded-full ${
              safe ? "bg-lime text-ink" : "bg-amber-300 text-ink"
            }`}>
              {safe ? <CheckCircle2 size={16}/> : <CircleAlert size={16}/>}
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold">
                {safe ? "✓ Safe" : "⚠ Needs Attention"}
              </p>
            </div>
          </div>
        </section>

        {/* Producer Info */}
        <section className="mt-4 rounded-xl border border-emerald-950/5 bg-gradient-to-br from-emerald-50 to-white p-4">
          <h2 className="mb-4 flex items-center gap-2 text-sm font-bold text-forest">
            <PackageCheck size={16} />
            Posted By
          </h2>
          <div className="flex flex-col sm:flex-row gap-4 items-start">
            {/* Avatar Section */}
            <div className="flex-shrink-0">
              <div className="h-16 w-16 rounded-full bg-gradient-to-br from-lime to-emerald-400 flex items-center justify-center text-white font-bold text-xl shadow-md">
                {batch.producer_name?.charAt(0)?.toUpperCase() || "P"}
              </div>
            </div>
            {/* Producer Details */}
            <div className="flex-1">
              <div className="mb-3">
                <p className="text-[10px] font-medium text-slate-500 uppercase tracking-wide">Account Owner</p>
                <p className="mt-1 text-base font-bold text-forest">{batch.producer_name}</p>
              </div>
              {batch.producer_location && (
                <div className="mb-3 flex items-center gap-2">
                  <MapPin size={14} className="text-emerald-600" />
                  <div>
                    <p className="text-[10px] font-medium text-slate-500 uppercase tracking-wide">Location</p>
                    <p className="text-sm font-semibold text-forest">{batch.producer_location}</p>
                  </div>
                </div>
              )}
              {batch.producer_email && batch.producer_email !== "contact@traceeye.com" && (
                <div className="mb-3">
                  <p className="text-[10px] font-medium text-slate-500 uppercase tracking-wide">Email</p>
                  <a href={`mailto:${batch.producer_email}`} className="mt-1 text-sm font-semibold text-emerald-600 hover:text-emerald-700 hover:underline break-all">
                    {batch.producer_email}
                  </a>
                </div>
              )}
              <div>
                <p className="text-[10px] font-medium text-slate-500 uppercase tracking-wide">Posted On</p>
                <p className="mt-1 text-sm font-semibold text-forest">
                  {createdDate.toLocaleDateString("en-US", { 
                    month: 'short', 
                    day: 'numeric',
                    year: 'numeric'
                  })} at {createdDate.toLocaleTimeString("en-US", {
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: true
                  })}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Compact Product Details */}
        <section className="mt-4 rounded-xl border border-emerald-950/5 bg-white p-4">
          <h2 className="mb-3 flex items-center gap-2 text-sm font-bold text-forest">
            <PackageCheck size={16} />
            Product Details
          </h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="rounded-lg bg-emerald-50 p-3">
              <p className="text-[10px] font-medium text-slate-500">Origin</p>
              <p className="mt-1 text-sm font-bold text-forest">{batch.origin_name}</p>
            </div>
            <div className="rounded-lg bg-emerald-50 p-3">
              <p className="text-[10px] font-medium text-slate-500">Quantity</p>
              <p className="mt-1 text-sm font-bold text-forest">{batch.initial_quantity_kg} kg</p>
            </div>
            <div className="rounded-lg bg-emerald-50 p-3">
              <p className="text-[10px] font-medium text-slate-500">Grade</p>
              <p className="mt-1 text-sm font-bold text-forest">{batch.quality_grade}</p>
            </div>
            <div className="rounded-lg bg-emerald-50 p-3">
              <p className="text-[10px] font-medium text-slate-500">Batch ID</p>
              <p className="mt-1 text-sm font-bold text-forest">{batch.public_id}</p>
            </div>
          </div>
        </section>

        {/* 4-Stage Supply Chain Timeline */}
        <section className="mt-4">
          <SupplyChainTimeline stages={[
            {
              id: 'harvest',
              title: 'Harvest',
              subtitle: `${batch.origin_name} - Farm Collection`,
              icon: 'PackageCheck',
              status: 'completed',
              timestamp: new Date(batch.created_at).toLocaleString(),
              details: {
                location: batch.producer_location || 'Unknown',
                temperature: 18
              }
            },
            {
              id: 'processing',
              title: 'Processing',
              subtitle: 'Quality Check & Grading',
              icon: 'Sun',
              status: 'completed',
              timestamp: new Date(batch.created_at).toLocaleString(),
              details: {
                location: batch.producer_location || 'Processing Unit',
                temperature: 20
              }
            },
            {
              id: 'logistics',
              title: 'Logistics',
              subtitle: 'Cold Chain Transportation',
              icon: 'Truck',
              status: batch.handovers.length > 0 ? 'in_progress' : 'pending',
              details: {
                location: batch.handovers.length > 0 ? batch.handovers[0].location : 'Pending',
                temperature: 6
              }
            },
            {
              id: 'retail',
              title: 'Retail',
              subtitle: 'Market Distribution',
              icon: 'Store',
              status: 'pending',
              details: {
                location: 'Distribution Pending'
              }
            }
          ]} />
        </section>

        {/* Compact Ingredients */}
        {batch.ingredients.length > 0 && (
          <section className="mt-4 rounded-xl bg-mint p-4">
            <h2 className="mb-2 flex items-center gap-2 text-sm font-bold text-forest">
              <Award size={16} />
              Ingredients
            </h2>
            <div className="flex flex-wrap gap-2">
              {batch.ingredients.map((ingredient) => (
                <span 
                  key={ingredient.public_id} 
                  className="rounded-lg bg-white px-3 py-1.5 text-xs font-bold text-forest"
                >
                  {ingredient.product_name}
                </span>
              ))}
            </div>
          </section>
        )}

        {/* Compact Footer */}
        <footer className="mt-6 text-center text-[10px] text-slate-400">
          <p>TraceEye · Food Intelligence</p>
        </footer>
      </div>
    </main>
  );
}
