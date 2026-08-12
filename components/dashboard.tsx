"use client";

import {
  AlertTriangle,
  BellRing,
  Boxes,
  CheckCircle2,
  ChevronRight,
  ClipboardCheck,
  CircleHelp,
  Download,
  ExternalLink,
  Leaf,
  LogOut,
  MapPin,
  Menu,
  PackagePlus,
  QrCode,
  RefreshCw,
  Search,
  ShieldAlert,
  ShieldCheck,
  Thermometer,
  X,
} from "lucide-react";
import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import html2canvas from "html2canvas";
import { StatusBadge } from "./status-badge";
import { getAuth, clearAuth, getUserId, isAuthenticated } from "@/lib/auth";

type Summary = {
  total_batches: number;
  safe_batches: number;
  risk_batches: number;
  open_alerts: number;
};
type Batch = {
  id: string;
  public_id: string;
  product_name: string;
  producer_name: string;
  origin_name: string;
  initial_quantity_kg: number;
  quality_grade: string;
  storage_min_c: number;
  storage_max_c: number;
  current_status: string;
  created_at: string;
};
type Alert = {
  id: string;
  severity: string;
  title: string;
  message: string;
  affected_locations: string[];
  created_at: string;
  batch: { public_id: string; product_name: string } | null;
};
type Session = { full_name?: string; name?: string; email?: string; id?: string };
const blankSummary: Summary = {
  total_batches: 0,
  safe_batches: 0,
  risk_batches: 0,
  open_alerts: 0,
};

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function FeatureGuide({ text }: { text: string }) {
  const [open, setOpen] = useState(false);
  const guideRef = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    if (!open) return;
    const closeOnOutsideClick = (event: PointerEvent) => {
      if (!guideRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", closeOnOutsideClick);
    return () =>
      document.removeEventListener("pointerdown", closeOnOutsideClick);
  }, [open]);
  return (
    <span ref={guideRef} className="relative z-40 mt-0.5 inline-flex shrink-0">
      <motion.button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-label="How to use this feature"
        aria-expanded={open}
        className="grid h-6 w-6 place-items-center rounded-full border border-emerald-800/60 bg-white text-forest"
        animate={{ rotate: open ? 90 : 0, scale: open ? 1.08 : 1 }}
        transition={{ duration: 0.18 }}
      >
        <CircleHelp size={15} />
      </motion.button>
      <AnimatePresence>
        {open && (
          <>
            <button
              type="button"
              aria-label="Close help guide"
              onClick={() => setOpen(false)}
              className="fixed inset-0 z-40 cursor-default"
            />
            <motion.span
              initial={{ opacity: 0, y: -8, scale: 0.92 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -5, scale: 0.96 }}
              transition={{ duration: 0.18, ease: "easeOut" }}
              className="absolute right-0 top-8 z-50 w-56 max-w-[calc(100vw-2rem)] origin-top-right rounded-xl border border-emerald-950/45 bg-white p-3 text-left text-xs font-normal leading-5 text-slate-700 sm:w-64"
            >
              {text}
            </motion.span>
          </>
        )}
      </AnimatePresence>
    </span>
  );
}

export default function Dashboard() {
  const router = useRouter();
  const [summary, setSummary] = useState(blankSummary);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [session, setSession] = useState<Session>({});
  const [tab, setTab] = useState("overview");
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const [notice, setNotice] = useState("");
  const [databaseStatus, setDatabaseStatus] = useState<
    "checking" | "connected" | "disconnected"
  >("checking");
  const [databaseIssue, setDatabaseIssue] = useState("");
  const [loading, setLoading] = useState(true);
  const [showBatchForm, setShowBatchForm] = useState(false);
  const [readingBatch, setReadingBatch] = useState<Batch | null>(null);
  const [saving, setSaving] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const load = async () => {
    setLoading(true);
    try {
      setDatabaseStatus("checking");
      
      // Get auth token and user ID
      const { token, user } = getAuth();
      if (!token || !user) {
        clearAuth();
        router.replace("/");
        return;
      }
      
      const healthResult = await fetch("/api/health");
      if (!healthResult.ok) {
        const health = await healthResult.json().catch(() => ({}));
        throw new Error(health.detail || "MongoDB could not be reached.");
      }
      
      const userId = user.id;
      const headers = {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      };
      
      const [summaryResult, batchesResult, alertsResult] = await Promise.all([
        fetch(`/api/dashboard/summary?user_id=${userId}`, { headers }),
        fetch(`/api/batches?user_id=${userId}`, { headers }),
        fetch(`/api/alerts?user_id=${userId}`, { headers }),
      ]);
      if (!summaryResult.ok || !batchesResult.ok || !alertsResult.ok)
        throw new Error("MongoDB is unavailable");
      setSummary(await summaryResult.json());
      setBatches(await batchesResult.json());
      setAlerts(await alertsResult.json());
      setDatabaseStatus("connected");
      setDatabaseIssue("");
    } catch (error) {
      setDatabaseStatus("disconnected");
      setDatabaseIssue(
        error instanceof Error
          ? error.message
          : "MongoDB could not be reached.",
      );
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    // Check authentication status
    if (!isAuthenticated()) {
      router.replace("/");
      return;
    }
    
    const { user } = getAuth();
    if (user) setSession(user);
    
    load();
    // Auto polling disabled - only manual refresh
    
    // Check token expiration periodically
    const tokenCheck = setInterval(() => {
      if (!isAuthenticated()) {
        clearAuth();
        router.replace("/");
      }
    }, 120000); // Check every 2 minutes
    
    return () => {
      window.clearInterval(tokenCheck);
    };
  }, []);
  const visibleBatches = useMemo(
    () =>
      batches.filter(
        (batch) =>
          (status === "all" || batch.current_status === status) &&
          `${batch.product_name} ${batch.public_id} ${batch.origin_name}`
            .toLowerCase()
            .includes(query.toLowerCase()),
      ),
    [batches, query, status],
  );
  const signOut = () => {
    // Check if user signed in with Google
    const { user } = getAuth();
    if (user?.auth_provider === "google") {
      // Import Firebase auth dynamically to avoid SSR issues
      import("@/lib/firebase").then(({ auth }) => {
        auth.signOut().catch(console.error);
      });
    }
    clearAuth();
    router.replace("/");
  };
  const go = (next: string) => {
    setTab(next);
    setMobileNavOpen(false);
    document
      .getElementById("workspace")
      ?.scrollIntoView({ behavior: "smooth" });
  };
  const memberName = session.full_name || session.name || "TraceEye member";
  const cards = [
    {
      label: "Registered batches",
      value: summary.total_batches,
      icon: Boxes,
      color: "bg-mint text-forest",
    },
    {
      label: "Safe and verified",
      value: summary.safe_batches,
      icon: CheckCircle2,
      color: "bg-emerald-50 text-emerald-700",
    },
    {
      label: "Need review",
      value: summary.risk_batches,
      icon: AlertTriangle,
      color: "bg-amber-50 text-amber-700",
    },
    {
      label: "Active recalls",
      value: summary.open_alerts,
      icon: BellRing,
      color: "bg-rose-50 text-rose-700",
    },
  ];
  return (
    <main className="traceeye-dashboard min-h-screen bg-canvas text-ink">
      <aside className="fixed inset-y-0 hidden w-72 border-r border-white/10 bg-ink px-6 py-7 text-white lg:block">
        <button
          onClick={() => go("overview")}
          className="flex items-center gap-3 text-left"
        >
          <span className="grid h-11 w-11 place-items-center rounded-full bg-lime text-ink">
            <Leaf size={22} />
          </span>
          <span>
            <span className="brand-wordmark block">TraceEye</span>
            <span className="text-[10px] tracking-[.12em] text-emerald-100/60">
              FOOD. TRUST. TRACE.
            </span>
          </span>
        </button>
        <p className="mt-7 text-sm leading-6 text-emerald-100/70">
          Turn every food batch into evidence your team and customers can trust.
        </p>
        <nav className="mt-9 space-y-1 text-sm">
          {[
            ["overview", "Overview", ShieldCheck],
            ["batches", "Batch registry", Boxes],
            ["safety", "Safety & recalls", ShieldAlert],
            ["passports", "QR food passports", QrCode],
          ].map(([key, label, Icon]) => (
            <button
              key={key as string}
              onClick={() => go(key as string)}
              className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left ${tab === key ? "bg-white/10 font-bold text-white" : "text-emerald-100/70"}`}
            >
              <Icon size={17} />
              {label as string}
            </button>
          ))}
        </nav>
        <div className="absolute bottom-7 left-6 right-6 rounded-2xl border border-white/10 bg-white/5 p-4">
          <p className="text-xs text-emerald-100/60">Signed in as</p>
          <p className="mt-1 truncate text-sm font-bold">{memberName}</p>
          <button
            onClick={signOut}
            className="mt-4 flex items-center gap-2 text-xs font-bold text-lime"
          >
            <LogOut size={14} /> Log out
          </button>
        </div>
      </aside>
      <section className="lg:ml-72">
        <header className="border-b border-emerald-950/10 bg-[#fdfcf8]/90 px-3 py-3 backdrop-blur sm:px-7 sm:py-4">
          <div className="mx-auto flex max-w-7xl items-center justify-between gap-3">
            <div className="flex items-center gap-3 lg:hidden">
              <button
                type="button"
                onClick={() => setMobileNavOpen(true)}
                aria-label="Open dashboard navigation"
                className="grid h-9 w-9 place-items-center rounded-lg border border-emerald-950/10 bg-white text-forest"
              >
                <Menu size={18} />
              </button>
              <span className="grid h-10 w-10 place-items-center rounded-full bg-ink text-lime">
                <Leaf size={20} />
              </span>
              <span className="brand-wordmark text-[22px]">TraceEye</span>
            </div>
            <div className="hidden lg:block">
              <p className="text-xs font-bold tracking-[.14em] text-forest">
                TRACEABILITY OPERATIONS
              </p>
              <p className="mt-1 text-sm text-slate-500">
                Your shared evidence workspace
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={load}
                title={
                  databaseStatus === "connected"
                    ? "MongoDB connected"
                    : "MongoDB disconnected — retry now"
                }
                className="flex h-9 items-center gap-2 rounded-lg border border-emerald-950/10 bg-white px-2.5 text-[11px] font-bold text-slate-600 sm:h-10 sm:rounded-xl sm:px-3 sm:text-xs"
              >
                <span
                  className={`h-2.5 w-2.5 rounded-full ${databaseStatus === "connected" ? "bg-emerald-500" : "bg-rose-500"}`}
                />
                <span className="hidden sm:inline">
                  {databaseStatus === "connected"
                    ? "Database"
                    : "Database offline"}
                </span>
              </button>
              <button
                onClick={load}
                title="Refresh data"
                className="grid h-9 w-9 place-items-center rounded-lg border border-emerald-950/10 bg-white text-forest sm:h-10 sm:w-10 sm:rounded-xl"
              >
                <RefreshCw size={17} />
              </button>
              <button
                onClick={() => setShowBatchForm(true)}
                className="flex h-9 items-center gap-1 rounded-lg bg-forest px-3 text-xs font-bold text-white sm:h-auto sm:gap-2 sm:rounded-xl sm:px-4 sm:py-3 sm:text-sm"
              >
                <PackagePlus size={17} />{" "}
                <span className="hidden sm:inline">Register batch</span>
              </button>
            </div>
          </div>
        </header>
        <div
          id="workspace"
          className="mx-auto max-w-7xl px-3 py-4 sm:px-7 sm:py-8"
        >
          {notice && (
            <div className="mt-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
              {notice}
            </div>
          )}
          {tab === "overview" && (
            <>
              <div className="mt-7 flex flex-wrap items-end justify-between gap-4">
                <div>
                  <p className="text-xs font-bold tracking-[.15em] text-forest">
                    OVERVIEW
                  </p>
                  <h1 className="mt-2 text-2xl font-bold tracking-tight sm:text-4xl">
                    Food journey, in full view.
                  </h1>
                  <p className="mt-2 max-w-xl text-sm leading-6 text-slate-600">
                    Register product passports, monitor storage evidence, and
                    take only the recall action a batch needs.
                  </p>
                </div>
                <button
                  onClick={() => go("batches")}
                  className="flex items-center gap-1 text-sm font-bold text-forest"
                >
                  Open registry <ChevronRight size={17} />
                </button>
              </div>
              <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                {cards.map(({ label, value, icon: Icon, color }) => (
                  <article
                    key={label}
                    className="rounded-2xl border border-emerald-950/5 bg-white p-5"
                  >
                    <span
                      className={`grid h-10 w-10 place-items-center rounded-xl ${color}`}
                    >
                      <Icon size={20} />
                    </span>
                    <p className="mt-3 text-2xl font-bold sm:mt-5 sm:text-3xl">
                      {loading ? "â€”" : value}
                    </p>
                    <p className="mt-1 text-sm text-slate-500">{label}</p>
                  </article>
                ))}
              </div>
              <div className="mt-6 grid gap-5 xl:grid-cols-[1.35fr_.85fr]">
                <section className="rounded-2xl border border-emerald-950/5 bg-white p-5 sm:p-6">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-1.5">
                      <div>
                        <h2 className="text-lg font-bold">
                          Latest batch activity
                        </h2>
                        <p className="mt-1 text-sm text-slate-500">
                          Every batch has a public, scannable food passport.
                        </p>
                      </div>
                      <FeatureGuide text="Each new batch becomes a searchable food passport. Open a passport to share its verified journey." />
                    </div>
                    <button
                      onClick={() => go("batches")}
                      className="text-sm font-bold text-forest"
                    >
                      View all
                    </button>
                  </div>
                  <div className="mt-4 divide-y divide-emerald-950/5">
                    {batches
                      .slice(0, 5)
                      .map((batch) => (
                        <BatchRow
                          key={batch.id}
                          batch={batch}
                          onReading={setReadingBatch}
                        />
                      )) || (
                      <Empty text="No batches yet. Register the first product passport." />
                    )}
                  </div>
                </section>
                <section className="rounded-2xl border border-emerald-700/35 bg-[#e8f0e3] p-6 text-forest">
                  <div className="flex items-center justify-between">
                    <div className="flex items-start gap-1.5">
                      <div>
                        <p className="text-xs font-bold tracking-[.14em] text-forest">
                          SAFETY ENGINE
                        </p>
                        <h2 className="mt-2 text-xl font-bold">
                          From signal to response.
                        </h2>
                      </div>
                      <FeatureGuide text="Add a temperature, humidity and visual-marker reading to a batch. TraceEye immediately compares it against the storage policy." />
                    </div>
                    <Thermometer className="text-forest" />
                  </div>
                  <div className="mt-7 space-y-4 text-sm">
                    <div className="rounded-xl border border-emerald-950/10 bg-white p-4">
                      <p className="font-bold">1. Capture evidence</p>
                      <p className="mt-1 text-slate-600">
                        Temperature, humidity and tamper marker checks are
                        attached to a batch.
                      </p>
                    </div>
                    <div className="rounded-xl border border-emerald-950/10 bg-white p-4">
                      <p className="font-bold">2. Evaluate policy</p>
                      <p className="mt-1 text-slate-600">
                        TraceEye compares the latest readings against its
                        approved storage range.
                      </p>
                    </div>
                    <div className="rounded-xl border border-[#c8dbad] bg-[#dfeccf] p-4 text-ink">
                      <p className="font-bold">
                        3. Smart recall only when needed
                      </p>
                      <p className="mt-1 text-sm text-ink/70">
                        Critical batches are isolated instead of recalling
                        unaffected food.
                      </p>
                    </div>
                  </div>
                </section>
              </div>
            </>
          )}
          {tab === "batches" && (
            <BatchRegistry
              batches={visibleBatches}
              query={query}
              setQuery={setQuery}
              status={status}
              setStatus={setStatus}
              onReading={setReadingBatch}
            />
          )}{" "}
          {tab === "safety" && (
            <SafetyCenter
              alerts={alerts}
              batches={batches}
              onReading={setReadingBatch}
            />
          )}{" "}
          {tab === "passports" && <PassportCenter batches={batches} />}
        </div>
      </section>
      <AnimatePresence>
        {mobileNavOpen && (
          <>
            <motion.button
              type="button"
              aria-label="Close dashboard navigation"
              onClick={() => setMobileNavOpen(false)}
              className="fixed inset-0 z-50 bg-ink/45 lg:hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            />
            <motion.nav
              className="fixed inset-y-0 left-0 z-[60] w-72 bg-ink p-5 text-white shadow-2xl lg:hidden"
              initial={{ x: -288 }}
              animate={{ x: 0 }}
              exit={{ x: -288 }}
              transition={{ type: "tween", duration: 0.24, ease: "easeOut" }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="grid h-10 w-10 place-items-center rounded-full bg-lime text-ink">
                    <Leaf size={20} />
                  </span>
                  <span className="brand-wordmark">TraceEye</span>
                </div>
                <button
                  type="button"
                  onClick={() => setMobileNavOpen(false)}
                  aria-label="Close dashboard navigation"
                  className="grid h-9 w-9 place-items-center rounded-lg bg-white/10"
                >
                  <X size={18} />
                </button>
              </div>
              <div className="mt-8 space-y-2 text-sm">
                {[
                  ["overview", "Overview", ShieldCheck],
                  ["batches", "Batch registry", Boxes],
                  ["safety", "Safety & recalls", ShieldAlert],
                  ["passports", "QR food passports", QrCode],
                ].map(([key, label, Icon]) => (
                  <button
                    key={key as string}
                    onClick={() => go(key as string)}
                    className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left ${tab === key ? "bg-white/10 font-bold text-white" : "text-emerald-100/70"}`}
                  >
                    <Icon size={17} />
                    {label as string}
                  </button>
                ))}
              </div>
              <button
                onClick={signOut}
                className="absolute bottom-7 left-5 flex items-center gap-2 text-xs font-bold text-lime"
              >
                <LogOut size={14} /> Log out
              </button>
            </motion.nav>
          </>
        )}
      </AnimatePresence>
      {showBatchForm && (
        <BatchForm
          close={() => setShowBatchForm(false)}
          refresh={load}
          setNotice={setNotice}
          saving={saving}
          setSaving={setSaving}
        />
      )}{" "}
      {readingBatch && (
        <ReadingForm
          batch={readingBatch}
          close={() => setReadingBatch(null)}
          refresh={load}
          setNotice={setNotice}
          saving={saving}
          setSaving={setSaving}
        />
      )}
    </main>
  );
}

function BatchRow({
  batch,
  onReading,
}: {
  batch: Batch;
  onReading: (batch: Batch) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-3 py-4">
      <div className="min-w-0">
        <p className="truncate font-semibold">{batch.product_name}</p>
        <p className="mt-1 text-xs text-slate-500">
          {batch.public_id} Â· {batch.origin_name}
        </p>
      </div>
      <div className="flex items-center gap-2">
        <StatusBadge status={batch.current_status} />
        <button
          onClick={() => onReading(batch)}
          title="Add safety reading"
          className="grid h-9 w-9 place-items-center rounded-lg bg-mint text-forest"
        >
          <Thermometer size={16} />
        </button>
      </div>
    </div>
  );
}
function Empty({ text }: { text: string }) {
  return <div className="py-10 text-center text-sm text-slate-500">{text}</div>;
}
function BatchRegistry({
  batches,
  query,
  setQuery,
  status,
  setStatus,
  onReading,
}: {
  batches: Batch[];
  query: string;
  setQuery: (value: string) => void;
  status: string;
  setStatus: (value: string) => void;
  onReading: (batch: Batch) => void;
}) {
  return (
    <>
      <p className="text-xs font-bold tracking-[.15em] text-forest">
        BATCH REGISTRY
      </p>
      <div className="mt-2 flex items-center gap-2">
        <h1 className="text-2xl font-bold sm:text-3xl">Product passports</h1>
        <FeatureGuide text="Use search and status filters to find a batch quickly. Open Passport to view the customer-facing QR journey." />
      </div>
      <p className="mt-2 text-sm text-slate-600">
        Search every registered food batch and its current safety status.
      </p>
      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
        <label className="flex flex-1 items-center gap-2 rounded-xl border border-emerald-950/10 bg-white px-3">
          <Search className="text-slate-400" size={18} />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search batch, product or origin"
            className="w-full bg-transparent py-3 text-sm outline-none"
          />
        </label>
        <select
          value={status}
          onChange={(event) => setStatus(event.target.value)}
          className="rounded-xl border border-emerald-950/10 bg-white px-3 py-3 text-sm"
        >
          <option value="all">All statuses</option>
          <option value="safe">Safe</option>
          <option value="at_risk">At risk</option>
          <option value="critical">Critical</option>
        </select>
      </div>
      <section className="mt-5 overflow-hidden rounded-2xl border border-emerald-950/5 bg-white">
        {batches.length ? (
          batches.map((batch) => (
            <article
              key={batch.id}
              className="flex flex-col gap-4 border-b border-emerald-950/5 p-5 last:border-0 md:flex-row md:items-center md:justify-between"
            >
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="font-bold">{batch.product_name}</h2>
                  <StatusBadge status={batch.current_status} />
                </div>
                <p className="mt-2 text-sm text-slate-600">
                  {batch.public_id} Â· {batch.initial_quantity_kg} kg Â·{" "}
                  {batch.quality_grade}
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  {batch.producer_name}, {batch.origin_name} Â· Registered{" "}
                  {formatDate(batch.created_at)}
                </p>
              </div>
              <div className="flex gap-2">
                <a
                  href={`/trace/${batch.public_id}`}
                  target="_blank"
                  className="flex items-center gap-1 rounded-lg border border-emerald-950/10 px-3 py-2 text-xs font-bold text-forest"
                >
                  <QrCode size={15} /> Passport
                </a>
                <button
                  onClick={() => onReading(batch)}
                  className="flex items-center gap-1 rounded-lg bg-ink px-3 py-2 text-xs font-bold text-white"
                >
                  <Thermometer size={15} /> Add reading
                </button>
              </div>
            </article>
          ))
        ) : (
          <Empty text="No batches match this filter." />
        )}
      </section>
    </>
  );
}
function SafetyCenter({
  alerts,
  batches,
  onReading,
}: {
  alerts: Alert[];
  batches: Batch[];
  onReading: (batch: Batch) => void;
}) {
  const risky = batches.filter((batch) => batch.current_status !== "safe");
  return (
    <>
      <p className="text-xs font-bold tracking-[.15em] text-forest">
        SAFETY & RECALLS
      </p>
      <div className="mt-2 flex items-center gap-2">
        <h1 className="text-2xl font-bold sm:text-3xl">Investigate with context.</h1>
        <FeatureGuide text="Batches marked at risk or critical appear here. Add another reading to confirm the situation and update the safety decision." />
      </div>
      <p className="mt-2 text-sm text-slate-600">
        Critical events create focused recalls for the affected locations and
        preserve evidence for the response.
      </p>
      <div className="mt-6 grid gap-5 lg:grid-cols-2">
        <section className="rounded-2xl border border-emerald-950/5 bg-white p-5">
          <h2 className="font-bold">Batches needing attention</h2>
          <div className="mt-3 divide-y divide-emerald-950/5">
            {risky.length ? (
              risky.map((batch) => (
                <BatchRow key={batch.id} batch={batch} onReading={onReading} />
              ))
            ) : (
              <Empty text="No active risk batches. Keep capturing readings to maintain this view." />
            )}
          </div>
        </section>
        <section className="rounded-2xl border border-emerald-950/5 bg-white p-5">
          <h2 className="font-bold">Recall center</h2>
          <div className="mt-3 space-y-3">
            {alerts.length ? (
              alerts.map((alert) => (
                <article
                  key={alert.id}
                  className="rounded-xl border border-rose-100 bg-rose-50 p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-bold text-rose-900">{alert.title}</p>
                      <p className="mt-1 text-xs text-rose-800">
                        {alert.batch?.product_name ?? "Batch"} Â·{" "}
                        {alert.batch?.public_id}
                      </p>
                    </div>
                    <StatusBadge status={alert.severity} />
                  </div>
                  <p className="mt-3 text-sm text-rose-900/80">
                    {alert.message}
                  </p>
                  {alert.affected_locations?.length > 0 && (
                    <p className="mt-2 flex items-center gap-1 text-xs font-bold text-rose-800">
                      <MapPin size={13} />
                      {alert.affected_locations.join(", ")}
                    </p>
                  )}
                </article>
              ))
            ) : (
              <Empty text="No smart recalls are active." />
            )}
          </div>
        </section>
      </div>
    </>
  );
}
function PassportCard({ batch }: { batch: Batch }) {
  const exportCardRef = useRef<HTMLElement>(null);
  const [downloading, setDownloading] = useState(false);

  const handleDownload = async () => {
    if (!exportCardRef.current || downloading) return;

    try {
      setDownloading(true);
      const card = exportCardRef.current;
      const canvas = await html2canvas(card, {
        backgroundColor: "#0d2b20",
        scale: 2,
        useCORS: true,
        logging: false,
        width: card.offsetWidth,
        height: card.offsetHeight,
        windowWidth: card.offsetWidth,
        windowHeight: card.offsetHeight,
      });
      const link = document.createElement("a");
      link.download = `${batch.public_id}-food-passport-card.png`;
      link.href = canvas.toDataURL("image/png", 1);
      link.click();
    } catch (error) {
      console.error("Could not download passport card", error);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="space-y-3">
      <article
        className="relative overflow-hidden rounded-[26px] bg-[#0d2b20] p-5 text-white shadow-[0_18px_45px_rgba(8,32,24,0.22)] sm:p-6"
      >
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_12%_0%,rgba(195,255,73,0.16),transparent_32%),linear-gradient(135deg,rgba(255,255,255,0.07),transparent_38%)]" />
        <div className="relative flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <QrCode className="shrink-0 text-lime" size={20} />
              <p className="truncate text-xs font-bold tracking-[.13em] text-lime">
                {batch.public_id}
              </p>
            </div>
            <h2 className="mt-4 truncate text-2xl font-extrabold leading-none sm:text-3xl">
              {batch.product_name}
            </h2>
            <p className="mt-4 truncate text-sm font-medium text-emerald-100/80">
              {batch.origin_name} <span className="text-lime/80">&bull;</span>{" "}
              {batch.producer_name}
            </p>
            <a
              href={`/trace/${batch.public_id}`}
              target="_blank"
              rel="noreferrer"
              className="mt-5 inline-flex items-center gap-2 rounded-lg bg-white px-3.5 py-2.5 text-xs font-extrabold text-forest shadow-sm"
            >
              <ExternalLink size={14} /> Open public passport
            </a>
          </div>
          <div className="grid h-[78px] w-[78px] shrink-0 place-items-center rounded-2xl bg-white/[0.12] p-2 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.16),0_12px_24px_rgba(0,0,0,0.18)] backdrop-blur sm:h-[86px] sm:w-[86px]">
            <div className="grid h-full w-full place-items-center rounded-xl bg-[#f6faee] p-1.5 shadow-[inset_0_0_0_1px_rgba(13,43,32,0.08)]">
              <img
                src={`/api/batches/${batch.public_id}/qr`}
                alt={`QR Code for ${batch.product_name}`}
                className="h-full w-full rounded-lg object-contain mix-blend-multiply"
              />
            </div>
          </div>
        </div>
      </article>
      <article
        ref={exportCardRef}
        aria-hidden="true"
        className="pointer-events-none fixed left-[-9999px] top-0 overflow-hidden rounded-[28px] bg-[#0d2b20] px-7 py-6 text-white"
        style={{ width: 560, height: 300 }}
      >
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_12%_0%,rgba(195,255,73,0.16),transparent_34%),linear-gradient(135deg,rgba(255,255,255,0.07),transparent_42%)]" />
        <div className="relative flex h-full items-start justify-between gap-7">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-3">
              <QrCode className="shrink-0 text-lime" size={28} />
              <p className="break-all text-base font-black leading-snug tracking-[.14em] text-lime">
                {batch.public_id}
              </p>
            </div>
            <h2 className="mt-7 line-clamp-2 text-[32px] font-black leading-[1.16]">
              {batch.product_name}
            </h2>
            <p className="mt-5 line-clamp-2 text-lg font-semibold leading-[1.35] text-emerald-100/80">
              {batch.origin_name} <span className="text-lime/85">&bull;</span>{" "}
              {batch.producer_name}
            </p>
            <p className="mt-8 text-sm font-bold uppercase leading-snug tracking-[.18em] text-lime/75">
              Scan to open food passport
            </p>
          </div>
          <div className="grid h-[104px] w-[104px] shrink-0 place-items-center rounded-[24px] bg-white/[0.12] p-3 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.16),0_12px_24px_rgba(0,0,0,0.18)]">
            <div className="grid h-full w-full place-items-center rounded-[16px] bg-[#f6faee] p-2 shadow-[inset_0_0_0_1px_rgba(13,43,32,0.08)]">
              <img
                src={`/api/batches/${batch.public_id}/qr`}
                alt=""
                className="h-full w-full rounded-xl object-contain mix-blend-multiply"
              />
            </div>
          </div>
        </div>
      </article>
      <button
        type="button"
        onClick={handleDownload}
        disabled={downloading}
        className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-emerald-950/10 bg-white px-4 py-3 text-sm font-bold text-forest shadow-sm transition hover:border-forest/25 hover:bg-emerald-50 disabled:cursor-not-allowed disabled:opacity-60"
      >
        <Download size={16} />
        {downloading ? "Preparing card..." : "Download card"}
      </button>
    </div>
  );
}

function PassportCenter({ batches }: { batches: Batch[] }) {
  return (
    <>
      <p className="text-xs font-bold tracking-[.15em] text-forest">
        QR FOOD PASSPORTS
      </p>
      <div className="mt-2 flex items-center gap-2">
        <h1 className="text-2xl font-bold sm:text-3xl">Give every batch an identity.</h1>
        <FeatureGuide text="Open a public passport and turn that link into a QR label for receivers and customers. It only shows that batch's verified journey." />
      </div>
      <p className="mt-2 text-sm text-slate-600">
        Share this public link as a QR code label so customers and receivers can
        see the verified journey.
      </p>
      <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {batches.map((batch) => (
          <PassportCard key={batch.id} batch={batch} />
        ))}
      </div>
      {!batches.length && (
        <Empty text="Register a batch to generate its public food passport." />
      )}
    </>
  );
}
function BatchForm({
  close,
  refresh,
  setNotice,
  saving,
  setSaving,
}: {
  close: () => void;
  refresh: () => Promise<void>;
  setNotice: (notice: string) => void;
  saving: boolean;
  setSaving: (saving: boolean) => void;
}) {
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    const data = new FormData(event.currentTarget);
    
    // Get auth token
    const { token, user } = getAuth();
    if (!token || !user) {
      setNotice("Please log in to register batches.");
      setSaving(false);
      return;
    }
    
    const headers = {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`
    };
    
    try {
      const producerResponse = await fetch("/api/organizations/producers", {
        method: "POST",
        headers,
        body: JSON.stringify({
          name: data.get("producer_name"),
          contact_email: data.get("producer_email"),
          location_name: data.get("origin_name"),
          user_id: user.id,
        }),
      });
      const producer = await producerResponse.json();
      if (!producerResponse.ok) throw new Error(producer.detail || "Failed to create producer");
      
      const response = await fetch("/api/batches", {
        method: "POST",
        headers,
        body: JSON.stringify({
          product_name: data.get("product_name"),
          producer_id: producer.id,
          origin_name: data.get("origin_name"),
          initial_quantity_kg: Number(data.get("quantity")),
          quality_grade: data.get("quality_grade"),
          storage_min_c: Number(data.get("storage_min")),
          storage_max_c: Number(data.get("storage_max")),
          user_id: user.id,
        }),
      });
      const batch = await response.json();
      if (!response.ok) throw new Error(batch.detail || "Failed to create batch");
      setNotice(
        `${batch.public_id} is registered. Its QR food passport is ready.`,
      );
      close();
      await refresh();
    } catch (error) {
      console.error("Batch registration error:", error);
      setNotice(
        error instanceof Error ? error.message : "Could not register batch.",
      );
    } finally {
      setSaving(false);
    }
  };
  return (
    <Modal title="Register a food batch" close={close}>
      <p className="-mt-3 mb-5 text-sm text-slate-600">
        This creates the unique batch ID and public food passport.
      </p>
      <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
        <Field
          name="product_name"
          label="Product name"
          placeholder="Premium Roma Tomatoes"
        />
        <Field
          name="producer_name"
          label="Producer / farm"
          placeholder="Green Valley Farms"
        />
        <Field
          name="producer_email"
          label="Producer email"
          type="email"
          placeholder="farm@example.com"
        />
        <Field
          name="origin_name"
          label="Origin"
          placeholder="Nashik, Maharashtra"
        />
        <Field
          name="quantity"
          label="Quantity (kg)"
          type="number"
          min="0.1"
          placeholder="800"
        />
        <Field
          name="quality_grade"
          label="Quality grade"
          placeholder="Grade A"
        />
        <Field
          name="storage_min"
          label="Storage min Â°C"
          type="number"
          defaultValue="4"
        />
        <Field
          name="storage_max"
          label="Storage max Â°C"
          type="number"
          defaultValue="8"
        />
        <div className="sm:col-span-2 flex justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={close}
            className="rounded-xl px-4 py-3 text-sm font-bold"
          >
            Cancel
          </button>
          <button
            disabled={saving}
            className="rounded-xl bg-forest px-5 py-3 text-sm font-bold text-white disabled:opacity-60"
          >
            {saving ? "Creatingâ€¦" : "Create food passport"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
function ReadingForm({
  batch,
  close,
  refresh,
  setNotice,
  saving,
  setSaving,
}: {
  batch: Batch;
  close: () => void;
  refresh: () => Promise<void>;
  setNotice: (notice: string) => void;
  saving: boolean;
  setSaving: (saving: boolean) => void;
}) {
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    const data = new FormData(event.currentTarget);
    try {
      const reading = await fetch(`/api/batches/${batch.public_id}/readings`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          temperature_c: Number(data.get("temperature")),
          humidity_pct: Number(data.get("humidity")),
          marker_status: data.get("marker_status"),
        }),
      });
      if (!reading.ok) throw new Error("Reading could not be saved.");
      const evaluation = await fetch(
        `/api/batches/${batch.public_id}/evaluate-risk`,
        { method: "POST" },
      );
      const result = await evaluation.json();
      if (!evaluation.ok) throw new Error("Risk could not be evaluated.");
      setNotice(
        `${batch.public_id}: ${result.status.replace("_", " ")} â€” ${result.reasons[0]}`,
      );
      close();
      await refresh();
    } catch (error) {
      setNotice(
        error instanceof Error
          ? error.message
          : "Could not record safety evidence.",
      );
    } finally {
      setSaving(false);
    }
  };
  return (
    <Modal title={`Add safety evidence — ${batch.public_id}`} close={close}>
      <p className="-mt-3 mb-5 text-sm text-slate-600">
        Approved storage range: {batch.storage_min_c}°C to{" "}
        {batch.storage_max_c}°C. Saving this reading immediately evaluates
        risk.
      </p>
      <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
        <Field
          name="temperature"
          label="Temperature Â°C"
          type="number"
          step="0.1"
          placeholder="6"
        />
        <Field
          name="humidity"
          label="Humidity %"
          type="number"
          min="0"
          max="100"
          step="0.1"
          placeholder="65"
        />
        <label className="sm:col-span-2 text-sm font-bold">
          Visual marker
          <select
            name="marker_status"
            className="mt-2 w-full rounded-xl border border-emerald-950/10 bg-white px-3 py-3 font-normal outline-none"
          >
            <option value="intact">Intact</option>
            <option value="tampered">Tampered</option>
            <option value="missing">Missing</option>
            <option value="anomaly">Anomaly detected</option>
          </select>
        </label>
        <div className="sm:col-span-2 flex justify-end gap-2">
          <button
            type="button"
            onClick={close}
            className="rounded-xl px-4 py-3 text-sm font-bold"
          >
            Cancel
          </button>
          <button
            disabled={saving}
            className="rounded-xl bg-ink px-5 py-3 text-sm font-bold text-white disabled:opacity-60"
          >
            {saving ? "Evaluatingâ€¦" : "Save & evaluate"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
function Field({
  label,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & { label: string }) {
  return (
    <label className="text-sm font-bold">
      {label}
      <input
        required
        className="mt-2 w-full rounded-xl border border-emerald-950/10 bg-white px-3 py-3 font-normal outline-none focus:border-forest"
        {...props}
      />
    </label>
  );
}
function Modal({
  title,
  close,
  children,
}: {
  title: string;
  close: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-end bg-ink/50 sm:grid sm:place-items-center sm:p-4">
      <section className="traceeye-modal-sheet max-h-[calc(100vh-5rem)] w-full overflow-y-auto rounded-t-2xl bg-[#fdfcf8] p-4 sm:max-h-[calc(100vh-2rem)] sm:max-w-xl sm:rounded-3xl sm:p-6">
        <div className="mb-5 flex items-start justify-between gap-4">
          <h2 className="text-xl font-bold">{title}</h2>
          <button
            onClick={close}
            className="grid h-9 w-9 place-items-center rounded-lg bg-slate-100"
          >
            <X size={18} />
          </button>
        </div>
        {children}
      </section>
    </div>
  );
}
