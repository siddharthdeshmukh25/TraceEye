import { CheckCircle2, CircleAlert, Leaf, MapPin, PackageCheck, ShieldCheck, Clock, Award } from "lucide-react";
import { StatusBadge } from "../../../components/status-badge";
import ShareButton from "../../../components/share-button";

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
    <main className="min-h-screen bg-canvas">
      {/* Compact Header */}
      <header className="bg-ink px-4 py-3 text-white">
        <div className="mx-auto flex max-w-4xl items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-lime text-ink">
              <Leaf size={18}/>
            </span>
            <div>
              <p className="font-bold text-sm">TraceEye</p>
              <p className="text-[10px] text-emerald-100/70">Food Passport</p>
            </div>
          </div>
          <ShareButton />
        </div>
      </header>

      <div className="mx-auto max-w-4xl px-4 py-6">
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
              <p className="text-[10px] font-medium text-slate-500">Created</p>
              <p className="mt-1 text-sm font-bold text-forest">{createdDate.toLocaleDateString("en-US", { 
                month: 'short', 
                day: 'numeric' 
              })}</p>
            </div>
          </div>
        </section>

        {/* Compact Timeline */}
        <section className="mt-4">
          <h2 className="mb-3 flex items-center gap-2 text-sm font-bold text-forest">
            <ShieldCheck size={16} />
            Journey
          </h2>
          <div className="space-y-2">
            {[
              {
                title: "Passport created",
                subtitle: `${batch.origin_name}`,
                icon: PackageCheck,
                verified: true,
                date: createdDate.toLocaleDateString("en-US", { month: 'short', day: 'numeric' })
              },
              ...batch.handovers.map((handover) => ({
                title: handover.receiver,
                subtitle: `${handover.location || "Location"} · ${handover.weight_kg}kg`,
                icon: MapPin,
                verified: handover.status === "verified",
                date: new Date(handover.created_at).toLocaleDateString("en-US", { month: 'short', day: 'numeric' })
              }))
            ].map(({ title, subtitle, icon: Icon, verified, date }, index) => (
              <div 
                key={`${title}-${index}`} 
                className="flex gap-3 rounded-xl border border-emerald-950/5 bg-white p-3"
              >
                <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-full ${
                  verified ? "bg-mint text-forest" : "bg-slate-100 text-slate-500"
                }`}>
                  <Icon size={16}/>
                </span>
                <div className="flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-bold text-forest">{title}</p>
                      <p className="text-[10px] text-slate-500">{subtitle}</p>
                    </div>
                    <span className="text-[10px] font-medium text-slate-400 bg-slate-50 px-2 py-0.5 rounded">
                      {date}
                    </span>
                  </div>
                  {verified && (
                    <p className="mt-1 flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-1 rounded inline-flex">
                      <ShieldCheck size={10}/>
                      Verified
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
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
