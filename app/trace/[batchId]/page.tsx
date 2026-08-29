import { CheckCircle2, CircleAlert, Leaf, MapPin, PackageCheck, ShieldCheck, Clock, Award } from "lucide-react";
import { StatusBadge } from "../../../components/status-badge";
import ShareButton from "../../../components/share-button";
import GPSTracker from "../../../components/gps-tracker";
import SupplyChainTimeline, { createMockSupplyChainData } from "../../../components/supply-chain-timeline";

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

async function getBatch(batchId: string): Promise<Batch | null> {
  try {
    const response = await fetch(`${api}/api/batches/${batchId}/public`, {
      cache: "no-store"
    });
    return response.ok ? response.json() : null;
  } catch {
    return null;
  }
}

export default async function TracePage({ params }: { params: { batchId: string } }) {
  const batch = await getBatch(params.batchId);
  
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
          <SupplyChainTimeline stages={createMockSupplyChainData()} />
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
