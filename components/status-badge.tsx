export function StatusBadge({ status, size = "small" }: { status: string; size?: "small" | "large" }) {
  const styles: Record<string, string> = { 
    safe: "bg-emerald-100 text-emerald-800", 
    at_risk: "bg-amber-100 text-amber-800", 
    critical: "bg-rose-100 text-rose-800", 
    verified: "bg-emerald-100 text-emerald-800", 
    pending: "bg-slate-100 text-slate-700" 
  };
  
  const sizeStyles = size === "large" 
    ? "px-6 py-3 text-sm font-bold" 
    : "px-3 py-1 text-xs font-bold";
    
  return (
    <span className={`inline-flex rounded-full capitalize ${sizeStyles} ${styles[status] || styles.pending}`}>
      {status.replace("_", " ")}
    </span>
  );
}
